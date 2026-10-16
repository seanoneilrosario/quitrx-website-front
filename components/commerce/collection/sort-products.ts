import type { QuitHeroProduct } from "@/lib/quithero";
export type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

function variantPrices(product: QuitHeroProduct) {
  return (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") {
      return [];
    }

    const parsed =
      typeof variant.price === "number"
        ? variant.price
        : Number(String(variant.price).replace(/[^0-9.-]/g, ""));

    return Number.isFinite(parsed) ? [parsed] : [];
  });
}

function minimumVariantPrice(product: QuitHeroProduct) {
  const prices = variantPrices(product);

  return prices.length ? Math.min(...prices) : 0;
}

export function sortProducts(products: QuitHeroProduct[], sort: Sort) {
  const sorted = [...products];

  if (sort === "price-asc") {
    sorted.sort((a, b) => minimumVariantPrice(a) - minimumVariantPrice(b));
  }

  if (sort === "price-desc") {
    sorted.sort((a, b) => minimumVariantPrice(b) - minimumVariantPrice(a));
  }

  if (sort === "name-asc") {
    sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  if (sort === "name-desc") {
    sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  }

  return sorted;
}
