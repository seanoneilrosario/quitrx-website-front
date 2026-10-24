import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest, NextResponse, type NextFetchEvent } from "next/server";

const mocks = vi.hoisted(() => ({ accountProxy: vi.fn() }));
vi.mock("@/auth", () => ({ auth: () => mocks.accountProxy }));
import { proxy } from "./proxy";

const event = {} as NextFetchEvent;
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.clearAllMocks();
  mocks.accountProxy.mockReturnValue(NextResponse.redirect("https://quitrx.com.au/account/login"));
});

it("preserves account authentication redirects", async () => {
  const request = new NextRequest("https://quitrx.com.au/account/orders");
  const response = await proxy(request, event);
  expect(mocks.accountProxy).toHaveBeenCalledWith(request, event);
  expect(response?.status).toBe(307);
});

it("blocks the production debug page before rendering or loading customer data", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const response = await proxy(new NextRequest("https://quitrx.com.au/customer-debug"), event);
  expect(response?.status).toBe(404);
  expect(mocks.accountProxy).not.toHaveBeenCalled();
});

it("lets same-origin checkout requests reach their existing route authentication", async () => {
  const response = await proxy(
    new NextRequest("https://quitrx.com.au/api/payments/eway", {
      method: "POST",
      headers: { origin: "https://quitrx.com.au" },
    }),
    event,
  );
  expect(response?.headers.get("x-middleware-next")).toBe("1");
  expect(mocks.accountProxy).not.toHaveBeenCalled();
});

it("rejects cross-origin account mutations before any authentication work", async () => {
  const response = await proxy(
    new NextRequest("https://quitrx.com.au/api/account/addresses", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    }),
    event,
  );
  expect(response?.status).toBe(403);
  expect(mocks.accountProxy).not.toHaveBeenCalled();
});
