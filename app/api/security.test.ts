import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  session: vi.fn(),
  setSession: vi.fn(),
  sync: vi.fn(),
  link: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/customer-session", () => ({
  getCustomerSession: mocks.session,
  setCustomerSession: mocks.setSession,
}));
vi.mock("@/lib/quithero/customers", () => ({
  syncQuitHeroCustomer: mocks.sync,
  linkQuitHeroCustomerOAuth: mocks.link,
}));
vi.mock("@/lib/quithero", () => ({
  getQuitHeroBundle: vi.fn(),
  getQuitHeroProducts: vi.fn(),
  patchQuitHeroBundle: mocks.patch,
}));
import { PATCH } from "./quithero-bundle/[productId]/[variantId]/route";
import { POST } from "./account/link-facebook/route";

beforeEach(() => vi.resetAllMocks());
const request = () =>
  new Request("https://shop.test/api/account/link-facebook", {
    method: "POST",
    body: JSON.stringify({ email: "owner@example.test" }),
  });
it("rejects all storefront bundle writes without calling the backend", async () => {
  const response = await PATCH();
  expect(response.status).toBe(405);
  expect(mocks.patch).not.toHaveBeenCalled();
});
it.each([undefined, { email: "someone-else@example.test" }])(
  "requires email ownership for Facebook linking",
  async (session) => {
    mocks.auth.mockResolvedValue({ user: { provider: "facebook", providerAccountId: "fb" } });
    mocks.session.mockResolvedValue(session);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.link).not.toHaveBeenCalled();
    expect(mocks.setSession).not.toHaveBeenCalled();
  },
);
it("allows linking with matching verified email and Facebook sessions", async () => {
  mocks.auth.mockResolvedValue({ user: { provider: "facebook", providerAccountId: "fb" } });
  mocks.session.mockResolvedValue({ email: "owner@example.test" });
  mocks.sync.mockResolvedValue({ id: "owner" });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.link).toHaveBeenCalledWith("owner", "facebook", "fb");
});
