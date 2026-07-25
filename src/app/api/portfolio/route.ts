import { NextResponse, type NextRequest } from "next/server";
import { Trading212ApiError, Trading212Client } from "@/lib/trading212/client";
import { buildPortfolioSnapshot } from "@/lib/portfolio";
import { requireInternalAccess } from "@/lib/internal-access";

function getAccountCurrency() {
  return (process.env.T212_ACCOUNT_CURRENCY ?? "CZK").toUpperCase();
}

export async function GET(request: NextRequest) {
  const access = requireInternalAccess(request);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  try {
    const ticker =
      request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase() ??
      undefined;
    const debug = request.nextUrl.searchParams.get("debug") === "1";
    const client = new Trading212Client({
      baseUrl: process.env.T212_BASE_URL,
      apiKey: process.env.T212_API_KEY,
      apiSecret: process.env.T212_API_SECRET,
    });

    if (debug) {
      const [positionsDebug, ordersDebug] = await Promise.all([
        client.debugEndpoint("/api/v0/equity/positions?limit=50"),
        client.debugEndpoint("/api/v0/equity/history/orders?limit=50"),
      ]);

      return NextResponse.json(
        {
          debug: {
            accountCurrency: getAccountCurrency(),
            baseUrl: process.env.T212_BASE_URL ?? "https://live.trading212.com",
            positionsDebug,
            ordersDebug,
          },
        },
        { status: 200 },
      );
    }

    const snapshot = await buildPortfolioSnapshot({
      client,
      ticker,
      accountCurrency: getAccountCurrency(),
    });

    const response = {
      positions: snapshot.positions,
      valueTestCzk: snapshot.valueTestCzk,
      timeTestFifo: snapshot.timeTestFifo,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Trading212ApiError) {
      const status =
        error.code === "INVALID_API_KEY"
          ? 401
          : error.code === "RATE_LIMITED"
            ? 429
            : 502;

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryAfter: error.retryAfter,
          details: error.details,
        },
        { status },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown portfolio error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
