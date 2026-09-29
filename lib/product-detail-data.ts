import "server-only";

import sanitizeHtml from "sanitize-html";
import type { QuitHeroProduct } from "./quithero";
import {
  getFrequentlyBoughtTogetherIds,
  getPrimaryImage,
  getQuitHeroBundleVariant,
  getQuitHeroProductById,
  productHasTag,
} from "./quithero";
import { bundleDropdownsFrom } from "./quithero-bundle";
import { getAvailableStock } from "./available-stock";

export async function getProductDetailData(product: QuitHeroProduct) {
  const image = getPrimaryImage(product);

  const description = sanitizeHtml(
    product.description || product.shortDescription || "",
    {
      allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "a",
        "ul",
        "ol",
        "li",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
    },
  );

  const isBundle = productHasTag(product, "bundle");
  const productId = product.id || product.slug || product.name || "product";
  const variants = product.variants || [];

  // Fetch recommendation IDs only when the product has an ID.
  const relatedProductIds = product.id
    ? await getFrequentlyBoughtTogetherIds(product.id).catch(() => [])
    : [];

  // Fetch ONLY the related products instead of the entire catalog.
  const relatedProductsData = await Promise.all(
    relatedProductIds.map((id) =>
      getQuitHeroProductById(id).catch(() => undefined),
    ),
  );

  const relatedProducts = relatedProductsData
    .filter((item): item is QuitHeroProduct => Boolean(item))
    .map((item) => ({
      id: item.id!,
      name: item.name!,
      image: getPrimaryImage(item),
      variants: item.variants!,
    }));

  // Only fetch the bundle information when this is actually a bundle.
  const bundleVariant =
    isBundle && product.id && variants[0]?.id
      ? await getQuitHeroBundleVariant(
          product.id,
          variants[0].id,
        ).catch(() => variants[0])
      : variants[0];

  // Build lookup from the current product + related products.
  const productsForLookup = [product, ...relatedProductsData.filter(
    (item): item is QuitHeroProduct => Boolean(item),
  )];

  const variantLookup = new Map(
    productsForLookup.flatMap((item) =>
      (item.variants || []).flatMap((variant) =>
        variant.id
          ? [[
              variant.id,
              { product: item, variant },
            ] as const]
          : [],
      ),
    ),
  );

  const bundleDropdowns = bundleDropdownsFrom(bundleVariant).map(
    (dropdown) => ({
      name: dropdown.name,
      options: dropdown.options.map(
        ({ componentVariantId, componentVariant }) => {
          const match = variantLookup.get(componentVariantId);

          const variant = componentVariant ?? match?.variant;
          const product = componentVariant?.product ?? match?.product;

          const availableStock = getAvailableStock(variant);

          return {
            componentVariantId,
            productId:
              product?.id ||
              componentVariant?.productId ||
              match?.product.id ||
              componentVariantId,
            productName:
              product?.name ||
              match?.product.name ||
              "Bundle item",
            variantName:
              variant?.name ||
              match?.variant.name ||
              "Default",
            availableStock,
            available: availableStock > 0,
          };
        },
      ),
    }),
  );

  return {
    product,
    image,
    description,
    isBundle,
    productId,
    variants,
    bundleDropdowns,
    relatedProducts,
  };
}

export type ProductDetailData =
  Awaited<ReturnType<typeof getProductDetailData>>;