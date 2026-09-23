import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { client } from "@/sanity/lib/client";
import { bundleComponentsFrom } from "./quithero-bundle";
import { FREQUENTLY_BOUGHT_TOGETHER_QUERY } from "./frequently-bought-together";
import type { FrequentlyBoughtTogetherDocument } from "./frequently-bought-together";
import type { QuitHeroProduct, QuitHeroVariant } from "./quithero-types";
import { DEFAULT_PRODUCT_IMAGE } from "./product-image";

export type { QuitHeroBrand, QuitHeroImage, QuitHeroProduct, QuitHeroProductTag, QuitHeroTag, QuitHeroVariant } from "./quithero-types";

type QuitHeroCollectionProduct = string | (QuitHeroProduct & {
  productId?: string;
  _ref?: string;
  product?: QuitHeroProduct;
});

export type QuitHeroCollection = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  type?: string;
  match?: string;
  rules?: CollectionRule[];
  dynamicRules?: CollectionRule[];
  products?: QuitHeroCollectionProduct[];
  productIds?: string[];
};

export type CollectionRule = {
  field: "tag" | "name" | "brand" | "productType" | "status" | "price" | "inventory";
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan";
  value: string;
};

type QuitHeroProductsResponse =
  | QuitHeroProduct[]
  | {
      products?: QuitHeroProduct[];
      data?: QuitHeroProduct[];
      items?: QuitHeroProduct[];
      pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
    };

export type QuitHeroCollectionPage = {
  collection: { name: string; slug: string; description?: string };
  products: QuitHeroProduct[];
  pagination: { page: number; limit: number; totalPages: number; hasNextPage: boolean };
};

type QuitHeroCollectionsResponse =
  | QuitHeroCollection[]
  | { collections?: QuitHeroCollection[]; data?: QuitHeroCollection[]; items?: QuitHeroCollection[] };

const API_BASE = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");
const RETRY_DELAYS_MS = [250, 750];
const QUITHERO_CACHE_SECONDS = 60;
const QUITHERO_CATALOG_CACHE_SECONDS = 300;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelayFrom(response: Response, fallback: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(250, Math.min(seconds * 1_000, 10_000));

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.max(250, Math.min(retryAt - Date.now(), 10_000));
  }

  const resetSeconds = Number(response.headers.get("x-ratelimit-reset"));
  if (response.status === 429 && Number.isFinite(resetSeconds)) {
    return Math.max(250, Math.min(resetSeconds * 1_000, 10_000));
  }

  return fallback;
}

async function quitHeroFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      });
    } catch (error) {
      lastError = error;
      const retryDelay = RETRY_DELAYS_MS[attempt];
      if (retryDelay === undefined) break;
      await delay(retryDelay);
      continue;
    }

    if (response.ok) return response.json() as Promise<T>;

    const error = new Error(`QuitHero request failed with ${response.status}.`);
    if (response.status !== 429 && response.status < 500) throw error;
    lastError = error;
    const retryDelay = RETRY_DELAYS_MS[attempt];
    if (retryDelay === undefined) break;
    await delay(retryDelayFrom(response, retryDelay));
  }

  throw lastError instanceof Error ? lastError : new Error("QuitHero request failed.");
}

function productsFrom(payload: QuitHeroProductsResponse) {
  if (Array.isArray(payload)) return payload;

  const products = payload.products ?? payload.data ?? payload.items;
  if (!Array.isArray(products)) {
    throw new Error("QuitHero products response did not contain a product list.");
  }

  return products;
}

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

const getCachedQuitHeroCollections = unstable_cache(loadQuitHeroCollections, ["quithero-collections"], {
  revalidate: QUITHERO_CACHE_SECONDS,
  tags: ["quithero-collections"],
});

export const getQuitHeroCollections = cache(getCachedQuitHeroCollections);

async function loadQuitHeroProducts() {
  const first = await quitHeroFetch<QuitHeroProductsResponse>("/products?page=1&limit=100");
  const products = productsFrom(first);
  if (Array.isArray(first)) return products;

  const totalPages = Math.max(1, Number(first.pagination?.totalPages) || 1);
  if (totalPages === 1) return products;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map((page) =>
      quitHeroFetch<QuitHeroProductsResponse>(`/products?page=${page}&limit=100`),
    ),
  );
  products.push(...remainingPages.flatMap(productsFrom));
  return products;
}

