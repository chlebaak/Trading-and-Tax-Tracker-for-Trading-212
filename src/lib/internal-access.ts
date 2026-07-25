import type { NextRequest } from "next/server";

function readAccessToken(request: NextRequest) {
  const headerToken =
    request.headers.get("x-internal-api-key") ??
    request.headers.get("x-api-key");
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  return headerToken ?? bearerToken;
}

export function requireInternalAccess(request: NextRequest) {
  const expectedToken =
    process.env.PORTFOLIO_ROUTE_KEY ?? process.env.T212_API_SECRET;

  if (!expectedToken) {
    return {
      ok: false,
      status: 500,
      error:
        "Missing internal route key. Set PORTFOLIO_ROUTE_KEY or reuse T212_API_SECRET for local development.",
    } as const;
  }

  const providedToken = readAccessToken(request);

  if (!providedToken || providedToken !== expectedToken) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized.",
    } as const;
  }

  return { ok: true } as const;
}
