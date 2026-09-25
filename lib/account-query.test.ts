import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { accountCustomerQuery } from "./account-query";
import type { QuitHeroCustomer } from "./quithero-customers";

afterEach(() => vi.unstubAllGlobals());

describe("account API query", () => {
  it("renders seeded account data without a duplicate browser request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    const observer = new QueryObserver(client, {
      ...accountCustomerQuery,
      initialData: { id: "one", firstName: "Levi" } as QuitHeroCustomer | null,
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      expect(observer.getCurrentResult().data?.firstName).toBe("Levi");
      expect(observer.getCurrentResult().isPending).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { unsubscribe(); client.clear(); }
  });
  it("deduplicates account requests and reuses fresh data", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ id: "customer-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    try {
      const [first, second] = await Promise.all([
        client.fetchQuery(accountCustomerQuery), client.fetchQuery(accountCustomerQuery),
      ]);
      expect(first).toEqual({ id: "customer-1" });
      expect(second).toEqual(first);
      await client.fetchQuery(accountCustomerQuery);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await client.invalidateQueries({ queryKey: accountCustomerQuery.queryKey });
      await client.fetchQuery(accountCustomerQuery);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally { client.clear(); }
  });

  it("clears the cached account on an unauthorized response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const client = new QueryClient();
    try {
      client.setQueryData(accountCustomerQuery.queryKey, () => ({ id: "previous-customer" }));
      await client.invalidateQueries({ queryKey: accountCustomerQuery.queryKey });
      expect(await client.fetchQuery(accountCustomerQuery)).toBeNull();
      expect(client.getQueryData(accountCustomerQuery.queryKey)).toBeNull();
    } finally { client.clear(); }
  });

  it("keeps existing account data when the API temporarily fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const client = new QueryClient();
    try {
      client.setQueryData(accountCustomerQuery.queryKey, () => ({ id: "customer-1" }));
      await client.invalidateQueries({ queryKey: accountCustomerQuery.queryKey });
      await expect(client.fetchQuery({ ...accountCustomerQuery, retry: false })).rejects.toThrow("Unable to load your account.");
      expect(client.getQueryData(accountCustomerQuery.queryKey)).toEqual({ id: "customer-1" });
    } finally { client.clear(); }
  });
});
