import "server-only";
import type { QuitHeroOrder } from "./orders";
import type { QuitHeroProduct, QuitHeroVariant } from "./product-types";
import { quitHeroFetch } from "./client";
import { getQuitHeroProductById } from "./products";
import { createSummaryCache } from "./cache/summary-cache";

type Variant = QuitHeroVariant & { productId?: string };
const variantIndex = createSummaryCache<Map<string, Variant>>(1);

async function getVariants() {
  return variantIndex.get("order-items", async () => {
    const variants = new Map<string, Variant>();
    for (let page = 1; page <= 100; page++) {
      const response = await quitHeroFetch<
        Variant[] | { data: Variant[]; pagination?: { totalPages?: number } }
      >(`/product-variants?page=${page}&limit=100`);
      const items = Array.isArray(response) ? response : response.data;
      for (const item of items) if (item.id) variants.set(item.id, item);
      if (Array.isArray(response) || page >= (response.pagination?.totalPages ?? 1))
        return variants;
    }
    throw new Error("Variant pagination limit reached.");
  });
}

// Called only after customer ownership has been checked. Cache catalog metadata,
// never order records, and preserve the names and amounts recorded at purchase.
export async function enrichOrderItems(orders: QuitHeroOrder[]) {
  const needsVariants = orders.some((order) =>
    order.items?.some(
      (item) => item.variantId && (!item.productId || !item.variantName || !item.sku),
    ),
  );
  const variants = needsVariants
    ? await getVariants().catch(() => new Map<string, Variant>())
    : new Map<string, Variant>();
  const products = new Map<string, QuitHeroProduct | undefined>();
  const enriched: QuitHeroOrder[] = [];
  for (const order of orders) {
    const items: NonNullable<QuitHeroOrder["items"]> = [];
    for (const item of order.items ?? []) {
      const variant = item.variantId ? variants.get(item.variantId) : undefined;
      const productId = item.productId ?? variant?.productId;
      if (productId && (!item.imageUrl || !item.productName) && !products.has(productId)) {
        products.set(productId, await getQuitHeroProductById(productId).catch(() => undefined));
      }
      const product = productId ? products.get(productId) : undefined;
      const image = product?.images?.find((image) => image.isPrimary) ?? product?.images?.[0];
      items.push({
        ...item,
        productId,
        productName: item.productName || product?.name,
        variantName: item.variantName || variant?.name,
        sku: item.sku || variant?.sku,
        imageUrl: item.imageUrl || image?.url,
      });
    }
    enriched.push({ ...order, items });
  }
  return enriched;
}
