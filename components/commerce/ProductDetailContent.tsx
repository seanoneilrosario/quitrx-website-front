"use client";

import Link from "next/link";
import type { ProductDetailData } from "@/lib/product-detail-data";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductAccessGate from "./ProductAccessGate";
import styles from "@/app/store.module.css";

export default function ProductDetailContent({
  initialData,
}: {
  initialData: ProductDetailData;
}) {
  const {
    product,
    image,
    descriptionSections,
    isBundle,
    productId,
    variants,
    bundleDropdowns,
    relatedProducts,
  } = initialData;

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
            productStatus={product.status}
            image={image}
            variants={variants}
            isBundle={isBundle}
            bundleDropdowns={bundleDropdowns}
            relatedProducts={relatedProducts}
          />

          {descriptionSections.details && <details className={styles.productDisclosure} open>
            <summary>Details</summary>
            {descriptionSections.details && (
              <div
                className={styles.disclosureContent}
                dangerouslySetInnerHTML={{ __html: descriptionSections.details }}
              />
            )}
          </details>}
          {descriptionSections.inTheBox && <details className={styles.productDisclosure}>
            <summary>What&apos;s in the box</summary>
            <div className={styles.disclosureContent} dangerouslySetInnerHTML={{ __html: descriptionSections.inTheBox }} />
          </details>}
          {descriptionSections.beginnerTips && <details className={styles.productDisclosure}>
            <summary>Beginner Tips</summary>
            <div className={styles.disclosureContent} dangerouslySetInnerHTML={{ __html: descriptionSections.beginnerTips }} />
          </details>}
          {descriptionSections.shipping && <details className={styles.productDisclosure}>
            <summary>Shipping &amp; Delivery</summary>
            <div className={styles.disclosureContent} dangerouslySetInnerHTML={{ __html: descriptionSections.shipping }} />
          </details>}
        </div>
      </div>
    </main>
  </ProductAccessGate>;
}
