import type { QuitHeroProduct } from "@/lib/quithero/product-types";
import {
  bundleComponentsFrom,
  bundleDropdownsFrom,
  productStatusAllowsPurchase,
  variantIsAvailable,
} from "./bundles";

// Explicit allowlist: never serialize detail payloads into collection HTML/API responses.
export function toCollectionProduct(product: QuitHeroProduct): QuitHeroProduct {
  const image = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];
  const type =
    typeof product.productType === "string"
      ? product.productType
      : product.productType?.name || product.productType?.slug || "";
  const tags =
    product.tags?.flatMap((tag) =>
      typeof tag === "string" ? [tag] : [tag.name, tag.slug, tag.tag?.name, tag.tag?.slug],
    ) ?? [];
  return {
    id: product.id,
    name: product.name,
    handle: product.handle,
    slug: product.slug,
    status: product.status,
    brand: product.brand ? { name: product.brand.name } : undefined,
    images: image ? [{ url: image.url, altText: image.altText }] : [],
    // List endpoints omit bundle configuration but include the variant's stock.
    // Use component stock when supplied; otherwise use the listed variant stock.
    available:
      productStatusAllowsPurchase(product.status) &&
      (product.variants ?? []).some(variantIsAvailable),
    isBundle:
      [type, ...tags].some((value) => value?.trim().toLowerCase() === "bundle") ||
      (product.variants ?? []).some(
        (variant) =>
          bundleComponentsFrom(variant).length > 0 || bundleDropdownsFrom(variant).length > 0,
      ),
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      inventory: variant.inventory,
      allocatedInventory: variant.allocatedInventory,
      size: variant.size || variant.options?.size || variant.options?.Size,
      color: variant.color || variant.options?.color || variant.options?.Color,
    })),
  };
}
