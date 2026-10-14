import "server-only";
import type { QuitHeroProduct } from "./product-types";
import { createSummaryCache } from "./cache/summary-cache";
import { filterShopProducts } from "./shop-visibility";

type ProductBatch = {
  products: QuitHeroProduct[];
  totalPages: number;
  collection?: { name: string; slug: string };
};

const snapshots = createSummaryCache<Omit<ProductBatch, "totalPages">>(100);

// Backend pages include hidden products. Build a shared visible snapshot before
// slicing so adjacent storefront pages cannot overlap or skip visible products.
export async function visibleProductPage(
  key: string,
  page: number,
  limit: number,
  load: (page: number, limit: number) => Promise<ProductBatch>,
  fresh: boolean,
) {
  const snapshot = await snapshots.get(
    key,
    async () => {
      const first = await load(1, 100);
      const products = [...first.products];
      if (!Number.isInteger(first.totalPages) || first.totalPages < 0 || first.totalPages > 100)
        throw new Error("Invalid product pagination.");
      for (let next = 2; next <= first.totalPages; next += 1) {
        products.push(...(await load(next, 100)).products);
      }
      return { collection: first.collection, products: await filterShopProducts(products, fresh) };
    },
    fresh,
  );
  const total = snapshot.products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    collection: snapshot.collection,
    products: snapshot.products.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages },
  };
}
