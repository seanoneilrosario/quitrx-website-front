import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  oauth: vi.fn(),
  link: vi.fn(),
  sync: vi.fn(),
  cookie: vi.fn(),
}));
vi.mock("next-auth", () => ({ default: (config: unknown) => ({ auth: config }) }));
vi.mock("@/lib/quithero-customers", () => ({
  findQuitHeroCustomerByEmail: mocks.lookup,
  findQuitHeroCustomerByOAuth: mocks.oauth,
  linkQuitHeroCustomerOAuth: mocks.link,
  syncQuitHeroCustomer: mocks.sync,
}));
vi.mock("@/lib/customer-session", () => ({
  CUSTOMER_SESSION_COOKIE: "session",
  verifySignedCustomerSession: mocks.cookie,
}));

import { auth } from "./auth";

const { callbacks } = auth as unknown as {
  callbacks: {
    authorized: (args: unknown) => Promise<boolean | Response>;
    signIn: (args: unknown) => Promise<boolean | string>;
  };
};
const request = (path = "/account") => ({
  nextUrl: new URL(`https://example.com${path}`),
  cookies: { get: () => undefined },
});

beforeEach(() => vi.resetAllMocks());

it("allows a valid OAuth session without duplicating the customer API lookup", async () => {
  expect(await callbacks.authorized({
    auth: { user: { email: "deleted@example.com" } }, request: request(),
  })).toBe(true);
  expect(mocks.lookup).not.toHaveBeenCalled();
});

it("allows a valid signed customer session without duplicating the customer API lookup", async () => {
  mocks.cookie.mockReturnValue({ email: "deleted@example.com" });
  expect(await callbacks.authorized({ auth: null, request: request() })).toBe(true);
  expect(mocks.lookup).not.toHaveBeenCalled();
});

it("allows existing customers and keeps the login route accessible", async () => {
  mocks.lookup.mockResolvedValue({ id: "customer-1" });
  expect(await callbacks.authorized({ auth: { user: { email: "member@example.com" } }, request: request() })).toBe(true);
  mocks.lookup.mockClear();
  expect(await callbacks.authorized({ auth: null, request: request("/account/login") })).toBe(true);
  expect(mocks.lookup).not.toHaveBeenCalled();
});

it("creates and links a customer for a new social login", async () => {
  mocks.sync.mockResolvedValue({ id: "customer-1", email: "new@example.com" });
  const user = { email: "new@example.com" };

  expect(await callbacks.signIn({ user, account: { provider: "google", providerAccountId: "google-1" } })).toBe(true);
  expect(mocks.sync).toHaveBeenCalledWith(user);
  expect(mocks.link).toHaveBeenCalledWith("customer-1", "google", "google-1");
  expect(user).toMatchObject({ id: "customer-1" });
});
