import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import { getFrequentlyBoughtTogetherIds, getPrimaryImage, getQuitHeroBundleVariant, getQuitHeroProducts, productHasTag } from "@/lib/quithero";
import { bundleDropdownsFrom } from "@/lib/quithero-bundle";
import { resolveFrequentlyBoughtTogether } from "@/lib/frequently-bought-together";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductAccessGate from "./ProductAccessGate";
import styles from "@/app/store.module.css";

export default async function ProductDetail({ product }: { product: QuitHeroProduct }) {
  const image = getPrimaryImage(product);
  const description = (product.description || product.shortDescription || "").replace(/<[^>]*>/g, "");
  const isBundle = productHasTag(product, "bundle");
  const productId = product.id || product.slug || product.name || "product";
  const [products, relatedProductIds] = await Promise.all([
    getQuitHeroProducts().catch(() => []),
    product.id ? getFrequentlyBoughtTogetherIds(product.id).catch(() => []) : Promise.resolve([]),
  ]);
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
        available: (componentVariant?.inventory ?? match?.variant.inventory ?? 0) > 0,
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
  </ProductAccessGate>;
}
