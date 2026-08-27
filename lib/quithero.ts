import "server-only";

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
  | { products?: QuitHeroProduct[]; data?: QuitHeroProduct[]; items?: QuitHeroProduct[] };

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

export async function getQuitHeroProducts() {
  const payload = await quitHeroFetch<QuitHeroProductsResponse>("/products");
  if (Array.isArray(payload)) return payload;

  const products = payload.products ?? payload.data ?? payload.items;
  if (!Array.isArray(products)) {
    throw new Error("QuitHero products response did not contain a product list.");
  }

  return products;
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
