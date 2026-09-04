import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import styles from "./collectionCatalog.module.css";

export default function ProductCard({ product }: { product: QuitHeroProduct }) {
  const image = product.images?.find((item) => item.isPrimary)?.url || product.images?.[0]?.url;
  const prices = (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") return [];
    const value = typeof variant.price === "number" ? variant.price : Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? [value] : [];
  });
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
  const minimumPrice = prices.length ? Math.min(...prices) : undefined;
  const maximumPrice = prices.length ? Math.max(...prices) : undefined;
  const price = minimumPrice === undefined
    ? undefined
    : minimumPrice === maximumPrice
      ? formatter.format(minimumPrice)
      : `${formatter.format(minimumPrice)}–${formatter.format(maximumPrice!)}`;
  const productHandle = product.handle ?? product.slug;
  const productUrl = `/product/${encodeURIComponent(productHandle || "")}`;

  return (
    <article className={styles.productCard}>
      <Link href={productUrl} className={styles.productLink}>
        <span className={styles.productImageWrap}>
          {image ? <img src={image} alt={product.name || "Product"} className={styles.productImage} /> : null}
        </span>
        <span className={styles.productInfo}>
          {product.brand?.name && <span className={styles.brand}>{product.brand.name}</span>}
          <strong>{product.name}</strong>
          {price && <span className={styles.price}>{price} AUD</span>}
        </span>
        <span className={styles.chooseButton}>Choose options</span>
      </Link>
    </article>
  );
}
