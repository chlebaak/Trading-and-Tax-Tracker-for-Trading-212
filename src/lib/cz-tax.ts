import type {
  TimeTestLotBreakdown,
  TimeTestSummary,
  Trading212Order,
  ValueTestResult,
} from "./trading212/types";

const VALUE_TEST_LIMIT_CZK = 100_000;
const TIME_TEST_YEARS = 3;
const PRAGUE_TIME_ZONE = "Europe/Prague";

const FX_LOOKUP: Record<string, number> = {
  CZK: 1,
  EUR: 25.3,
  USD: 23.4,
};

const TAX_FREE_FILL = "#3b82f6";
const TAXABLE_FILL = "#cbd5e1";

interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface LotState {
  purchasedAt: string;
  quantity: number;
}

interface SummaryState {
  ticker: string;
  lots: LotState[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function getObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getOrderRecord(order: Trading212Order) {
  const wrapper = getObject(order);
  return getObject(wrapper?.order) ?? wrapper;
}

function getFillRecord(order: Trading212Order) {
  const wrapper = getObject(order);
  return getObject(wrapper?.fill);
}

function toZonedDateParts(
  date: Date,
  timeZone = PRAGUE_TIME_ZONE,
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

function zonedPartsToUtcDate(parts: ZonedDateParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
}

function getPragueNow() {
  return toZonedDateParts(new Date());
}

function getCutoffForThreeYearsAgo() {
  const now = getPragueNow();

  return zonedPartsToUtcDate({
    ...now,
    year: now.year - TIME_TEST_YEARS,
  });
}

function getStartOfCurrentYearPrague() {
  const now = getPragueNow();

  return zonedPartsToUtcDate({
    year: now.year,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
}

function getTickerFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const instrument = getObject(wrapper?.instrument);

  return (
    normalizeTicker(wrapper?.ticker) ??
    normalizeTicker(instrument?.ticker) ??
    null
  );
}

function getSideFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  return typeof wrapper?.side === "string" ? wrapper.side.toUpperCase() : null;
}

function getStatusFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  return typeof wrapper?.status === "string"
    ? wrapper.status.toUpperCase()
    : null;
}

function getCreatedAtFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const fill = getFillRecord(order);

  const candidate =
    (typeof wrapper?.createdAt === "string" ? wrapper.createdAt : null) ??
    (typeof fill?.filledAt === "string" ? fill.filledAt : null);

  return candidate ? new Date(candidate) : null;
}

function getInstrumentCurrencyFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const instrument = getObject(wrapper?.instrument);
  return typeof instrument?.currency === "string"
    ? instrument.currency.toUpperCase()
    : null;
}

function getCurrencyFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const fill = getFillRecord(order);
  const walletImpact = getObject(fill?.walletImpact);
  const instrument = getObject(wrapper?.instrument);

  return (
    (typeof wrapper?.currency === "string" ? wrapper.currency : null) ??
    (typeof walletImpact?.currency === "string"
      ? walletImpact.currency
      : null) ??
    (typeof instrument?.currency === "string" ? instrument.currency : null) ??
    null
  );
}

function getFilledQuantityFromOrder(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const fill = getFillRecord(order);

  const candidate =
    normalizeNumber(wrapper?.filledQuantity) ??
    normalizeNumber(fill?.quantity) ??
    normalizeNumber(wrapper?.quantity);

  return candidate ? Math.abs(candidate) : 0;
}

function parseOrderDate(order: Trading212Order) {
  const createdAt = getCreatedAtFromOrder(order);
  return createdAt ?? new Date("invalid");
}

function getExecutionPrice(order: Trading212Order) {
  const wrapper = getOrderRecord(order);
  const fill = getFillRecord(order);
  const candidates = [
    normalizeNumber(fill?.price),
    normalizeNumber(wrapper?.executionPrice),
    normalizeNumber(wrapper?.averagePrice),
    normalizeNumber(wrapper?.filledPrice),
    normalizeNumber(wrapper?.price),
    normalizeNumber(wrapper?.limitPrice),
    normalizeNumber(wrapper?.stopPrice),
  ];
  return candidates.find(isFiniteNumber) ?? 0;
}

function convertToCzk(amount: number, currency?: string) {
  const normalizedCurrency = (currency ?? "CZK").toUpperCase();
  const fx = FX_LOOKUP[normalizedCurrency] ?? 1;
  return amount * fx;
}

function isTradeRelevant(order: Trading212Order) {
  const status = getStatusFromOrder(order);
  const side = getSideFromOrder(order);

  return (
    (status === "FILLED" || status === "PARTIALLY_FILLED") &&
    (side === "BUY" || side === "SELL")
  );
}

function normalizeTicker(ticker: unknown) {
  const normalized =
    typeof ticker === "string" ? ticker.trim().toUpperCase() : "";
  return normalized.length > 0 && normalized !== "UNDEFINED"
    ? normalized
    : null;
}

function createEmptySummary(): TimeTestSummary {
  return {
    taxFreeQuantity: 0,
    taxableQuantity: 0,
    totalHeld: 0,
    chartData: [
      { name: "Osvobozeno (>3r)", value: 0, fill: TAX_FREE_FILL },
      { name: "V testu (<3r)", value: 0, fill: TAXABLE_FILL },
    ],
    heldLots: [],
  };
}

function reduceFifoLots(lots: LotState[], sellQuantity: number) {
  let remainingToSell = sellQuantity;

  while (remainingToSell > 0 && lots.length > 0) {
    const oldestLot = lots[0];

    if (oldestLot.quantity > remainingToSell) {
      oldestLot.quantity -= remainingToSell;
      remainingToSell = 0;
      break;
    }

    remainingToSell -= oldestLot.quantity;
    lots.shift();
  }

  return remainingToSell;
}

