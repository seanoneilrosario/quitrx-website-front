import { queryOptions } from "@tanstack/react-query";
import type { QuitHeroCollectionPage } from "@/lib/quithero";
import type { ProductDetailData } from "./product-detail-data";
import { API_STALE_TIME } from "@/lib/query/query-cache";
import { COLLECTION_PAGE_SIZE } from "./catalog-pagination";

export type CollectionPageResponse = QuitHeroCollectionPage;
export { COLLECTION_PAGE_SIZE } from "./catalog-pagination";

async function getCatalogData<T>(url: string, signal: AbortSignal, fresh = false): Promise<T> {
  const response = await fetch(url, { signal, ...(fresh ? { cache: "no-store" as const } : {}) });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Product or collection not found."
        : "Unable to load products. Please try again.",
    );
  return (await response.json()) as T;
}

export function catalogListQuery(
  mode: "products" | "collections" = "products",
  collections: string[] = [],
) {
  const params = new URLSearchParams();
  // The same set of filters must share a cache entry regardless of CMS ordering.
  if (mode === "products")
    [...new Set(collections)].sort().forEach((slug) => params.append("collection", slug));
  const url = `/api/quithero-${mode}${params.size ? `?${params}` : ""}`;
  return queryOptions({
    queryKey: ["api", url] as const,
    queryFn: ({ signal }) => getCatalogData<unknown>(url, signal),
    staleTime: API_STALE_TIME,
  });
}

export function productDetailQuery(slug: string) {
  const url = `/api/quithero-products/${encodeURIComponent(slug)}`;
  return queryOptions({
    queryKey: ["api", url] as const,
    queryFn: ({ signal }) => getCatalogData<ProductDetailData>(url, signal),
    staleTime: API_STALE_TIME,
  });
}

export function collectionPageQuery(slug: string, page: number) {
  const params = new URLSearchParams({
    collectionPage: slug,
    page: String(page),
    limit: String(COLLECTION_PAGE_SIZE),
  });
  return queryOptions({
    queryKey: [
      "api",
      "/api/quithero-products",
      "collection-page-v1",
      slug,
      page,
      COLLECTION_PAGE_SIZE,
    ] as const,
    queryFn: ({ signal }) =>
      getCatalogData<CollectionPageResponse>(`/api/quithero-products?${params}`, signal),
    staleTime: API_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
