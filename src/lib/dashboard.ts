import { buildPortfolioSnapshot } from "./portfolio";
import { Trading212Client } from "./trading212/client";

export async function getDashboardData(ticker?: string) {
  const client = new Trading212Client({
    baseUrl: process.env.T212_BASE_URL,
    apiKey: process.env.T212_API_KEY,
    apiSecret: process.env.T212_API_SECRET,
  });

  const accountCurrency = (
    process.env.T212_ACCOUNT_CURRENCY ?? "CZK"
  ).toUpperCase();

  const snapshot = await buildPortfolioSnapshot({
    client,
    ticker,
    accountCurrency,
  });

  return {
    snapshot,
    accountCurrency,
  };
}
