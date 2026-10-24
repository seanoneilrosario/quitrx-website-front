import { auth } from "@/auth";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
  type NextMiddleware,
} from "next/server";
import { hasTrustedOrigin, isProtectedMutation } from "@/lib/security/request-origin";

const continueAccountRequest: NextMiddleware = () => NextResponse.next();
const accountProxy = auth(continueAccountRequest);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NODE_ENV === "production" && request.nextUrl.pathname === "/customer-debug") {
    return new NextResponse(null, { status: 404 });
  }
  if (isProtectedMutation(request.nextUrl.pathname, request.method) && !hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (request.nextUrl.pathname.startsWith("/account")) return accountProxy(request, event);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/api/account/:path*",
    "/api/checkout/:path*",
    "/api/payments/eway",
    "/customer-debug",
  ],
};
