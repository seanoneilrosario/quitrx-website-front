import { describe, expect, it } from "vitest";
import { hasTrustedOrigin, isProtectedMutation } from "./request-origin";

describe("storefront mutation protection", () => {
  it.each([
    "/api/account/me",
    "/api/account/logout",
    "/api/account/addresses/123",
    "/api/checkout/discounts",
    "/api/payments/eway",
  ])("protects %s", (path) => {
    expect(isProtectedMutation(path, "POST")).toBe(true);
    expect(isProtectedMutation(path, "PATCH")).toBe(true);
    expect(isProtectedMutation(path, "GET")).toBe(false);
  });

  it.each([
    "/api/auth/callback/google",
    "/api/auth/callback/facebook",
    "/api/payments/eway/callback",
    "/api/payments/eway/cancel",
  ])("preserves external provider return %s", (path) => {
    expect(isProtectedMutation(path, "GET")).toBe(false);
    expect(isProtectedMutation(path, "POST")).toBe(false);
  });

  it.each(["https://quitrx.com.au", "https://preview.vercel.app", "http://localhost:3000"])(
    "allows browser requests on %s",
    (origin) => {
      expect(
        hasTrustedOrigin(
          new Request(`${origin}/api/account/me`, {
            headers: { origin, "sec-fetch-site": "same-origin" },
          }),
        ),
      ).toBe(true);
    },
  );

  it.each([
    undefined,
    "null",
    "https://evil.example",
    "https://quitrx.com.au.evil.example",
    "https://other.quitrx.com.au",
  ])("rejects an untrusted origin %s", (origin) => {
    expect(
      hasTrustedOrigin(
        new Request("https://quitrx.com.au/api/account/me", {
          headers: origin ? { origin } : {},
        }),
      ),
    ).toBe(false);
  });

  it("rejects explicitly cross-site requests even with a matching Origin", () => {
    expect(
      hasTrustedOrigin(
        new Request("https://quitrx.com.au/api/account/me", {
          headers: { origin: "https://quitrx.com.au", "sec-fetch-site": "cross-site" },
        }),
      ),
    ).toBe(false);
  });
});
