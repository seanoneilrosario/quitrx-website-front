import "server-only";
import { quitHeroFetch } from "./client";
import { createSummaryCache } from "./cache/summary-cache";
import { productHasTag, productIsListedInShop } from "./helpers";
import type { QuitHeroProduct, QuitHeroProductTag } from "./product-types";

type ProductTagAssignment = {
  productId: string;
  tag: QuitHeroProductTag;
};

const hiddenProductsCache = createSummaryCache<Set<string>>(1, 60_000);

export function getHiddenShopProductIds(fresh = false) {
  return hiddenProductsCache.get("NOTOSHOP", async () => {
    // The scalar /products list omits tags. This endpoint returns the complete
    // assignment list, with nested tags; retain only hidden IDs in memory.
    const assignments = await quitHeroFetch<ProductTagAssignment[]>("/product-tags");
    if (!Array.isArray(assignments)) throw new Error("Invalid product tag assignments.");
    return new Set(assignments.filter((assignment) =>
      assignment.tag && productHasTag({ tags: [assignment.tag] }, "NOTOSHOP"),
    ).map((assignment) => assignment.productId));
  }, fresh);
}

export async function filterShopProducts(products: QuitHeroProduct[], fresh = false) {
  if (!products.length) return products;
  const hiddenIds = await getHiddenShopProductIds(fresh);
  return products.filter((product) =>
    productIsListedInShop(product) && (!product.id || !hiddenIds.has(product.id)),
  );
}
