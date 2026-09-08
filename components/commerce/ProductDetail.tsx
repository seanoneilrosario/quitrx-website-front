import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import { getPrimaryImage, getQuitHeroBundle, getQuitHeroProducts } from "@/lib/quithero";
import { bundleSlotsFrom } from "@/lib/quithero-bundle";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import styles from "@/app/store.module.css";

export default async function ProductDetail({ product }: { product: QuitHeroProduct }) {
  const image = getPrimaryImage(product);
  const description = (product.description || product.shortDescription || "").replace(/<[^>]*>/g, "");
  const products = await getQuitHeroProducts().catch(() => []);
  const variants = product.variants || [];
  const bundleResults = product.id
    ? await Promise.all(variants.map(async (variant) => ({
        variantId: variant.id,
        slots: variant.bundleComponents !== undefined
          ? bundleSlotsFrom(variant)
          : variant.id ? await getQuitHeroBundle(product.id!, variant.id).catch(() => []) : [],
      })))
    : [];
  const variantProducts = new Map(
    products.flatMap((item) => (item.variants || []).flatMap((variant) =>
      variant.id ? [[variant.id, { product: item, variant }] as const] : [],
    )),
  );
  const bundles = Object.fromEntries(bundleResults.flatMap(({ variantId, slots }) => {
    if (!variantId || !slots.length) return [];
    const bundleSlots = slots.map((slot, slotIndex) => ({
      key: slot.id || `${slot.position}:${slotIndex}`,
      label: slot.label,
      defaultVariantId: slot.defaultVariantId,
      quantity: slot.quantity,
      options: (slot.allowProductVariants
        ? (() => {
            const defaultMatch = slot.defaultVariantId ? variantProducts.get(slot.defaultVariantId) : undefined;
            return defaultMatch?.product.variants?.flatMap((variant) => variant.id ? [variant.id] : []) || slot.allowedVariantIds;
          })()
        : slot.allowedVariantIds).flatMap((allowedVariantId) => {
        const match = variantProducts.get(allowedVariantId);
        if (!match || !match.variant.id || (match.variant.inventory !== undefined && match.variant.inventory < slot.quantity)) return [];
        return [{
          productId: match.product.id || match.product.slug || match.product.name || "product",
          productName: match.product.name || "Product",
          variant: match.variant,
        }];
      }),
    }));
    return [[variantId, bundleSlots]];
  }));
  const bundleAvailability = Object.fromEntries(bundleResults.flatMap(({ variantId, slots }) => {
    if (!variantId || !slots.length) return [];
    return [[variantId, slots.every((slot) => (slot.allowProductVariants
      ? (() => {
          const defaultMatch = slot.defaultVariantId ? variantProducts.get(slot.defaultVariantId) : undefined;
          return defaultMatch?.product.variants?.flatMap((variant) => variant.id ? [variant.id] : []) || slot.allowedVariantIds;
        })()
      : slot.allowedVariantIds).some((variantId) => {
      const match = variantProducts.get(variantId);
      return Boolean(match?.variant.id) && (match?.variant.inventory === undefined || match.variant.inventory >= slot.quantity);
    }))]];
  }));
  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.brand?.slug === product.brand?.slug)
    .slice(0, 3)
    .map((item) => ({
      id: item.id || item.slug || item.name || "product",
      name: item.name || "Product",
      image: getPrimaryImage(item),
      variants: item.variants || [],
    }));

  return (
    <main className={styles.productPage}>
      <div className={`${styles.productDetail} page-width`}>
        <ProductImageZoom image={image} alt={product.name || "Product"} />

        <div className={styles.productContent}>
          {product.brand?.slug ? (
            <Link href={`/collections/${product.brand.slug}`} className={styles.eyebrow}>
              {product.brand.name}
            </Link>
          ) : product.brand?.name ? <span className={styles.eyebrow}>{product.brand.name}</span> : null}
          <h1>{product.name}</h1>
          <ProductPurchasePanel
            productId={product.id || product.slug || product.name || "product"}
            productName={product.name || "Product"}
            image={image}
            variants={variants}
            bundles={bundles}
            bundleAvailability={bundleAvailability}
            relatedProducts={relatedProducts}
          />

          <details className={styles.productDisclosure} open>
            <summary>Details</summary>
            <div className={styles.disclosureContent}>
              {description && <p>{description}</p>}
            </div>
          </details>
          <details className={styles.productDisclosure}>
            <summary>What&apos;s in the box</summary>
            <p className={styles.disclosureContent}>See the product packaging and description for included items.</p>
          </details>
          <details className={styles.productDisclosure}>
            <summary>Beginner Tips</summary>
            <p className={styles.disclosureContent}>Follow the product directions and contact our team if you need help choosing an option.</p>
          </details>
          <details className={styles.productDisclosure}>
            <summary>Shipping &amp; Delivery</summary>
            <p className={styles.disclosureContent}>Delivery options and costs are confirmed during checkout.</p>
          </details>
        </div>
      </div>
    </main>
  );
}
