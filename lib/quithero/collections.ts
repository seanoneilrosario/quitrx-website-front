import "server-only";

import { cache } from "react";
import { cacheProductCard } from "./card-cache";
import { createSummaryCache } from "./summary-cache";
import { ALL_PRODUCTS_PAGE_SIZE } from "@/lib/catalog/catalog-pagination";
import { unstable_cache } from "next/cache";
import type { QuitHeroProduct } from "./product-types";
import { quitHeroFetch, QUITHERO_CACHE_SECONDS } from "./client";
import { client } from "@/sanity/lib/client";
import { productIsVisible } from "@/lib/catalog/bundles";
import { getQuitHeroProducts, loadQuitHeroProductsPage } from "./products";
import { productMatchesCollectionRules } from "./helpers";
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
    };

const COLLECTION_PRODUCT_FIELDS = [
  "id",
  "name",
  "slug",
  "status",
  "brand",
  "productType",
  "variants",
  "images",
  "tags",
].join(",");

function collectionsFrom(payload: QuitHeroCollectionsResponse) {
  if (Array.isArray(payload)) return payload;
  const collections = payload.collections ?? payload.data ?? payload.items;
  if (!Array.isArray(collections)) {
    throw new Error("QuitHero collections response did not contain a collection list.");
  }
  return collections;
}

async function loadQuitHeroCollections() {
  return collectionsFrom(await quitHeroFetch<QuitHeroCollectionsResponse>("/collections"));
}

const getCachedQuitHeroCollections = unstable_cache(
  loadQuitHeroCollections,
  ["quithero-collections"],
  {
    revalidate: QUITHERO_CACHE_SECONDS,
    tags: ["quithero-collections"],
  },
);

export const getQuitHeroCollections = cache(getCachedQuitHeroCollections);

async function loadCollectionPage(
  slug: string,
  page: number,
  limit: number,
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

  const response = await quitHeroFetch<{
    data: {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      products: QuitHeroProduct[];
    };
    pagination: QuitHeroPagination;
  }>(
    `/collections/${encodeURIComponent(slug)}?page=${normalizedPage}&limit=${normalizedLimit}&status=active&productFields=${COLLECTION_PRODUCT_FIELDS}`,
  );

  return {
    collection: {
      name: response.data.name,
      slug: response.data.slug,
    },
    products: (response.data.products ?? []).map(cacheProductCard),
    pagination: response.pagination,
  };
}

const collectionPageCache = createSummaryCache<QuitHeroCollectionPage>(100);

function collectionPage(slug: string, page: number, limit: number, fresh: boolean) {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.max(
    1,
    Math.min(slug === "all-products" ? ALL_PRODUCTS_PAGE_SIZE : 100, Math.floor(limit)),
  );
  const key = JSON.stringify([slug, normalizedPage, normalizedLimit]);
  return collectionPageCache.get(
    key,
    () => loadCollectionPage(slug, normalizedPage, normalizedLimit, fresh),
    fresh,
  );
}

// Fresh reads replace the same snapshot used by subsequent normal navigation.
export function getQuitHeroCollectionPage(slug: string, page: number, limit: number) {
  return collectionPage(slug, page, limit, true);
}
export const getFastQuitHeroCollectionPage = cache((slug: string, page: number, limit: number) =>
  collectionPage(slug, page, limit, false),
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
      ? resolveCollectionProducts(references, products, slug)
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
