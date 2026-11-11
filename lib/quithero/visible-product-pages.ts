import "server-only";
import type { QuitHeroProduct } from "./product-types";
import { createSummaryCache } from "./cache/summary-cache";
import { productIsListedInShop } from "./helpers";

type ProductBatch = {
  products: QuitHeroProduct[];
  total: number;
  totalPages: number;
  collection?: { name: string; slug: string };
};

const pages = createSummaryCache<ProductBatch>(100);

// Callers exclude NOTOSHOP before backend pagination. Keep a local tag guard
// without fetching global tag assignments or scanning other product pages.
export async function visibleProductPage(
  key: string,
  page: number,
  limit: number,
  load: (page: number, limit: number) => Promise<ProductBatch>,
  fresh: boolean,
) {
  const result = await pages.get(
    JSON.stringify([key, page, limit]),
    async () => {
      const batch = await load(page, limit);
      if (
        !Number.isSafeInteger(batch.totalPages) ||
        batch.totalPages < 0 ||
        !Number.isSafeInteger(batch.total) ||
        batch.total < 0
      )
        throw new Error("Invalid product pagination.");
      return { ...batch, products: batch.products.filter(productIsListedInShop) };
    },
    fresh,
  );
  const totalPages = Math.max(1, result.totalPages);
  return {
    collection: result.collection,
    products: result.products,
    pagination: { page, limit, total: result.total, totalPages, hasNextPage: page < totalPages },
  };
}
