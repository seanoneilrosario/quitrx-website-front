import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import { variantIsAvailable } from "@/lib/quithero-bundle";
import styles from "./collectionCatalog.module.css";

export default function ProductCard({ product, locked = false }: { product: QuitHeroProduct; locked?: boolean }) {
  const image = product.images?.find((item) => item.isPrimary) ?? product.images?.[0];
  const prices = (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") return [];
    const value = typeof variant.price === "number" ? variant.price : Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? [value] : [];
  });
  const currency = product.variants?.find((variant) => variant.currencyCode)?.currencyCode ?? "AUD";
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency });
  const minimumPrice = prices.length ? Math.min(...prices) : undefined;
  const maximumPrice = prices.length ? Math.max(...prices) : undefined;
  const price = minimumPrice === undefined
    ? undefined
    : minimumPrice === maximumPrice
      ? formatter.format(minimumPrice)
      : `${formatter.format(minimumPrice)}–${formatter.format(maximumPrice!)}`;
  const productHandle = product.handle ?? product.slug;
  const productUrl = `/product/${encodeURIComponent(productHandle!)}`;
  const isAvailable = product.variants?.some(variantIsAvailable) ?? false;

  return (
    <article className={styles.productCard}>
      <Link href={productUrl} className={styles.productLink}>
        <span className={styles.productImageWrap}>
          {locked && <span className={styles.scriptRequired}>Script required</span>}
          {locked ? (
            <svg className={styles.lockIcon} viewBox="0 0 64 64" aria-hidden="true">
              <path d="M19 27v-7a13 13 0 0 1 26 0v7M14 27h36v27H14z" />
              <circle cx="32" cy="40" r="3" />
            </svg>
          ) : image?.url ? <img src={image.url} alt={image.altText || product.name || "Product"} className={styles.productImage} /> : null}
        </span>
        <span className={styles.productInfo}>
          {product.brand?.name && <span className={styles.brand}>{product.brand.name}</span>}
          <strong>{product.name}</strong>
          {price && <span className={styles.price}>{price}</span>}
        </span>
        <span className={styles.chooseButton}>{locked ? "View product" : isAvailable ? "Choose options" : "Sold out"}</span>
      </Link>
    </article>
  );
}
