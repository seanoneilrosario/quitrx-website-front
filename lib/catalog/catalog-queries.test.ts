import { afterEach, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { collectionPageQuery, productDetailQuery } from "./catalog-queries";

afterEach(() => vi.unstubAllGlobals());

const cachedPage = {
  collection: { name: "One", slug: "one" },
  products: [{ id: "one" }],
  pagination: { page: 1, limit: 15, total: 20, totalPages: 2, hasNextPage: true },
};

it("fetches only the requested page and reuses it on return", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ products: [] }));
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient();
  try {
    await client.fetchQuery(collectionPageQuery("all-products", 3));
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/quithero-products?collectionPage=all-products&page=3&limit=15",
    );
    await client.fetchQuery(collectionPageQuery("all-products", 1));
    await client.fetchQuery(collectionPageQuery("all-products", 3));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every((call) => !call[0].includes("fresh=1"))).toBe(true);
  } finally {
    client.clear();
  }
});

it("keeps pages and collections in separate cache entries", () => {
  expect(collectionPageQuery("one", 1).queryKey).not.toEqual(
    collectionPageQuery("one", 2).queryKey,
  );
  expect(collectionPageQuery("one", 1).queryKey).not.toEqual(
    collectionPageQuery("two", 1).queryKey,
  );
});

it("does not retry failed pages or discard other cached pages", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient();
  const key = collectionPageQuery("one", 1).queryKey;
  client.setQueryData(key, cachedPage);
  try {
    await expect(client.fetchQuery(collectionPageQuery("one", 2))).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(key)).toEqual(cachedPage);
  } finally {
    client.clear();
  }
});

it("reuses seeded data without fetching on reload", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient();
  try {
    const query = collectionPageQuery("one", 2);
    client.setQueryData(query.queryKey, {
      ...cachedPage,
      pagination: { ...cachedPage.pagination, page: 2 },
    });
    await client.fetchQuery(query);
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    client.clear();
  }
});

it("shares product detail requests", async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ product: { id: "one" } }));
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient();
  try {
    await Promise.all([
      client.fetchQuery(productDetailQuery("one")),
      client.fetchQuery(productDetailQuery("one")),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    client.clear();
  }
});
