import "server-only";
import sanitizeHtml from "sanitize-html";
import type { QuitHeroProduct } from "./quithero";
import { getFrequentlyBoughtTogetherIds, getPrimaryImage, getQuitHeroBundleVariant, getQuitHeroProducts, productHasTag } from "./quithero";
import { bundleDropdownsFrom } from "./quithero-bundle";
import { resolveFrequentlyBoughtTogether } from "./frequently-bought-together";
import { getAvailableStock } from "./available-stock";

export async function getProductDetailData(product: QuitHeroProduct) {
  const image = getPrimaryImage(product);
  const description = sanitizeHtml(product.description || product.shortDescription || "", {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
  const isBundle = productHasTag(product, "bundle");
  const productId = product.id || product.slug || product.name || "product";
  const relatedProductIds = product.id
    ? await getFrequentlyBoughtTogetherIds(product.id).catch(() => [])
    : [];
  const products = isBundle || relatedProductIds.length
    ? await getQuitHeroProducts().catch(() => [])
    : [];
  const variants = product.variants || [];
  const bundleVariant = isBundle && product.id && variants[0]?.id
    ? await getQuitHeroBundleVariant(product.id, variants[0].id).catch(() => variants[0])
    : variants[0];
  const variantLookup = new Map(products.flatMap((item) => (item.variants || []).flatMap((variant) =>
    variant.id ? [[variant.id, { product: item, variant }] as const] : [],
  )));
  const bundleDropdowns = bundleDropdownsFrom(bundleVariant).map((dropdown) => ({
    name: dropdown.name,
    options: dropdown.options.map(({ componentVariantId, componentVariant }) => {
      const match = variantLookup.get(componentVariantId);
      return {
        componentVariantId,
        productId: componentVariant?.product?.id || componentVariant?.productId || match?.product.id || componentVariantId,
        productName: componentVariant?.product?.name || match?.product.name || "Bundle item",
        variantName: componentVariant?.name || match?.variant.name || "Default",
        availableStock: getAvailableStock(componentVariant ?? match?.variant),
        available: getAvailableStock(componentVariant ?? match?.variant) > 0,
      };
    }),
  }));
  const relatedProducts = resolveFrequentlyBoughtTogether(productId, relatedProductIds, products).map((item) => ({
    id: item.id!,
    name: item.name!,
    image: getPrimaryImage(item),
    variants: item.variants!,
  }));

  return { product, image, description, isBundle, productId, variants, bundleDropdowns, relatedProducts };
}

export type ProductDetailData = Awaited<ReturnType<typeof getProductDetailData>>;
