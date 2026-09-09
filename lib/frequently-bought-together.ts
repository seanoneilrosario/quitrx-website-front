import type { QuitHeroProduct, QuitHeroVariant } from "./quithero-types";
import { variantIsAvailable } from "./quithero-bundle";

export const FREQUENTLY_BOUGHT_TOGETHER_QUERY = `
  *[_type == "frequentlyBoughtTogether" && productId == $productId][0]{
    productId,
    relatedProductIds
  }
`;

export type FrequentlyBoughtTogetherDocument = {
  productId?: string;
  relatedProductIds?: string[];
};

export function firstAvailableVariantIndex(variants: QuitHeroVariant[]) {
  const index = variants.findIndex(variantIsAvailable);
  return index < 0 ? 0 : index;
}

export function resolveFrequentlyBoughtTogether(
  currentProductId: string,
  relatedProductIds: string[] | undefined,
  products: QuitHeroProduct[],
) {
  const productsById = new Map(products.flatMap((product) => product.id ? [[product.id, product] as const] : []));
  const seen = new Set<string>();

  return (relatedProductIds ?? []).flatMap((id) => {
    if (!id || id === currentProductId || seen.has(id)) return [];
    seen.add(id);

    const product = productsById.get(id);
    if (!product?.name || !product.variants?.some(variantIsAvailable)) return [];

    return [product];
  });
}
