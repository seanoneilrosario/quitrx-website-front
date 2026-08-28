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

export type QuitHeroProduct = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  status?: string;
  category?: string;
  productType?: string;
  brand?: QuitHeroBrand;
  images?: QuitHeroImage[];
  variants?: QuitHeroVariant[];
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

export async function getQuitHeroProduct(slug: string) {
  const products = await getQuitHeroProducts();
  return products.find((product) => product.slug === slug);
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
  } | null>(
    `*[_type == "productCollection" && slug.current == $slug][0]{title, description, productIds}`,
    { slug },
  );
  if (assignment) {
    const selected = new Set(assignment.productIds ?? []);
    return {
      brand: {
        name: assignment.title ?? slug,
        slug,
        description: assignment.description,
      },
      products: products.filter((product) => product.id && selected.has(product.id)),
    };
  }
  const collectionProducts = products.filter((product) => product.brand?.slug === slug);
  if (!collectionProducts.length) return;

  return {
    brand: collectionProducts[0].brand,
    products: collectionProducts,
  };
}

export function getPrimaryImage(product: QuitHeroProduct) {
  return product.images?.find((image) => image.isPrimary)?.url || product.images?.[0]?.url;
}

export function getProductPrice(product: QuitHeroProduct) {
  const value = product.variants?.[0]?.price;
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
  }
  return typeof value === "string" ? value : undefined;
}
