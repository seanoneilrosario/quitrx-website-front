import "server-only";

import { cache } from "react";
import { cacheProductCard } from "./cache/card-cache";
import { createSummaryCache } from "./cache/summary-cache";
import { ALL_PRODUCTS_PAGE_SIZE } from "@/lib/catalog/catalog-pagination";
import { unstable_cache } from "next/cache";
import type { QuitHeroProduct } from "./product-types";
import { quitHeroFetch, QUITHERO_CACHE_SECONDS, QUITHERO_CATALOG_CACHE_SECONDS } from "./client";
import { client } from "@/sanity/lib/client";
import { productIsVisible } from "@/lib/catalog/bundles";
import { getQuitHeroProducts, loadQuitHeroProductsPage } from "./products";
import { productIsListedInShop, productMatchesCollectionRules } from "./helpers";
import { filterShopProducts } from "./shop-visibility";
import { COLLECTION_PRODUCT_FIELDS } from "./catalog-fields";
import { visibleProductPage } from "./visible-product-pages";
import type {
  QuitHeroCollection,
  QuitHeroCollectionPage,
  QuitHeroCollectionProduct,
  CollectionRule,
} from "./types";

type QuitHeroCollectionsResponse =
  | QuitHeroCollection[]
  | {
      collections?: QuitHeroCollection[];
      data?: QuitHeroCollection[];
      items?: QuitHeroCollection[];
      pagination?: { totalPages?: number };
    };

function collectionsFrom(payload: QuitHeroCollectionsResponse) {
  if (Array.isArray(payload)) return payload;
  const collections = payload.collections ?? payload.data ?? payload.items;
  if (!Array.isArray(collections)) {
    throw new Error("QuitHero collections response did not contain a collection list.");
  }
  return collections;
}

async function loadQuitHeroCollections() {
  const collections: QuitHeroCollection[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const response = await quitHeroFetch<QuitHeroCollectionsResponse>(
      `/collections?page=${page}&limit=100`,
    );
    collections.push(...collectionsFrom(response));
    const totalPages = Array.isArray(response) ? undefined : response.pagination?.totalPages;
    if (totalPages === undefined) return collections;
    if (!Number.isInteger(totalPages) || totalPages < 0 || totalPages > 100)
      throw new Error("Invalid collection pagination.");
    if (page >= totalPages) return collections;
  }
  throw new Error("Collection pagination limit reached.");
}

export const getFreshQuitHeroCollections = loadQuitHeroCollections;

const getCachedQuitHeroCollections = unstable_cache(
  loadQuitHeroCollections,
  ["quithero-collections-all-pages"],
  {
    revalidate: QUITHERO_CACHE_SECONDS,
    tags: ["quithero-collections"],
  },
);

export const getQuitHeroCollections = cache(getCachedQuitHeroCollections);

export type QuitHeroCollectionFilters = {
  brandId?: string[];
  productTypeId?: string[];
  status?: string[];
  sourceSystem?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  attributeFilters?: string[];
};

async function loadCollectionPage(
  slug: string,
  page: number,
  limit: number,
  filters: QuitHeroCollectionFilters = {},
  fresh = false,
): Promise<QuitHeroCollectionPage> {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.max(
    1,
    Math.min(slug === "all-products" ? ALL_PRODUCTS_PAGE_SIZE : 100, Math.floor(limit)),
  );

  type QuitHeroPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };

  if (slug === "all-products") {
    const { products, total, totalPages } = await loadQuitHeroProductsPage(
      normalizedPage,
      normalizedLimit,
      undefined,
      fresh,
      filters,
    );

    console.log("[All Products Pagination]", {
      page: normalizedPage,
      limit: normalizedLimit,
      products: products.length,
      total,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
    });

    return {
      collection: {
        name: "All Products",
        slug,
      },
      products,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
        hasNextPage: normalizedPage < totalPages,
      },
    };
  }

  const params = new URLSearchParams({
    status: "ACTIVE",
    excludeTags: "NOTOSHOP",
    productFields: COLLECTION_PRODUCT_FIELDS,
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

  const visiblePage = await visibleProductPage(
    `/collections/${encodeURIComponent(slug)}?${params}`,
    normalizedPage,
    normalizedLimit,
    async (backendPage, backendLimit) => {
      const backendParams = new URLSearchParams(params);
      backendParams.set("page", String(backendPage));
      backendParams.set("limit", String(backendLimit));
      const response = await quitHeroFetch<{
        data: {
          id: string;
          name: string;
          slug: string;
          description?: string | null;
          products: QuitHeroProduct[];
        };
        pagination: QuitHeroPagination;
      }>(`/collections/${encodeURIComponent(slug)}?${backendParams}`);
      return {
        collection: { name: response.data.name, slug: response.data.slug },
        products: response.data.products ?? [],
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      };
    },
    fresh,
  );

  return {
    collection: visiblePage.collection!,
    products: visiblePage.products.map(cacheProductCard),
    pagination: visiblePage.pagination,
  };
}

const collectionPageCache = createSummaryCache<QuitHeroCollectionPage>(100);

// Use the same key for server rendering and API requests with empty/reordered filters.
export function normalizeCollectionFilters(filters: QuitHeroCollectionFilters) {
  const normalized: QuitHeroCollectionFilters = {};
  for (const key of [
    "brandId",
    "productTypeId",
    "status",
    "sourceSystem",
    "tags",
    "attributeFilters",
  ] as const) {
    const values = [...new Set(filters[key]?.map((value) => value.trim()).filter(Boolean))].sort();
    if (values.length) normalized[key] = values;
  }
  if (filters.minPrice !== undefined) normalized.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) normalized.maxPrice = filters.maxPrice;
  return normalized;
}

