import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { accountCustomerQuery } from "./account-query";

afterEach(() => vi.unstubAllGlobals());

describe("account API query", () => {
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
