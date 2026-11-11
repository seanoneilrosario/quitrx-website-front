import { beforeEach, expect, it, vi } from "vitest";
import PrescriptionsPage from "./page";
import RenewalForm from "@/components/sections/forms/RenewalForm";

const mocks = vi.hoisted(() => ({ account: vi.fn(), canRenew: vi.fn() }));

vi.mock("@/lib/account/account-data", () => ({ getInitialAccount: mocks.account }));
vi.mock("@/lib/account/script-access", () => ({ canRenewScript: mocks.canRenew }));
vi.mock("@/components/sections/forms/RenewalForm", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

it("renders the renewal form for an eligible customer", async () => {
  const customer = { id: "customer-1", scriptExpiry: "2026-12-19" };
  mocks.account.mockResolvedValue(customer);
  mocks.canRenew.mockReturnValue(true);

  const page = await PrescriptionsPage();

  expect(mocks.canRenew).toHaveBeenCalledWith(customer);
  expect(page.type).toBe(RenewalForm);
});

it("redirects an ineligible customer to their account", async () => {
  mocks.account.mockResolvedValue({ id: "customer-1", scriptExpiry: "2027-12-19" });
  mocks.canRenew.mockReturnValue(false);

  await expect(PrescriptionsPage()).rejects.toThrow("redirect:/account");
});

it("redirects when no customer record is available", async () => {
  mocks.account.mockResolvedValue(null);
  mocks.canRenew.mockReturnValue(false);

  await expect(PrescriptionsPage()).rejects.toThrow("redirect:/account");
});
