import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { QuitHeroProduct } from "@/lib/quithero";
import { getFrequentlyBoughtTogetherIds, getPrimaryImage, getQuitHeroBundleVariant, getQuitHeroProducts, productHasTag } from "@/lib/quithero";
import { bundleDropdownsFrom } from "@/lib/quithero-bundle";
import { resolveFrequentlyBoughtTogether } from "@/lib/frequently-bought-together";
import { getAvailableStock } from "@/lib/available-stock";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductAccessGate from "./ProductAccessGate";
import styles from "@/app/store.module.css";

export default async function ProductDetail({ product }: { product: QuitHeroProduct }) {
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

  return <ProductAccessGate productName={product.name || "Product"}>
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
            productId={productId}
            productName={product.name || "Product"}
            image={image}
            variants={variants}
            isBundle={isBundle}
            bundleDropdowns={bundleDropdowns}
            relatedProducts={relatedProducts}
          />

          <details className={styles.productDisclosure} open>
            <summary>Details</summary>
            {description && (
              <div
                className={styles.disclosureContent}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
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
  </ProductAccessGate>;
}
