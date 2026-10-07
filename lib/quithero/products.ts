import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { QuitHeroProduct, QuitHeroImage, QuitHeroVariant } from "./product-types";
import { quitHeroFetch, QUITHERO_CACHE_SECONDS, QUITHERO_CATALOG_CACHE_SECONDS } from "./client";
import { productIsVisible } from "@/lib/catalog/bundles";
import { productCardCache } from "./card-cache";
import { toCollectionProduct } from "@/lib/catalog/collection-product";

type QuitHeroProductsResponse =
  | QuitHeroProduct[]
  | {
      products?: QuitHeroProduct[];
      data?: QuitHeroProduct[];
      items?: QuitHeroProduct[];
      pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
    };

function productsFrom(payload: QuitHeroProductsResponse) {
  if (Array.isArray(payload)) return payload;

  const products = payload.products ?? payload.data ?? payload.items;

  if (!Array.isArray(products)) {
    throw new Error("QuitHero products response did not contain a product list.");
  }

  return products;
}

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

async function loadProductRelation<T>(
  path: string,
  productId: string,
  beforeRequest: () => void,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const params = new URLSearchParams({ productId, page: String(page), limit: "100" });
    const response = await quitHeroFetch<{ data: T[]; pagination?: { totalPages?: number } }>(
      `${path}?${params}`,
      { beforeRequest },
    );
    items.push(...response.data);
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

export async function loadQuitHeroProductsPage(
  page: number,
  limit: number,
  search?: string,
  fresh = false,
) {
  // Count actual network attempts, including retries and relation pagination.
  let requests = 0;
  const beforeRequest = () => {
    if (requests >= 100)
      throw new Error("Collection request limit reached. Please try again later.");
    requests += 1;
  };
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status: "active",
  });

  if (search) query.set("search", search);

  const payload = await quitHeroFetch<QuitHeroProductsResponse>(`/products?${query}`, {
    beforeRequest,
  });

  const listedProducts = productsFrom(payload);
  const products: QuitHeroProduct[] = [];

  // /products is a scalar-only list. Load only the missing card relations for
  // this page, with bounded concurrency; never fetch product detail endpoints.
  for (const product of listedProducts) {
    if (!product.id) {
      products.push(toCollectionProduct(product));
      continue;
    }
    const productId = product.id;
    const card = await productCardCache.get(
      productId,
      async () => {
        const [images, variants] = await Promise.all([
          product.images ??
            loadProductRelation<QuitHeroImage>("/product-images", productId, beforeRequest),
          product.variants ??
            loadProductRelation<QuitHeroVariant>("/product-variants", productId, beforeRequest),
        ]);
        return toCollectionProduct({ ...product, images, variants });
      },
      fresh,
    );
    products.push(card);
  }

  const total = Array.isArray(payload)
    ? products.length
    : Number(payload.pagination?.total) || products.length;

  const totalPages = Array.isArray(payload)
    ? 1
    : Math.max(1, Number(payload.pagination?.totalPages) || 1);

  return {
    products,
    total,
    totalPages,
  };
}

export async function getFreshQuitHeroProducts() {
  return loadQuitHeroProducts();
}

const getCachedQuitHeroProducts = unstable_cache(loadQuitHeroProducts, ["quithero-products"], {
  revalidate: QUITHERO_CATALOG_CACHE_SECONDS,
  tags: ["quithero-products"],
});

export const getQuitHeroProducts = cache(getCachedQuitHeroProducts);

const getCachedQuitHeroProduct = unstable_cache(
  async (handle: string) => {
    try {
      const response = await quitHeroFetch<{ data: QuitHeroProduct }>(
        `/products/${encodeURIComponent(handle)}`,
      );

      const product = response.data ?? undefined;
      return product && productIsVisible(product) ? product : undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return undefined;
      }

      throw error;
    }
  },
  ["quithero-product-by-handle"],
  {
    revalidate: QUITHERO_CACHE_SECONDS,
    tags: ["quithero-products"],
  },
);

export const getQuitHeroProduct = cache(async (handle: string) => getCachedQuitHeroProduct(handle));

async function loadQuitHeroProductById(id: string) {
  return quitHeroFetch<QuitHeroProduct>(`/products/${encodeURIComponent(id)}`);
}

function getCachedQuitHeroProductById(id: string) {
  return unstable_cache(() => loadQuitHeroProductById(id), ["quithero-product", id], {
    revalidate: QUITHERO_CACHE_SECONDS,
    tags: ["quithero-products"],
  })();
}

export const getQuitHeroProductById = cache(getCachedQuitHeroProductById);
