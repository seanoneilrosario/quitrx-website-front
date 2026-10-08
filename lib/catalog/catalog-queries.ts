import { queryOptions } from "@tanstack/react-query";
import type { QuitHeroCollectionPage } from "@/lib/quithero";
import type { ProductDetailData } from "./product-detail-data";
import { API_STALE_TIME } from "@/lib/query/query-cache";
import { COLLECTION_PAGE_SIZE } from "./catalog-pagination";

export type CollectionPageResponse = QuitHeroCollectionPage;
export { COLLECTION_PAGE_SIZE } from "./catalog-pagination";

export type CollectionFilterValue = {
  value: string;
  label?: string;
  count: number;
};

export type CollectionAvailableFilter = {
  key: string;
  label: string;
  type:
    | "BRAND"
    | "PRODUCT_TYPE"
    | "STATUS"
    | "PRICE"
    | "AVAILABILITY"
    | "SOURCE_SYSTEM"
    | "TAG"
    | "ATTRIBUTE";
  attributeId?: string;
  attributeSlug?: string;
  values?: CollectionFilterValue[];
  range?: {
    min: string;
    max: string;
  };
};

export type CollectionAvailableFiltersResponse = {
  data: {
    collection: {
      id: string;
      name: string;
      slug: string;
    };
    filters: CollectionAvailableFilter[];
  };
};

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

export type CollectionPageFilters = {
  brandId?: string[];
  productTypeId?: string[];
  status?: string[];
  sourceSystem?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  attributeFilters?: string[];
};

export function collectionPageQuery(
  slug: string,
  page: number,
  filters: CollectionPageFilters = {},
) {
  const params = new URLSearchParams({
    collectionPage: slug,
    page: String(page),
    limit: String(COLLECTION_PAGE_SIZE),
  });

  filters.brandId?.forEach((value) => {
    params.append("brandId", value);
  });

  filters.productTypeId?.forEach((value) => {
    params.append("productTypeId", value);
  });

  filters.status?.forEach((value) => {
    params.append("status", value);
  });

  filters.sourceSystem?.forEach((value) => {
    params.append("sourceSystem", value);
  });

  filters.tags?.forEach((value) => {
    params.append("tags", value);
  });

  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  filters.attributeFilters?.forEach((value) => {
    params.append("attributeFilters", value);
  });

  return queryOptions({
    queryKey: [
      "api",
      "/api/quithero-products",
      "collection-page-v2",
      slug,
      page,
      COLLECTION_PAGE_SIZE,
      filters,
    ] as const,
    queryFn: ({ signal }) =>
      getCatalogData<CollectionPageResponse>(
        `/api/quithero-products?${params}`,
        signal,
      ),
    staleTime: API_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function collectionAvailableFiltersQuery(
  slug: string,
  filters: CollectionPageFilters = {},
) {
  const params = new URLSearchParams();

  if (filters.brandId?.length) {
    filters.brandId.forEach((value) => {
      params.append('brandId', value);
    });
  }

  if (filters.productTypeId?.length) {
    filters.productTypeId.forEach(
      (value) => {
        params.append(
          'productTypeId',
          value,
        );
      },
    );
  }

  if (filters.status?.length) {
    filters.status.forEach((value) => {
      params.append('status', value);
    });
  }

  if (filters.sourceSystem?.length) {
    filters.sourceSystem.forEach(
      (value) => {
        params.append(
          'sourceSystem',
          value,
        );
      },
    );
  }

  if (filters.tags?.length) {
    filters.tags.forEach((value) => {
      params.append('tags', value);
    });
  }

  if (
    filters.minPrice !== undefined
  ) {
    params.set(
      'minPrice',
      String(filters.minPrice),
    );
  }

  if (
    filters.maxPrice !== undefined
  ) {
    params.set(
      'maxPrice',
      String(filters.maxPrice),
    );
  }

  if (
    filters.attributeFilters?.length
  ) {
    filters.attributeFilters.forEach(
      (value) => {
        params.append(
          'attributeFilters',
          value,
        );
      },
    );
  }

  const query =
    params.toString();

  const url =
    `/api/quithero-collection-filters?collection=${encodeURIComponent(slug)}` +
    (query ? `&${query}` : '');

  return queryOptions({
    queryKey: [
      'api',
      '/api/quithero-collection-filters',
      slug,
      filters,
    ] as const,

    queryFn: ({ signal }) =>
      getCatalogData<CollectionAvailableFiltersResponse>(
        url,
        signal,
        true,
      ),

    staleTime: API_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}