function summarizeLots(
  ticker: string,
  lots: LotState[],
  now = new Date(),
): TimeTestSummary {
  const cutoff = getCutoffForThreeYearsAgo();
  const currentMoment = now;

  let taxFreeQuantity = 0;
  let taxableQuantity = 0;

  const heldLots: TimeTestLotBreakdown[] = lots.map((lot) => {
    const purchasedAtDate = parseOrderDate({
      createdAt: lot.purchasedAt,
    } as Trading212Order);
    const ageDays = Math.max(
      0,
      Math.floor(
        (currentMoment.getTime() - purchasedAtDate.getTime()) / 86_400_000,
      ),
    );
    const taxFree = purchasedAtDate.getTime() <= cutoff.getTime();

    if (taxFree) {
      taxFreeQuantity += lot.quantity;
    } else {
      taxableQuantity += lot.quantity;
    }

    return {
      purchasedAt: lot.purchasedAt,
      quantity: lot.quantity,
      ageDays,
      taxFree,
    };
  });

  const totalHeld = taxFreeQuantity + taxableQuantity;

  return {
    taxFreeQuantity,
    taxableQuantity,
    totalHeld,
    chartData: [
      { name: "Osvobozeno (>3r)", value: taxFreeQuantity, fill: TAX_FREE_FILL },
      { name: "V testu (<3r)", value: taxableQuantity, fill: TAXABLE_FILL },
    ],
    heldLots,
  };
}

export function calculateValueTest(
  orders: Trading212Order[],
  accountCurrency = "CZK",
): ValueTestResult {
  const startOfYear = getStartOfCurrentYearPrague();

  const totalSold = orders.reduce((sum, order) => {
    if (!isTradeRelevant(order) || getSideFromOrder(order) !== "SELL") {
      return sum;
    }

    const orderDate = parseOrderDate(order);
    if (Number.isNaN(orderDate.getTime())) {
      return sum;
    }

    if (orderDate.getTime() < startOfYear.getTime()) {
      return sum;
    }

    const filledQuantity = getFilledQuantityFromOrder(order);
    if (!Number.isFinite(filledQuantity) || filledQuantity <= 0) {
      return sum;
    }

    const grossProceeds = filledQuantity * getExecutionPrice(order);
    const instrumentCurrency =
      getInstrumentCurrencyFromOrder(order) ?? accountCurrency;
    const grossProceedsCzk = convertToCzk(grossProceeds, instrumentCurrency);

    return sum + grossProceedsCzk;
  }, 0);

  const roundedTotal = Number(totalSold.toFixed(2));

  return {
    totalSold: roundedTotal,
    limit: VALUE_TEST_LIMIT_CZK,
    isUnderLimit: roundedTotal < VALUE_TEST_LIMIT_CZK,
  };
}

export function buildTimeTestFifo(
  orders: Trading212Order[],
  tickerFilter?: string,
): Record<string, TimeTestSummary> {
  const normalizedFilter = tickerFilter ? normalizeTicker(tickerFilter) : null;
  const groupedLots = new Map<string, SummaryState>();

  const sortedOrders = [...orders]
    .filter(isTradeRelevant)
    .filter((order) => getTickerFromOrder(order) !== null)
    .filter((order) =>
      normalizedFilter ? getTickerFromOrder(order) === normalizedFilter : true,
    )
    .sort((left, right) => {
      const leftTime = parseOrderDate(left).getTime();
      const rightTime = parseOrderDate(right).getTime();

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const sideOrder = { BUY: 0, SELL: 1 } as const;
      const leftSide =
        sideOrder[String(left.side).toUpperCase() as keyof typeof sideOrder] ??
        2;
      const rightSide =
        sideOrder[String(right.side).toUpperCase() as keyof typeof sideOrder] ??
        2;

      return leftSide - rightSide;
    });

  for (const order of sortedOrders) {
    const ticker = getTickerFromOrder(order);
    if (!ticker) {
      continue;
    }
    const filledQuantity = getFilledQuantityFromOrder(order);

    if (!Number.isFinite(filledQuantity) || filledQuantity <= 0) {
      continue;
    }

    const existingState = groupedLots.get(ticker) ?? { ticker, lots: [] };

    if (getSideFromOrder(order) === "BUY") {
      existingState.lots.push({
        purchasedAt:
          getCreatedAtFromOrder(order)?.toISOString() ??
          new Date().toISOString(),
        quantity: filledQuantity,
      });
      groupedLots.set(ticker, existingState);
      continue;
    }

    // FIFO step 1: consume the oldest open buy lots first.
    // FIFO step 2: partial fills subtract from the front lot until the sell quantity is exhausted.
    // FIFO step 3: any remaining quantity stays in the queue as the current holdings.
    reduceFifoLots(existingState.lots, filledQuantity);
    groupedLots.set(ticker, existingState);
  }

  if (normalizedFilter && !groupedLots.has(normalizedFilter)) {
    return { [normalizedFilter]: createEmptySummary() };
  }

  const output: Record<string, TimeTestSummary> = {};

  for (const [ticker, state] of groupedLots.entries()) {
    // Filter out floating-point remnants (e.g., 5.55e-17 from partial fills)
    const realLots = state.lots.filter((lot) => lot.quantity > 1e-6);
    if (realLots.length === 0) {
      continue;
    }
    output[ticker] = summarizeLots(ticker, realLots);
  }

  return output;
}

export function getPragueStartOfYear() {
  return getStartOfCurrentYearPrague();
}
