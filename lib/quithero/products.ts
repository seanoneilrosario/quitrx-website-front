import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { QuitHeroProduct } from "./product-types";
import { quitHeroFetch, QUITHERO_CACHE_SECONDS, QUITHERO_CATALOG_CACHE_SECONDS } from "./client";
import { productIsVisible } from "@/lib/catalog/bundles";

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

export async function loadQuitHeroProductsPage(page: number, limit: number, search?: string) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status: "active",
  });

  if (search) query.set("search", search);

  const payload = await quitHeroFetch<QuitHeroProductsResponse>(`/products?${query}`);

  const products = productsFrom(payload);

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