async function loadQuitHeroProductsPage(page: number, limit: number, search?: string) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) query.set("search", search);
  const payload = await quitHeroFetch<QuitHeroProductsResponse>(`/products?${query}`);
  const products = productsFrom(payload);
  const totalPages = Array.isArray(payload)
    ? 1
    : Math.max(1, Number(payload.pagination?.totalPages) || 1);
  return { products, totalPages };
}

async function hydrateBundleAvailability(products: QuitHeroProduct[]) {
  return Promise.all(products.map(async (product) => {
    if (!productHasTag(product, "bundle") || !product.id || !product.variants?.length) return product;

    const variants = await Promise.all(product.variants.map(async (variant) => {
      if (!variant.id) return variant;
      const bundleVariant = await getQuitHeroBundleVariant(product.id!, variant.id).catch(() => undefined);
      return bundleVariant ? { ...variant, ...bundleVariant } : variant;
    }));

    return { ...product, variants };
  }));
}

export async function getQuitHeroCollectionPage(slug: string, page: number, limit: number): Promise<QuitHeroCollectionPage> {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.max(1, Math.min(20, Math.floor(limit)));
  const resolvedCollection = await getQuitHeroCollection(slug);

  if (resolvedCollection) {
    const collectionProducts = resolvedCollection.products;
    const totalPages = Math.max(1, Math.ceil(collectionProducts.length / normalizedLimit));
    const startIndex = (normalizedPage - 1) * normalizedLimit;

    return {
      collection: {
        name: resolvedCollection.brand?.name ?? slug.replaceAll("-", " "),
        slug,
        description: resolvedCollection.brand?.description,
      },
      products: await hydrateBundleAvailability(collectionProducts.slice(startIndex, startIndex + normalizedLimit)),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages,
        hasNextPage: normalizedPage < totalPages,
      },
    };
  }

  const assignmentPromise = client.withConfig({ useCdn: false }).fetch<{
    title?: string;
    description?: string;
    productIds?: string[];
    selectionMode?: "manual" | "dynamic";
    dynamicTag?: string;
    ruleMatch?: "all" | "any";
    dynamicRules?: CollectionRule[];
  } | null>(
    `*[_type == "productCollection" && slug.current == $slug][0]{title, description, productIds, selectionMode, dynamicTag, ruleMatch, dynamicRules}`,
    { slug },
    { next: { revalidate: 30 } },
  ).catch(() => null);
  const [apiCollections, assignment] = await Promise.all([
    getQuitHeroCollections().catch(() => []),
    assignmentPromise,
  ]);
  const apiCollection = apiCollections.find((collection) => collection.slug === slug);
  const isDefinedCollection = Boolean(apiCollection || assignment || slug === "all-products");
  const search = isDefinedCollection ? undefined : slug.split("-").filter(Boolean).slice(0, 3).join(" ");
  const { products: batch, totalPages } = await loadQuitHeroProductsPage(normalizedPage, normalizedLimit, search);

  let products = batch;
  let knownCollectionTotal: number | undefined;
  if (apiCollection?.type?.toLowerCase() === "dynamic") {
    const apiRules = apiCollection.rules?.length ? apiCollection.rules : apiCollection.dynamicRules ?? [];
    const fallbackRules = assignment?.dynamicRules?.length
      ? assignment.dynamicRules
      : assignment?.dynamicTag
        ? [{ field: "tag", operator: "equals", value: assignment.dynamicTag } satisfies CollectionRule]
        : [];
    const rules = apiRules.length ? apiRules : fallbackRules;
    const match = (apiCollection.match ?? assignment?.ruleMatch)?.toLowerCase() === "any" ? "any" : "all";
    const fallbackIds = new Set(assignment?.productIds ?? []);
    const needsProductFallback = !apiRules.length || rules.some((rule) => rule.field === "tag")
      && batch.some((product) => !product.tags?.length);
    products = batch.filter((product) => productMatchesCollectionRules(product, rules, match)
      || Boolean(needsProductFallback && product.id && fallbackIds.has(product.id)));
  } else if (apiCollection) {
    const references: QuitHeroCollectionProduct[] = [...(apiCollection.products ?? []), ...(apiCollection.productIds ?? [])];
    const identifiers = new Set(references.flatMap((reference) => {
      if (typeof reference === "string") return [reference];
      return [reference.productId, reference._ref, reference.product?.id, reference.id].filter((value): value is string => Boolean(value));
    }));
    knownCollectionTotal = identifiers.size;
    products = batch.filter((product) => [product.id, product.sourceId, product.handle, product.slug].some((id) => id && identifiers.has(id)));
  } else if (assignment) {
    const selected = new Set(assignment.productIds ?? []);
    const rules = assignment.dynamicRules?.length
      ? assignment.dynamicRules
      : assignment.dynamicTag
        ? [{ field: "tag", operator: "equals", value: assignment.dynamicTag } satisfies CollectionRule]
        : [];
    products = assignment.selectionMode === "dynamic"
      ? batch.filter((product) => productMatchesCollectionRules(product, rules, assignment.ruleMatch ?? "all"))
      : batch.filter((product) => Boolean(product.id && selected.has(product.id)));
    if (assignment.selectionMode !== "dynamic") knownCollectionTotal = selected.size;
  } else if (slug !== "all-products") {
    products = batch.filter((product) => product.brand?.slug === slug);
  }

  return {
    collection: {
      name: apiCollection?.name ?? assignment?.title ?? (slug === "all-products" ? "All Products" : slug.replaceAll("-", " ")),
      slug,
      description: apiCollection?.description ?? assignment?.description,
    },
    products: await hydrateBundleAvailability(products),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages,
      hasNextPage: normalizedPage < totalPages
        && (knownCollectionTotal === undefined || products.length < knownCollectionTotal),
    },
  };
}

