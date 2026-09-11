import Link from "next/link";
import Image from "next/image";
import type { QuitHeroProduct } from "@/lib/quithero";
import { variantIsAvailable } from "@/lib/quithero-bundle";
import styles from "./collectionCatalog.module.css";

type ProductCardProps = {
  product: QuitHeroProduct;
  locked?: boolean;
  onLockedClick?: () => void;
};

export default function ProductCard({ product, locked = false, onLockedClick }: ProductCardProps) {
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
      <Link
        href={productUrl}
        className={styles.productLink}
        onClick={locked && onLockedClick ? (event) => {
          event.preventDefault();
          onLockedClick();
        } : undefined}
      >
        <span className={styles.productImageWrap}>
          {locked && <span className={styles.scriptRequired}>Script required</span>}
          {locked ? (
            <Image src="/images/lock-icon.webp" width={64} height={64} alt="" className={styles.lockIcon} aria-hidden="true" />
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
