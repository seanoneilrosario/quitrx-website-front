import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import { getPrimaryImage, getQuitHeroProducts, productHasTag } from "@/lib/quithero";
import { bundleDropdownsFrom } from "@/lib/quithero-bundle";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import styles from "@/app/store.module.css";

export default async function ProductDetail({ product }: { product: QuitHeroProduct }) {
  const image = getPrimaryImage(product);
  const description = (product.description || product.shortDescription || "").replace(/<[^>]*>/g, "");
  const isBundle = productHasTag(product, "bundle");
  const products = await getQuitHeroProducts().catch(() => []);
  const variants = product.variants || [];
  const variantLookup = new Map(products.flatMap((item) => (item.variants || []).flatMap((variant) =>
    variant.id ? [[variant.id, { product: item, variant }] as const] : [],
  )));
  const bundleDropdowns = bundleDropdownsFrom(variants[0]).map((dropdown) => ({
    name: dropdown.name,
    options: dropdown.options.map(({ componentVariantId }) => {
      const match = variantLookup.get(componentVariantId);
      return {
        componentVariantId,
        productId: match?.product.id || componentVariantId,
        productName: match?.product.name || "Bundle item",
        variantName: match?.variant.name || "Default",
        available: Boolean(match) && (match?.variant.inventory === undefined || match.variant.inventory > 0),
      };
    }),
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
            isBundle={isBundle}
            bundleDropdowns={bundleDropdowns}
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
