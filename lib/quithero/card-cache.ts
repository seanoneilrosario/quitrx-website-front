import "server-only";
import type { QuitHeroProduct } from "./product-types";
import { createSummaryCache } from "./summary-cache";
import { toCollectionProduct } from "@/lib/catalog/collection-product";

export const productCardCache = createSummaryCache<QuitHeroProduct>(1000);

export function cacheProductCard(product: QuitHeroProduct) {
  const card = toCollectionProduct(product);
  // Missing relations are not a complete card and must not poison the cache.
  if (product.id && Array.isArray(product.images) && Array.isArray(product.variants)) {
    productCardCache.set(product.id, card);
  }
  return card;
}
