import "server-only";

import { client } from "@/sanity/lib/client";

export type QuitHeroImage = {
  url?: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type QuitHeroVariant = {
  id?: string;
  name?: string;
  sku?: string;
  price?: number | string;
  inventory?: number;
  size?: string;
  color?: string;
  options?: Record<string, string>;
};

export type QuitHeroBrand = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
};

export type QuitHeroTag = { name?: string; slug?: string };
export type QuitHeroProductTag = QuitHeroTag & { tag?: QuitHeroTag };

export type QuitHeroProduct = {
  id?: string;
  name?: string;
  handle?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  status?: string;
  category?: string;
  productType?: string | { name?: string; slug?: string };
  brand?: QuitHeroBrand;
  tags?: Array<QuitHeroProductTag | string>;
  images?: QuitHeroImage[];
  variants?: QuitHeroVariant[];
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

const API_BASE = (process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "");

async function quitHeroFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "x-api-key": apiKey },
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`QuitHero request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

function productsFrom(payload: QuitHeroProductsResponse) {
  if (Array.isArray(payload)) return payload;

  const products = payload.products ?? payload.data ?? payload.items;
  if (!Array.isArray(products)) {
    throw new Error("QuitHero products response did not contain a product list.");
  }

  return products;
}

export async function getQuitHeroProducts() {
  const first = await quitHeroFetch<QuitHeroProductsResponse>("/products?page=1&limit=100");
  const products = productsFrom(first);
  if (Array.isArray(first)) return products;

  const totalPages = Math.max(1, Number(first.pagination?.totalPages) || 1);
  if (totalPages === 1) return products;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      quitHeroFetch<QuitHeroProductsResponse>(`/products?page=${index + 2}&limit=100`),
    ),
  );
  return [products, ...remaining.map(productsFrom)].flat();
}

export async function getQuitHeroProduct(handle: string) {
  const products = await getQuitHeroProducts();
  return products.find((product) => (product.handle ?? product.slug) === handle);
}

export async function getQuitHeroProductById(id: string) {
  const products = await getQuitHeroProducts();
  return products.find((product) => product.id === id);
}

export async function getQuitHeroCollection(slug: string) {
  const products = await getQuitHeroProducts();
  if (slug === "all-products") {
    return {
      brand: {
        name: "All Products",
        slug: "all-products",
      },
      products,
    };
  }
  const assignment = await client.withConfig({ useCdn: false }).fetch<{
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
  );
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
  return product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url;
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
