import { calculateValueTest, buildTimeTestFifo } from "./cz-tax";
import type {
  NormalizedPosition,
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

function computeRealizedPL(orders: unknown[]): number {
  let total = 0;
  for (const order of orders) {
    const wrapper = getObject(order);
    // Orders are wrapped as { order: {...}, fill: {...} }
    const orderData = getObject(wrapper?.order) ?? wrapper;
    const fill = getObject(wrapper?.fill);
    const walletImpact = getObject(fill?.walletImpact);

    if (typeof orderData?.side !== "string") continue;
    if (orderData.side.toUpperCase() !== "SELL") continue;

    const realized = normalizeNumber(walletImpact?.realisedProfitLoss);
    if (realized !== null) {
      total += realized;
    }
  }
  return Number(total.toFixed(2));
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

function buildCacheKey(ticker?: string, accountCurrency?: string): string {
  return `${accountCurrency ?? DEFAULT_ACCOUNT_CURRENCY}:${ticker ?? "__all__"}`;
}

async function fetchFreshSnapshot(options: {
  client: Trading212Client;
  ticker?: string;
  accountCurrency?: string;
}): Promise<PortfolioSnapshot> {
  const [positions, orders] = await Promise.all([
    options.client.getPortfolioPositions(),
    options.client.getHistoricalOrders(),
  ]);

  const normalizedPositions = positions
    .map(normalizePosition)
    .filter((position): position is NormalizedPosition => position !== null);
  const accountCurrency = options.accountCurrency ?? DEFAULT_ACCOUNT_CURRENCY;
  const valueTestCzk = calculateValueTest(orders, accountCurrency);
  const timeTestFifo = buildTimeTestFifo(orders, options.ticker);
  const realizedPL = computeRealizedPL(orders);

  return {
    positions: normalizedPositions,
    valueTestCzk,
    timeTestFifo,
    realizedPL,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
}

export async function buildPortfolioSnapshot(options: {
  client: Trading212Client;
  ticker?: string;
  accountCurrency?: string;
}): Promise<PortfolioSnapshot> {
  const ttl = getCacheTTL();
  const key = buildCacheKey(options.ticker, options.accountCurrency);
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
