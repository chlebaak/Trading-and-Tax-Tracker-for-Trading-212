import { calculateValueTest, buildTimeTestFifo, toCzk } from "./cz-tax";
import type {
  AccountSummary,
  NormalizedPosition,
  Trading212AccountSummary,
  Trading212Position,
  TimeTestSummary,
  ValueTestResult,
} from "./trading212/types";
import { Trading212Client } from "./trading212/client";

const DEFAULT_ACCOUNT_CURRENCY = "CZK";

export interface PortfolioSnapshot {
  positions: NormalizedPosition[];
  valueTestCzk: ValueTestResult;
  timeTestFifo: Record<string, TimeTestSummary>;
  realizedPL: number;
  /** Cost basis of already-sold positions (denominator for realized P/L %). */
  realizedCostBasis: number | null;
  /** Account-level summary from T212 (null when the endpoint fails). */
  account: AccountSummary | null;
  referenceYear: number;
  fetchedAt: string;
  cached: boolean;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeTicker(value: unknown) {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";
  return ticker.length > 0 && ticker !== "UNDEFINED" ? ticker : null;
}

function normalizePosition(
  position: Trading212Position,
): NormalizedPosition | null {
  const rawPosition = getObject(position);
  const instrument = getObject(rawPosition?.instrument);
  const walletImpact = getObject(rawPosition?.walletImpact);

  const ticker =
    normalizeTicker(rawPosition?.ticker) ??
    normalizeTicker(instrument?.ticker) ??
    null;

  if (!ticker) {
    return null;
  }

  const name =
    typeof instrument?.name === "string" && instrument.name.trim().length > 0
      ? instrument.name.trim()
      : null;

  const currentValue =
    normalizeNumber(walletImpact?.currentValue) ??
    normalizeNumber(rawPosition?.currentValue) ??
    normalizeNumber(rawPosition?.marketValue) ??
    normalizeNumber(rawPosition?.value);

  const currentPrice =
    normalizeNumber(rawPosition?.currentPrice) ??
    normalizeNumber(rawPosition?.price) ??
    null;

  const averagePrice =
    normalizeNumber(rawPosition?.averagePricePaid) ??
    normalizeNumber(rawPosition?.averagePrice) ??
    normalizeNumber(rawPosition?.avgPrice);

  const profitLoss =
    normalizeNumber(walletImpact?.unrealizedProfitLoss) ??
    normalizeNumber(rawPosition?.ppl) ??
    normalizeNumber(rawPosition?.profitLoss) ??
    normalizeNumber(rawPosition?.unrealizedPpl) ??
    null;

  const currency =
    typeof walletImpact?.currency === "string"
      ? walletImpact.currency
      : typeof instrument?.currency === "string"
        ? instrument.currency
        : typeof rawPosition?.currency === "string"
          ? rawPosition.currency
          : null;

  return {
    ticker,
    name,
    quantity:
      normalizeNumber(rawPosition?.quantity) ??
      normalizeNumber(rawPosition?.quantityAvailableForTrading) ??
      0,
    averagePrice,
    currentPrice,
    currentValue,
    profitLoss,
    currency: currency ? String(currency).toUpperCase() : null,
  };
}

function computeRealizedStats(orders: unknown[]): {
  realizedPL: number;
  realizedCostBasis: number | null;
} {
  let total = 0;
  let costBasis = 0;
  for (const order of orders) {
    const wrapper = getObject(order);
    // Orders are wrapped as { order: {...}, fill: {...} }
    const orderData = getObject(wrapper?.order) ?? wrapper;
    const fill = getObject(wrapper?.fill);
    const walletImpact = getObject(fill?.walletImpact);

    if (typeof orderData?.side !== "string") continue;
    if (orderData.side.toUpperCase() !== "SELL") continue;

    const realized = normalizeNumber(walletImpact?.realisedProfitLoss);
    if (realized === null) continue;
    total += realized;

    // Cost basis ≈ proceeds(CZK) − realized. Prefer walletImpact.netValue
    // (actual CZK proceeds net of fees); fall back to qty × price converted
    // via the FX table. Note: fill quantities are negative on SELLs.
    let proceedsCzk: number | null = null;
    const netValue = normalizeNumber(walletImpact?.netValue);
    if (netValue != null) {
      proceedsCzk = Math.abs(netValue);
    } else {
      const instrument = getObject(orderData?.instrument);
      const currency =
        typeof instrument?.currency === "string"
          ? instrument.currency
          : undefined;
      const qty = Math.abs(
        normalizeNumber(fill?.quantity) ??
          normalizeNumber(orderData?.filledQuantity) ??
          0,
      );
      const price =
        normalizeNumber(fill?.price) ??
        normalizeNumber(orderData?.executionPrice) ??
        normalizeNumber(orderData?.averagePrice);

      if (qty > 0 && price != null && price > 0) {
        proceedsCzk = toCzk(qty * price, currency);
      }
    }

    if (proceedsCzk != null) {
      costBasis += Math.max(proceedsCzk - realized, 0);
    }
  }

  return {
    realizedPL: Number(total.toFixed(2)),
    realizedCostBasis: costBasis > 0 ? Number(costBasis.toFixed(2)) : null,
  };
}

function normalizeAccountSummary(
  raw: Trading212AccountSummary,
): AccountSummary {
  const cash = getObject(raw.cash);
  const investments = getObject(raw.investments);

  const investmentsValue = normalizeNumber(investments?.currentValue);
  const totalValue = normalizeNumber(raw.totalValue);
  const available = normalizeNumber(cash?.availableToTrade);
  const inPies = normalizeNumber(cash?.inPies);
  const reserved = normalizeNumber(cash?.reservedForOrders);

  let cashTotal: number | null = null;
  if (totalValue != null && investmentsValue != null) {
    cashTotal = Number((totalValue - investmentsValue).toFixed(2));
  } else if (available != null || inPies != null || reserved != null) {
    cashTotal = Number(
      ((available ?? 0) + (inPies ?? 0) + (reserved ?? 0)).toFixed(2),
    );
  }

  return {
    totalValue,
    investmentsValue,
    cashTotal,
    cashAvailable: available,
    cashInPies: inPies,
    cashReserved: reserved,
    unrealizedPL: normalizeNumber(investments?.unrealizedProfitLoss),
    realizedPL: normalizeNumber(investments?.realizedProfitLoss),
    investmentsCost: normalizeNumber(investments?.totalCost),
  };
}

// --- Cache ---

interface CacheEntry {
  data: PortfolioSnapshot;
  expiresAt: number;
}

const snapshotCache = new Map<string, CacheEntry>();

function getCacheTTL(): number {
  const env = process.env.T212_CACHE_TTL_SEC;
  if (env) {
    const parsed = Number(env);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 60; // default 60 seconds
}

function buildCacheKey(
  ticker?: string,
  accountCurrency?: string,
  year?: number,
): string {
  return `${accountCurrency ?? DEFAULT_ACCOUNT_CURRENCY}:${ticker ?? "__all__"}:${year ?? "current"}`;
}

async function fetchFreshSnapshot(options: {
  client: Trading212Client;
  ticker?: string;
  accountCurrency?: string;
  year?: number;
}): Promise<PortfolioSnapshot> {
  const [positions, orders, summaryRaw] = await Promise.all([
    options.client.getPortfolioPositions(),
    options.client.getHistoricalOrders(),
    // Non-fatal: dashboard falls back to positions-derived values
    options.client.getAccountSummary().catch(() => null),
  ]);

  const normalizedPositions = positions
    .map(normalizePosition)
    .filter((position): position is NormalizedPosition => position !== null);
  const accountCurrency = options.accountCurrency ?? DEFAULT_ACCOUNT_CURRENCY;
  const valueTestCzk = calculateValueTest(
    orders,
    accountCurrency,
    options.year,
  );
  const timeTestFifo = buildTimeTestFifo(orders, options.ticker);
  const realizedStats = computeRealizedStats(orders);
  const account = summaryRaw ? normalizeAccountSummary(summaryRaw) : null;

  return {
    positions: normalizedPositions,
    valueTestCzk,
    timeTestFifo,
    realizedPL: account?.realizedPL ?? realizedStats.realizedPL,
    realizedCostBasis: realizedStats.realizedCostBasis,
    account,
    referenceYear:
      options.year ??
      Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Prague",
          year: "numeric",
        }).format(new Date()),
      ),
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
}

export async function buildPortfolioSnapshot(options: {
  client: Trading212Client;
  ticker?: string;
  accountCurrency?: string;
  year?: number;
}): Promise<PortfolioSnapshot> {
  const ttl = getCacheTTL();
  const key = buildCacheKey(
    options.ticker,
    options.accountCurrency,
    options.year,
  );
  const now = Date.now();

  const cached = snapshotCache.get(key);
  if (cached && cached.expiresAt > now) {
    return {
      ...cached.data,
      cached: true,
    };
  }

  const fresh = await fetchFreshSnapshot(options);
  snapshotCache.set(key, {
    data: fresh,
    expiresAt: now + ttl * 1000,
  });

  return fresh;
}

export function clearSnapshotCache(): void {
  snapshotCache.clear();
}