function collectionPage(
  slug: string,
  page: number,
  limit: number,
  filters: QuitHeroCollectionFilters,
  fresh: boolean,
) {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.max(
    1,
    Math.min(slug === "all-products" ? ALL_PRODUCTS_PAGE_SIZE : 100, Math.floor(limit)),
  );
  const normalizedFilters = normalizeCollectionFilters(filters);
  const key = JSON.stringify([slug, normalizedPage, normalizedLimit, normalizedFilters]);
  return collectionPageCache.get(
    key,
    () => loadCollectionPage(slug, normalizedPage, normalizedLimit, normalizedFilters, fresh),
    fresh,
  );
}

// Fresh reads replace the same snapshot used by subsequent normal navigation.
export function getQuitHeroCollectionPage(
  slug: string,
  page: number,
  limit: number,
  filters: QuitHeroCollectionFilters = {},
) {
  return collectionPage(slug, page, limit, filters, true);
}

// Next's Data Cache persists beyond a single server process and serves stale
// catalog results while revalidating. Payment validation never uses this cache.
const getPersistentCollectionPage = unstable_cache(
  (slug: string, page: number, limit: number, filters: QuitHeroCollectionFilters) =>
    collectionPage(slug, page, limit, filters, false),
  ["quithero-collection-pages-v3"],
  { revalidate: QUITHERO_CATALOG_CACHE_SECONDS, tags: ["quithero-catalog-pages"] },
);

export const getFastQuitHeroCollectionPage = cache(
  (slug: string, page: number, limit: number, filters: QuitHeroCollectionFilters = {}) =>
    getPersistentCollectionPage(
      slug,
      Math.max(1, Math.floor(page)),
      Math.max(
        1,
        Math.min(slug === "all-products" ? ALL_PRODUCTS_PAGE_SIZE : 100, Math.floor(limit)),
      ),
      normalizeCollectionFilters(filters),
    ),
);

