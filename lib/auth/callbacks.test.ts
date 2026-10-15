import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authCallbacks } from "./callbacks";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  link: vi.fn(),
  sync: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/lib/quithero/customers", () => ({
  findQuitHeroCustomerByOAuth: mocks.lookup,
  linkQuitHeroCustomerOAuth: mocks.link,
  syncQuitHeroCustomer: mocks.sync,
}));
vi.mock("./customer-session", () => ({
  CUSTOMER_SESSION_COOKIE: "quitrx_customer_session",
  verifySignedCustomerSession: mocks.verify,
}));

beforeEach(() => vi.resetAllMocks());

describe("OAuth account handoff", () => {
  it("carries Facebook identity through the token and session when email is absent", async () => {
    const token = await authCallbacks.jwt({
      token: {},
      user: { id: "facebook-user" },
      account: { provider: "facebook", providerAccountId: "fb-123", type: "oauth" },
    } as Parameters<typeof authCallbacks.jwt>[0]);
    const session = await authCallbacks.session({
      token,
      session: { user: { id: "" }, expires: "2099-01-01" },
    } as Parameters<typeof authCallbacks.session>[0]);
    expect(session.user).toMatchObject({
      provider: "facebook",
      providerAccountId: "fb-123",
      needsCustomerEmail: true,
    });
  });

  it("uses the linked customer email when Facebook does not return one", async () => {
    mocks.lookup.mockResolvedValue({ id: "customer-1", email: "verified@example.com" });
    const user = { id: "fb-123", email: null };
    expect(
      await authCallbacks.signIn({
        user,
        account: { provider: "facebook", providerAccountId: "fb-123", type: "oauth" },
      }),
    ).toBe(true);
    expect(user).toEqual({ id: "customer-1", email: "verified@example.com" });
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it("allows a Facebook session without email to reach only the completion page", async () => {
    const session = { user: { id: "fb-123", provider: "facebook" }, expires: "2099-01-01" };
    expect(
      await authCallbacks.authorized({
        auth: session,
        request: new NextRequest("https://example.com/account/auth-popup"),
      }),
    ).toBe(true);
    const result = await authCallbacks.authorized({
      auth: session,
      request: new NextRequest("https://example.com/account"),
    });
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("location")).toBe("https://example.com/account/login");
  });

  it("does not admit an anonymous visitor to the completion page", async () => {
    const result = await authCallbacks.authorized({
      auth: null,
      request: new NextRequest("https://example.com/account/auth-popup"),
    });
    expect(result).toBeInstanceOf(Response);
  });

  it("allows an email-verified customer to access account pages", async () => {
    mocks.verify.mockReturnValue({ email: "verified@example.com" });
    expect(
      await authCallbacks.authorized({
        auth: null,
        request: new NextRequest("https://example.com/account"),
      }),
    ).toBe(true);
  });
});
