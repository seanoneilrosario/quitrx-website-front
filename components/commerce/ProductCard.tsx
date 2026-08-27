import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import styles from "./collectionCatalog.module.css";

export default function ProductCard({ product }: { product: QuitHeroProduct }) {
  const image = product.images?.find((item) => item.isPrimary)?.url || product.images?.[0]?.url;
  const rawPrice = product.variants?.[0]?.price;
  const price = typeof rawPrice === "number"
    ? `${new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(rawPrice)} AUD`
    : rawPrice;
  const productUrl = product.id ? `/product/${encodeURIComponent(product.id)}` : `/products/${product.slug}`;

  return (
    <article className={styles.productCard}>
      <Link href={productUrl} className={styles.productLink}>
        <span className={styles.productImageWrap}>
          {image ? <img src={image} alt={product.name || "Product"} className={styles.productImage} /> : null}
        </span>
        <span className={styles.productInfo}>
          {product.brand?.name && <span className={styles.brand}>{product.brand.name}</span>}
          <strong>{product.name}</strong>
          {price && <span className={styles.price}>{price}</span>}
        </span>
        <span className={styles.chooseButton}>Choose options</span>
      </Link>
    </article>
  );
}
