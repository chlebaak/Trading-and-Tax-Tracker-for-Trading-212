export type Trading212Side = "BUY" | "SELL";

export type Trading212OrderStatus =
  | "FILLED"
  | "PARTIALLY_FILLED"
  | "CANCELLED"
  | "REJECTED"
  | string;

export interface Trading212Position {
  ticker: string;
  quantity: number;
  averagePrice?: number;
  currentValue?: number;
  currentPrice?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface Trading212Order {
  createdAt: string;
  side: Trading212Side | string;
  status: Trading212OrderStatus;
  ticker: string;
  filledQuantity: number;
  quantity?: number;
  limitPrice?: number;
  stopPrice?: number;
  executionPrice?: number;
  averagePrice?: number;
  filledPrice?: number;
  price?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface Trading212Page<T> {
  nextPagePath?: string | null;
  items?: T[];
  results?: T[];
  data?: T[];
  orders?: T[];
  positions?: T[];
  [key: string]: unknown;
}

export interface NormalizedPosition {
  ticker: string;
  name: string | null;
  quantity: number;
  averagePrice: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  currency: string | null;
}

export interface ValueTestResult {
  totalSold: number;
  limit: number;
  isUnderLimit: boolean;
}

export interface TimeTestLotBreakdown {
  purchasedAt: string;
  quantity: number;
  ageDays: number;
  taxFree: boolean;
}

export interface TimeTestChartPoint {
  name: string;
  value: number;
  fill: string;
}

export interface TimeTestSummary {
  taxFreeQuantity: number;
  taxableQuantity: number;
  totalHeld: number;
  chartData: TimeTestChartPoint[];
  heldLots: TimeTestLotBreakdown[];
}
