/** Browser mutations must come from the storefront. OAuth/payment returns are excluded. */
export function isProtectedMutation(pathname: string, method: string) {
  return (
    !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) &&
    (pathname.startsWith("/api/account/") ||
      pathname.startsWith("/api/checkout/") ||
      pathname === "/api/payments/eway")
  );
}

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
