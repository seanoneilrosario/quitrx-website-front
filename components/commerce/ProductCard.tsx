import Link from "next/link";
import Image from "next/image";
import type { QuitHeroProduct } from "@/lib/quithero";
import { productIsAvailable } from "@/lib/quithero-bundle";
import ProductImage from "./ProductImage";
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
  const isAvailable = productIsAvailable(product);

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
          ) : <ProductImage src={image?.url} width={600} height={600} sizes="(max-width: 599px) 190px, (max-width: 989px) 50vw, 25vw" alt={image?.altText || product.name || "Product"} className={styles.productImage} />}
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
