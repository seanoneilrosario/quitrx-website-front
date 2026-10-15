import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AuthPopupCompletePage from "./page";
import FacebookLinkForm from "./FacebookLinkForm";
import LoginPopup from "../login/LoginPopup";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), verifiedSession: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/customer-session", () => ({ getCustomerSession: mocks.verifiedSession }));
vi.mock("../login/LoginPopup", () => ({ default: () => null }));
vi.mock("./FacebookLinkForm", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("React", React);
});
afterEach(() => vi.unstubAllGlobals());

it("sends a completed OAuth login to account", async () => {
  mocks.auth.mockResolvedValue({ user: { email: "customer@example.com" } });
  await expect(AuthPopupCompletePage()).rejects.toThrow("redirect:/account");
});

it("requires email verification before offering to link a Facebook identity", async () => {
  mocks.auth.mockResolvedValue({ user: { provider: "facebook", providerAccountId: "fb-123" } });
  const page = await AuthPopupCompletePage();
  expect(page.type).toBe(LoginPopup);
  expect(page.props).toMatchObject({
    facebookLink: true,
    redirectTo: "/account/auth-popup",
    localLoginEnabled: false,
  });
});

it("offers linking only after an email session has been verified", async () => {
  mocks.auth.mockResolvedValue({ user: { provider: "facebook", providerAccountId: "fb-123" } });
  mocks.verifiedSession.mockResolvedValue({ email: "verified@example.com" });
  const page = await AuthPopupCompletePage();
  expect(page.type).toBe(FacebookLinkForm);
  expect(page.props.email).toBe("verified@example.com");
});

it("returns an expired OAuth session to login", async () => {
  mocks.auth.mockResolvedValue(null);
  await expect(AuthPopupCompletePage()).rejects.toThrow("redirect:/account/login");
});
