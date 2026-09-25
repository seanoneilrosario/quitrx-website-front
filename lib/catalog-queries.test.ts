import { afterEach, describe, expect, it, vi } from "vitest";
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { collectionProductsQuery, productDetailQuery, type CollectionPageResponse } from "./catalog-queries";

afterEach(() => vi.unstubAllGlobals());

function page(number: number, hasNextPage: boolean, products = [{ id: `product-${number}` }]): CollectionPageResponse {
  return { collection: { slug: "brand-a", name: "Brand A" }, products,
    pagination: { page: number, limit: 100, totalPages: 2, hasNextPage } };
}

describe("catalog API queries", () => {
  it("seeds collection data, appends pages, and stops at the end", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json(page(2, false)));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    const observer = new InfiniteQueryObserver(client, {
      ...collectionProductsQuery("brand-a"),
      initialData: { pages: [page(1, true)], pageParams: [1] },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      expect(fetchMock).not.toHaveBeenCalled();
      await observer.fetchNextPage();
      expect(observer.getCurrentResult().data?.pageParams).toEqual([1, 2]);
      expect(observer.getCurrentResult().data?.pages.flatMap((p) => p.products)).toHaveLength(2);
      expect(observer.getCurrentResult().hasNextPage).toBe(false);
      await observer.fetchNextPage();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain("collectionPage=brand-a&page=2&limit=100");
    } finally { unsubscribe(); client.clear(); }
  });

  it("retains loaded products on a failed next page and retries the same page", async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => new Response(null, { status: 502 }))
      .mockImplementationOnce(async () => Response.json(page(2, true, [])));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    const observer = new InfiniteQueryObserver(client, {
      ...collectionProductsQuery("brand-a"), retry: false,
      initialData: { pages: [page(1, true)], pageParams: [1] },
    });
    const unsubscribe = observer.subscribe(() => {});
    try {
      await observer.fetchNextPage();
      expect(observer.getCurrentResult().isFetchNextPageError).toBe(true);
      expect(observer.getCurrentResult().data?.pages).toHaveLength(1);
      await observer.fetchNextPage();
      expect(fetchMock.mock.calls[0][0]).toBe(fetchMock.mock.calls[1][0]);
      expect(observer.getCurrentResult().hasNextPage).toBe(false);
      expect(client.getQueryData(collectionProductsQuery("brand-b").queryKey)).toBeUndefined();
    } finally { unsubscribe(); client.clear(); }
  });

  it("shares product detail requests and keeps different products separate", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ product: { id: "one" } }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    try {
      await Promise.all([client.fetchQuery(productDetailQuery("one")), client.fetchQuery(productDetailQuery("one"))]);
      await client.fetchQuery(productDetailQuery("one"));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await client.fetchQuery(productDetailQuery("two"));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally { client.clear(); }
  });
});