const getCachedQuitHeroCollectionPage = unstable_cache(
  getQuitHeroCollectionPage,
  ["quithero-collection-page"],
  { revalidate: QUITHERO_CATALOG_CACHE_SECONDS, tags: ["quithero-products", "quithero-collections"] },
);

export const getFastQuitHeroCollectionPage = cache(getCachedQuitHeroCollectionPage);

export async function getFreshQuitHeroProducts() {
  return loadQuitHeroProducts();
}

export type QuitHeroOrderPayload = {
  source: "NATIVE";
  currencyCode: "AUD";
  subtotal: number;
  total: number;
  customerId: string;
  items: Array<{ variantId: string; quantity: number }>;
};

export type QuitHeroOrder = {
  id?: string;
  customerId?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  currencyCode?: string;
  total?: number | string;
  createdAt?: string;
  items?: Array<{
    variantId?: string;
    quantity?: number;
    productName?: string;
    variantName?: string;
    sku?: string;
    price?: number | string;
    total?: number | string;
  }>;
};

type QuitHeroOrdersResponse = {
  data?: QuitHeroOrder[];
  orders?: QuitHeroOrder[];
  items?: QuitHeroOrder[];
};

export async function getQuitHeroOrdersForCustomer(customerId: string) {
  const response = await quitHeroFetch<QuitHeroOrdersResponse>(
    `/orders?customerId=${encodeURIComponent(customerId)}&page=1&limit=50`,
  );
  return response.data ?? response.orders ?? response.items ?? [];
}

export async function createQuitHeroOrder(payload: QuitHeroOrderPayload) {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await response.text();
  let parsed: unknown;
  try { parsed = body ? JSON.parse(body) : undefined; } catch { parsed = undefined; }
  if (!response.ok) throw new Error(`QuitHero order creation failed with ${response.status}.`);
  return parsed;
}

export async function findRecentlyCreatedQuitHeroOrder(
  payload: QuitHeroOrderPayload,
  createdAfter: number,
) {
  const response = await quitHeroFetch<QuitHeroOrdersResponse>("/orders?page=1&limit=25");
  const orders = response.data ?? response.orders ?? response.items ?? [];
  const requestedItems = new Map(payload.items.map((item) => [item.variantId, item.quantity]));

  return orders.find((order) => {
    const createdAt = Date.parse(order.createdAt ?? "");
    if (order.customerId !== payload.customerId || !Number.isFinite(createdAt) || createdAt < createdAfter) return false;
    if (Math.abs(Number(order.total) - payload.total) > 0.001 || order.items?.length !== payload.items.length) return false;
    return order.items.every((item) => item.variantId && requestedItems.get(item.variantId) === Number(item.quantity));
  });
}

const getCachedQuitHeroProducts = unstable_cache(loadQuitHeroProducts, ["quithero-products"], {
  revalidate: QUITHERO_CATALOG_CACHE_SECONDS,
  tags: ["quithero-products"],
});

export const getQuitHeroProducts = cache(getCachedQuitHeroProducts);