export async function getQuitHeroCollection(slug: string) {
  if (slug === "all-products") {
    const products = await getQuitHeroProducts();
    return {
      brand: {
        name: "All Products",
        slug: "all-products",
      },
      products,
    };
  }
  const [products, apiCollections, assignment] = await Promise.all([
    getQuitHeroProducts(),
    getQuitHeroCollections().catch(() => []),
    client.withConfig({ useCdn: false }).fetch<{
      title?: string;
      description?: string;
      productIds?: string[];
      selectionMode?: "manual" | "dynamic";
      dynamicTag?: string;
      ruleMatch?: "all" | "any";
      dynamicRules?: CollectionRule[];
    } | null>(`*[_type == "productCollection" && slug.current == $slug][0]{title, description, productIds, selectionMode, dynamicTag, ruleMatch, dynamicRules}`, { slug }, { next: { revalidate: 30 } }),
  ]);
  const apiCollection = apiCollections.find((collection) => collection.slug === slug);
  if (apiCollection) {
    const collectionType = apiCollection.type?.toLowerCase();
    if (collectionType === "dynamic") {
      const apiRules = apiCollection.rules?.length
        ? apiCollection.rules
        : (apiCollection.dynamicRules ?? []);
      const fallbackRules = assignment?.dynamicRules?.length
        ? assignment.dynamicRules
        : assignment?.dynamicTag
          ? [
              {
                field: "tag",
                operator: "equals",
                value: assignment.dynamicTag,
              } satisfies CollectionRule,
            ]
          : [];
      const rules = apiRules.length ? apiRules : fallbackRules;
      const match =
        (apiCollection.match ?? assignment?.ruleMatch)?.toLowerCase() === "any" ? "any" : "all";
      const fallbackIds = new Set(assignment?.productIds ?? []);
      const needsProductFallback =
        !apiRules.length ||
        (rules.some((rule) => rule.field === "tag") &&
          products.some((product) => !product.tags?.length));
      const assignedProducts = products.filter(
        (product) =>
          productMatchesCollectionRules(product, rules, match) ||
          Boolean(needsProductFallback && product.id && fallbackIds.has(product.id)),
      );
      return {
        brand: {
          id: apiCollection.id,
          name: apiCollection.name ?? assignment?.title ?? slug,
          slug,
          description: apiCollection.description ?? assignment?.description,
          logo: apiCollection.image,
        },
        products: assignedProducts,
      };
    }
    const references: QuitHeroCollectionProduct[] = [
      ...(apiCollection.products ?? []),
      ...(apiCollection.productIds ?? []),
    ];
    const assignedProducts = references.length
      ? await filterShopProducts(resolveCollectionProducts(references, products, slug))
      : products.filter((product) => {
          if (apiCollection.id && product.collectionId === apiCollection.id) return true;
          if (apiCollection.id && product.collectionIds?.includes(apiCollection.id)) return true;
          return product.collections?.some((collection) =>
            typeof collection === "string"
              ? collection === apiCollection.id || collection === slug
              : collection.id === apiCollection.id || collection.slug === slug,
          );
        });
    return {
      brand: {
        id: apiCollection.id,
        name: apiCollection.name ?? slug,
        slug,
        description: apiCollection.description,
        logo: apiCollection.image,
      },
      products: assignedProducts,
    };
  }
  if (assignment) {
    const selected = new Set(assignment.productIds ?? []);
    const rules = assignment.dynamicRules?.length
      ? assignment.dynamicRules
      : assignment.dynamicTag
        ? [
            {
              field: "tag",
              operator: "equals",
              value: assignment.dynamicTag,
            } satisfies CollectionRule,
          ]
        : [];
    const assignedProducts =
      assignment.selectionMode === "dynamic"
        ? products.filter((product) =>
            productMatchesCollectionRules(product, rules, assignment.ruleMatch ?? "all"),
          )
        : products.filter((product) => product.id && selected.has(product.id));
    return {
      brand: {
        name: assignment.title ?? slug,
        slug,
        description: assignment.description,
      },
      products: assignedProducts,
    };
  }
  const collectionProducts = products.filter((product) => product.brand?.slug === slug);
  if (!collectionProducts.length) return;

  return {
    brand: collectionProducts[0].brand,
    products: collectionProducts,
  };
}

function resolveCollectionProducts(
  references: QuitHeroCollectionProduct[],
  products: QuitHeroProduct[],
  collectionSlug: string,
) {
  const lookup = new Map<string, QuitHeroProduct>();
  for (const product of products) {
    for (const value of [product.id, product.handle, product.slug, product.sourceId]) {
      if (value) lookup.set(value, product);
    }
  }

  const resolved: QuitHeroProduct[] = [];
  const seen = new Set<string>();
  for (const reference of references) {
    const record = typeof reference === "object" && reference !== null ? reference : undefined;
    const nested = record?.product;
    const identifiers =
      typeof reference === "string"
        ? [reference]
        : [record?.productId, nested?.id, record?._ref, record?.handle, record?.slug, record?.id];
    const product =
      identifiers.flatMap((value) => (value ? [lookup.get(value)] : [])).find(Boolean) ??
      (isCompleteProduct(nested) ? nested : undefined) ??
      (isCompleteProduct(record) ? record : undefined);

    if (!product || !isCompleteProduct(product) || !productIsVisible(product)) {
      console.warn("Unable to resolve collection product.", {
        collectionSlug,
        storedId: typeof reference === "string" ? reference : (record?.productId ?? record?.id),
        handle: record?.handle ?? nested?.handle,
        slug: record?.slug ?? nested?.slug,
        reference: record?._ref,
      });
      continue;
    }

    if (!productIsListedInShop(product)) continue;

    const key = product.id ?? product.handle ?? product.slug!;
    if (!seen.has(key)) {
      seen.add(key);
      resolved.push(product);
    }
  }
  return resolved;
}

function isCompleteProduct(product: QuitHeroProduct | undefined): product is QuitHeroProduct {
  return Boolean(
    product?.name && (product.handle || product.slug) && Array.isArray(product.variants),
  );
}
