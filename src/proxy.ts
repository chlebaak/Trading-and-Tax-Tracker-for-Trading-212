import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  // No password set — allow all access (dev mode)
  if (!password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    // Basic auth: "Basic base64(username:password)"
    const encoded = authHeader.split(" ")[1];
    if (encoded) {
      const decoded = Buffer.from(encoded, "base64").toString();
      const [, providedPassword] = decoded.split(":");
      if (providedPassword === password) {
        return NextResponse.next();
      }
    }
  }

  // Prompt for credentials
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="T212 Dashboard", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    // Protect all routes except:
    // - /api/* (has its own auth)
    // - /_next/* (static assets)
    // - /favicon.ico
    "/((?!api|_next|favicon.ico).*)",
  ],
};