async function loadQuitHeroProduct(handle: string) {
  const searchTerm = handle.split("-").filter(Boolean).slice(0, 3).join(" ") || handle;
  const response = await quitHeroFetch<QuitHeroProductsResponse>(
    `/products?search=${encodeURIComponent(searchTerm)}&page=1&limit=100`,
  );
  const products = productsFrom(response);
  const match = products.find((product) => product.handle === handle || product.slug === handle);
  if (match) return match;

  // Preserve support for unusual slugs that cannot be derived from the product name.
  const catalog = await getQuitHeroProducts();
  return catalog.find((product) => product.handle === handle || product.slug === handle);
}

const getCachedQuitHeroProduct = unstable_cache(loadQuitHeroProduct, ["quithero-product"], {
  revalidate: QUITHERO_CACHE_SECONDS,
  tags: ["quithero-products"],
});

export const getQuitHeroProduct = cache(getCachedQuitHeroProduct);

export const getQuitHeroProductWhenReady = cache(async function getQuitHeroProductWhenReady(handle: string) {
  const cachedProduct = await getQuitHeroProduct(handle);
  if (cachedProduct) return cachedProduct;

  // A newly synced product can be missing from the short-lived product cache.
  // Check fresh API data before treating the URL as a genuine 404.
  await delay(750);
  return loadQuitHeroProduct(handle);
});

export const getQuitHeroProductById = cache(async function getQuitHeroProductById(id: string) {
  const products = await getQuitHeroProducts();
  return products.find((product) => product.id === id);
});

export async function getFrequentlyBoughtTogetherIds(productId: string) {
  const recommendation = await client.withConfig({ useCdn: false }).fetch<FrequentlyBoughtTogetherDocument | null>(
    FREQUENTLY_BOUGHT_TOGETHER_QUERY,
    { productId },
    { next: { revalidate: 30 } },
  );
  return Array.isArray(recommendation?.relatedProductIds) ? recommendation.relatedProductIds : [];
}

export async function getQuitHeroBundle(productId: string, variantId: string) {
  const payload = await getQuitHeroBundleVariant(productId, variantId);
  return bundleComponentsFrom(payload);
}

