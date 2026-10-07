import "server-only";

import { client } from "@/sanity/lib/client";
import {
  FREQUENTLY_BOUGHT_TOGETHER_QUERY,
  type FrequentlyBoughtTogetherDocument,
} from "@/lib/catalog/frequently-bought-together";

export async function getFrequentlyBoughtTogetherIds(productId: string) {
  const recommendation = await client
    .withConfig({ useCdn: false })
    .fetch<FrequentlyBoughtTogetherDocument | null>(
      FREQUENTLY_BOUGHT_TOGETHER_QUERY,
      { productId },
      { next: { revalidate: 30 } },
    );
  return Array.isArray(recommendation?.relatedProductIds) ? recommendation.relatedProductIds : [];
}
