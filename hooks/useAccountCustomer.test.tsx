// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AccountCustomerProvider } from "./useAccountCustomer";
import ActiveScriptAccessGuard from "@/components/account/ActiveScriptAccessGuard";
import { accountCustomerQuery } from "@/lib/account/account-query";

const navigation = vi.hoisted(() => ({ pathname: "/", router: { replace: vi.fn() } }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
}));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
const customer = { id: "customer-1", email: "test@example.com", scriptActive: true };

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  navigation.pathname = "/";
  navigation.router.replace.mockReset();
  sessionStorage.clear();
  client = new QueryClient();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.unstubAllGlobals();
});

async function navigate(pathname: string) {
  navigation.pathname = pathname;
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <AccountCustomerProvider>
          {pathname === "/pharmacy" ? (
            <ActiveScriptAccessGuard>Pharmacy content</ActiveScriptAccessGuard>
          ) : (
            <span>Other page</span>
          )}
        </AccountCustomerProvider>
      </QueryClientProvider>,
    );
  });
}

async function resolveRequest(resolve: (response: Response) => void, response: Response) {
  await act(async () => {
    resolve(response);
    await new Promise((done) => setTimeout(done, 20));
  });
}

it("waits for the session check before redirecting a pharmacy visitor with a cached null account", async () => {
  client.setQueryData(accountCustomerQuery.queryKey, null);
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>((done) => (resolve = done))),
  );
  await navigate("/");
  await navigate("/pharmacy");
  expect(navigation.router.replace).not.toHaveBeenCalled();
  expect(container.textContent).not.toContain("Pharmacy content");
  await resolveRequest(resolve, Response.json(customer));
  expect(container.textContent).toContain("Pharmacy content");
  expect(navigation.router.replace).not.toHaveBeenCalled();
});

it("does not clear a valid account on the login route before returning to pharmacy", async () => {
  client.setQueryData(accountCustomerQuery.queryKey, customer);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(customer)));
  await navigate("/account/login");
  expect(client.getQueryData(accountCustomerQuery.queryKey)).toEqual(customer);
  await navigate("/pharmacy");
  expect(navigation.router.replace).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Pharmacy content");
});

it("clears the account and private orders after the logout destination confirms an expired session", async () => {
  client.setQueryData(accountCustomerQuery.queryKey, customer);
  client.setQueryData(["api", "/api/orders", customer.id], [{ id: "private-order" }]);
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>((done) => (resolve = done))),
  );
  await navigate("/account");
  await navigate("/account/login");
  expect(client.getQueryData(accountCustomerQuery.queryKey)).toEqual(customer);
  await resolveRequest(resolve, new Response(null, { status: 401 }));
  expect(client.getQueryData(accountCustomerQuery.queryKey)).toBeNull();
  expect(client.getQueryData(["api", "/api/orders", customer.id])).toBeUndefined();
  expect(sessionStorage.getItem("customerData")).toBeNull();
  expect(navigation.router.replace).not.toHaveBeenCalled();
});

it("redirects a signed-out pharmacy visitor only after the session check finishes", async () => {
  client.setQueryData(accountCustomerQuery.queryKey, null);
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>((done) => (resolve = done))),
  );
  await navigate("/");
  await navigate("/pharmacy");
  expect(navigation.router.replace).not.toHaveBeenCalled();
  await resolveRequest(resolve, new Response(null, { status: 401 }));
  expect(navigation.router.replace).toHaveBeenCalledWith("/account/login?next=%2Fpharmacy");
});