export async function getQuitHeroBundleVariant(productId: string, variantId: string) {
  return quitHeroFetch<QuitHeroVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/bundle`,
  );
}

export async function patchQuitHeroBundle(
  productId: string,
  variantId: string,
  bundlePayload: Array<{ componentVariantId: string; position: number; quantity: number }>,
) {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  const response = await fetch(
    `${API_BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/bundle`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(bundlePayload),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const apiResponse = await response.text();
    console.error("Quit Hero bundle PATCH failed:", response.status, apiResponse);
    throw new Error(`QuitHero bundle PATCH failed with ${response.status}.`);
  }
}

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
    } | null>(
      `*[_type == "productCollection" && slug.current == $slug][0]{title, description, productIds, selectionMode, dynamicTag, ruleMatch, dynamicRules}`,
      { slug },
      { next: { revalidate: 30 } },
    ),
  ]);
  const apiCollection = apiCollections.find((collection) => collection.slug === slug);
  if (apiCollection) {
    const collectionType = apiCollection.type?.toLowerCase();
    if (collectionType === "dynamic") {
      const apiRules = apiCollection.rules?.length ? apiCollection.rules : apiCollection.dynamicRules ?? [];
      const fallbackRules = assignment?.dynamicRules?.length
        ? assignment.dynamicRules
        : assignment?.dynamicTag
          ? [{ field: "tag", operator: "equals", value: assignment.dynamicTag } satisfies CollectionRule]
          : [];
      const rules = apiRules.length ? apiRules : fallbackRules;
      const match = (apiCollection.match ?? assignment?.ruleMatch)?.toLowerCase() === "any"
        ? "any"
        : "all";
      const fallbackIds = new Set(assignment?.productIds ?? []);
      const needsProductFallback = !apiRules.length || rules.some((rule) => rule.field === "tag")
        && products.some((product) => !product.tags?.length);
      const assignedProducts = products.filter((product) =>
        productMatchesCollectionRules(product, rules, match)
        || Boolean(needsProductFallback && product.id && fallbackIds.has(product.id)),
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
    const rules = assignment.dynamicRules?.length ? assignment.dynamicRules : assignment.dynamicTag ? [{ field: "tag", operator: "equals", value: assignment.dynamicTag } satisfies CollectionRule] : [];
    const assignedProducts = assignment.selectionMode === "dynamic"
      ? products.filter((product) => productMatchesCollectionRules(product, rules, assignment.ruleMatch ?? "all"))
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
    const identifiers = typeof reference === "string"
      ? [reference]
      : [record?.productId, nested?.id, record?._ref, record?.handle, record?.slug, record?.id];
    const product = identifiers.flatMap((value) => value ? [lookup.get(value)] : []).find(Boolean)
      ?? (isCompleteProduct(nested) ? nested : undefined)
      ?? (isCompleteProduct(record) ? record : undefined);

    if (!product || !isCompleteProduct(product)) {
      console.warn("Unable to resolve collection product.", {
        collectionSlug,
        storedId: typeof reference === "string" ? reference : record?.productId ?? record?.id,
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
  return Boolean(product?.name && (product.handle || product.slug) && Array.isArray(product.variants));
}

export function productHasTag(product: Pick<QuitHeroProduct, "tags">, expectedTag: string) {
  const expected = expectedTag.trim().toLowerCase();
  if (!expected) return false;
  return product.tags?.some((tag) => {
    if (typeof tag === "string") return tag.trim().toLowerCase() === expected;
    return [tag.name, tag.slug, tag.tag?.name, tag.tag?.slug]
      .some((value) => value?.trim().toLowerCase() === expected);
  }) ?? false;
}

function textCondition(actual: string, operator: CollectionRule["operator"], expected: string) {
  const left = actual.trim().toLowerCase();
  const right = expected.trim().toLowerCase();
  if (operator === "notEquals") return left !== right;
  if (operator === "contains") return left.includes(right);
  if (operator === "notContains") return !left.includes(right);
  return left === right;
}

export function productMatchesCollectionRule(product: QuitHeroProduct, rule: CollectionRule) {
  if (rule.field === "tag") {
    const matches = productHasTag(product, rule.value);
    return rule.operator === "notEquals" || rule.operator === "notContains" ? !matches : matches;
  }
  if (rule.field === "price" || rule.field === "inventory") {
    const expected = Number(rule.value);
    if (!Number.isFinite(expected)) return false;
    if (rule.field === "price") {
      const prices = getVariantPrices(product);
      if (!prices.length) return false;
      if (rule.operator === "greaterThan") return prices.some((price) => price > expected);
      if (rule.operator === "lessThan") return prices.some((price) => price < expected);
      if (rule.operator === "notEquals") return prices.every((price) => price !== expected);
      return prices.some((price) => price === expected);
    }
    const actual = (product.variants ?? []).reduce((sum, variant) => sum + Number(variant.inventory ?? 0), 0);
    if (rule.operator === "greaterThan") return actual > expected;
    if (rule.operator === "lessThan") return actual < expected;
    if (rule.operator === "notEquals") return actual !== expected;
    return actual === expected;
  }
  const productType = typeof product.productType === "string" ? product.productType : product.productType?.name ?? product.productType?.slug ?? "";
  const actual = rule.field === "name" ? product.name ?? ""
    : rule.field === "brand" ? product.brand?.name ?? product.brand?.slug ?? ""
    : rule.field === "productType" ? productType
    : product.status ?? "";
  return textCondition(actual, rule.operator, rule.value);
}

export function productMatchesCollectionRules(product: QuitHeroProduct, rules: CollectionRule[], match: "all" | "any") {
  if (!rules.length) return false;
  return match === "any"
    ? rules.some((rule) => productMatchesCollectionRule(product, rule))
    : rules.every((rule) => productMatchesCollectionRule(product, rule));
}

export function getPrimaryImage(product: QuitHeroProduct) {
  return product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url || DEFAULT_PRODUCT_IMAGE;
}

export function getVariantPrices(product: Pick<QuitHeroProduct, "variants">) {
  return (product.variants ?? []).flatMap((variant) => {
    if (typeof variant.price === "number") return Number.isFinite(variant.price) ? [variant.price] : [];
    if (!variant.price?.trim()) return [];
    const price = Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(price) ? [price] : [];
  });
}

export function getProductPrice(product: QuitHeroProduct) {
  const prices = getVariantPrices(product);
  if (!prices.length) return;
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return minimum === maximum ? formatter.format(minimum) : `${formatter.format(minimum)}–${formatter.format(maximum)}`;
}
