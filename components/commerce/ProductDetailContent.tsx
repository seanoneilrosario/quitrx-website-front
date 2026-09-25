"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productDetailQuery } from "@/lib/catalog-queries";
import type { ProductDetailData } from "@/lib/product-detail-data";
import ProductImageZoom from "./ProductImageZoom";
import ProductPurchasePanel from "./ProductPurchasePanel";
import ProductAccessGate from "./ProductAccessGate";
import styles from "@/app/store.module.css";

export default function ProductDetailContent({ initialData }: { initialData: ProductDetailData }) {
  const slug = initialData.product.handle || initialData.product.slug || initialData.productId;
  const { data, error, refetch, isFetching } = useQuery({
    ...productDetailQuery(slug),
    initialData,
  });
  const { product, image, description, isBundle, productId, variants, bundleDropdowns, relatedProducts } = data;

  return <ProductAccessGate productName={product.name || "Product"}>
    <main className={styles.productPage}>
      {error && <div className="page-width" role="alert">
        <p>We couldn&apos;t refresh this product. Displaying the last loaded details.</p>
        <button type="button" disabled={isFetching} onClick={() => void refetch()}>Try again</button>
      </div>}
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
