import type {
  Trading212Order,
  Trading212Page,
  Trading212Position,
} from "./types";

const DEFAULT_BASE_URL = "https://live.trading212.com";

const PAYLOAD_KEYS = [
  "items",
  "results",
  "data",
  "orders",
  "positions",
] as const;

export class Trading212ApiError extends Error {
  readonly status: number;
  readonly code:
    | "MISSING_CREDENTIALS"
    | "INVALID_API_KEY"
    | "RATE_LIMITED"
    | "UPSTREAM_ERROR";
  readonly retryAfter?: number;
  readonly details?: string;

  constructor(
    message: string,
    status: number,
    code: Trading212ApiError["code"],
    options?: { retryAfter?: number; details?: string },
  ) {
    super(message);
    this.name = "Trading212ApiError";
    this.status = status;
    this.code = code;
    this.retryAfter = options?.retryAfter;
    this.details = options?.details;
  }
}

interface Trading212ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  fetchImpl?: typeof fetch;
}

function buildBasicAuthHeader(apiKey: string, apiSecret: string) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

function normalizeBaseUrl(baseUrl?: string) {
  return new URL(baseUrl ?? DEFAULT_BASE_URL).origin;
}

function extractPayloadItems<T>(payload: Trading212Page<T> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of PAYLOAD_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getObjectKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value as Record<string, unknown>);
}

export interface Trading212DebugSummary {
  endpoint: string;
  rawCount: number;
  normalizedCount: number;
  nextPagePath?: string | null;
  sampleKeys: string[];
  sample: Record<string, unknown> | null;
}

export class Trading212Client {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: Trading212ClientConfig) {
    const apiKey = config.apiKey ?? process.env.T212_API_KEY;
    const apiSecret = config.apiSecret ?? process.env.T212_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Trading212ApiError(
        "Missing Trading 212 API credentials.",
        500,
        "MISSING_CREDENTIALS",
      );
    }

    this.baseUrl = normalizeBaseUrl(
      config.baseUrl ?? process.env.T212_BASE_URL,
    );
    this.authHeader = buildBasicAuthHeader(apiKey, apiSecret);
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async getPortfolioPositions(): Promise<Trading212Position[]> {
    return this.fetchAll<Trading212Position>(
      "/api/v0/equity/positions?limit=50",
    );
  }

  async getHistoricalOrders(): Promise<Trading212Order[]> {
    return this.fetchAll<Trading212Order>(
      "/api/v0/equity/history/orders?limit=50",
    );
  }

  async debugEndpoint<T>(path: string): Promise<Trading212DebugSummary[]> {
    const summaries: Trading212DebugSummary[] = [];
    const seen = new Set<string>();
    let nextPath: string | null = path;
    let guard = 0;

    while (nextPath) {
      guard += 1;
      if (guard > 100) {
        throw new Trading212ApiError(
          "Trading 212 pagination exceeded safety limit.",
          502,
          "UPSTREAM_ERROR",
        );
      }

      if (seen.has(nextPath)) {
        throw new Trading212ApiError(
          "Trading 212 pagination loop detected.",
          502,
          "UPSTREAM_ERROR",
        );
      }

      seen.add(nextPath);

      const page: Trading212Page<T> = await this.fetchPage<T>(nextPath);
      const items = extractPayloadItems(page);
      const sample = items[0] ? (items[0] as Record<string, unknown>) : null;

      summaries.push({
        endpoint: nextPath,
        rawCount: items.length,
        normalizedCount: items.length,
        nextPagePath: page.nextPagePath ?? null,
        sampleKeys: sample ? getObjectKeys(sample) : [],
        sample,
      });

      nextPath = page.nextPagePath ?? null;
    }

    return summaries;
  }

  async fetchAll<T>(path: string): Promise<T[]> {
    const collected: T[] = [];
    const seen = new Set<string>();
    let nextPath: string | null = path;
    let guard = 0;

    while (nextPath) {
      guard += 1;
      if (guard > 100) {
        throw new Trading212ApiError(
          "Trading 212 pagination exceeded safety limit.",
          502,
          "UPSTREAM_ERROR",
        );
      }

      if (seen.has(nextPath)) {
        throw new Trading212ApiError(
          "Trading 212 pagination loop detected.",
          502,
          "UPSTREAM_ERROR",
        );
      }

      seen.add(nextPath);

      const response: Trading212Page<T> = await this.fetchPage<T>(nextPath);
      collected.push(...extractPayloadItems(response));
      nextPath = response.nextPagePath ?? null;
    }

    return collected;
  }

  private async fetchPage<T>(path: string): Promise<Trading212Page<T>> {
    const url = path.startsWith("http")
      ? path
      : new URL(path, this.baseUrl).toString();
    const response = await this.fetchImpl(url, {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");

      if (response.status === 401 || response.status === 403) {
        throw new Trading212ApiError(
          "Trading 212 rejected the API credentials.",
          response.status,
          "INVALID_API_KEY",
          { details },
        );
      }

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfter = retryAfterHeader
          ? Number(retryAfterHeader)
          : undefined;

        throw new Trading212ApiError(
          "Trading 212 rate limit exceeded.",
          429,
          "RATE_LIMITED",
          { retryAfter, details },
        );
      }

      throw new Trading212ApiError(
        `Trading 212 request failed with status ${response.status}.`,
        response.status,
        "UPSTREAM_ERROR",
        { details },
      );
    }

    return (await response.json()) as Trading212Page<T>;
  }
}
