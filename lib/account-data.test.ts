import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), auth: vi.fn(), customer: vi.fn() }));
vi.mock("./customer-session", () => ({ getCustomerSession: mocks.session }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("./quithero-customers", () => ({ findQuitHeroCustomerByEmail: mocks.customer }));

import { getInitialAccount } from "./account-data";

beforeEach(() => vi.resetAllMocks());

describe("initial account render", () => {
  it("loads the signed-in customer's greeting for the server-rendered header", async () => {
    mocks.session.mockResolvedValue({ email: "levi@example.com" });
    mocks.customer.mockResolvedValue({ id: "one", firstName: "Levi" });
    expect(await getInitialAccount()).toMatchObject({ id: "one", firstName: "Levi", email: "levi@example.com" });
    expect(mocks.customer).toHaveBeenCalledTimes(1);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("does not call the customer API for an anonymous visitor", async () => {
    mocks.session.mockResolvedValue(undefined);
    mocks.auth.mockResolvedValue(null);
    expect(await getInitialAccount()).toBeNull();
    expect(mocks.customer).not.toHaveBeenCalled();
  });

  it("uses the verified OAuth name when the customer has no first name", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "levi@example.com", name: "Levi Smith" } });
    mocks.customer.mockResolvedValue({ id: "one" });
    expect(await getInitialAccount()).toMatchObject({ firstName: "Levi", lastName: "Smith" });
  });
});
