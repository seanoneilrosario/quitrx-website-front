import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/commerce/ProductImage";
import type { CollectionCardData, ProductCardData } from "@/lib/catalog/grid-data";
import styles from "./product-api-grid.module.css";

export function CollectionGridCard({ collection }: { collection: CollectionCardData }) {
  const { slug, title, image, count, placeholder } = collection;
  return (
    <Link href={`/collections/${slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {image ? (
          <Image
            src={image}
            width={600}
            height={600}
            sizes="(max-width: 767px) 50vw, 25vw"
            alt={title}
            className={styles.image}
          />
        ) : (
          <span className={placeholder === "title" ? styles.missingImageTitle : styles.allTile}>
            {placeholder === "title" ? title : "ALL"}
          </span>
        )}
      </div>
      <div className={styles.content}>
        <h3>{title}</h3>
        {count !== undefined && (
          <p className={styles.count}>
            {count} product{count === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </Link>
  );
}
export function ProductGridCard({ product }: { product: ProductCardData }) {
  const { title, image, price, handle } = product;
  const content = (
    <>
      <div className={styles.imageWrap}>
        <ProductImage
          src={image}
          width={600}
          height={600}
          sizes="(max-width: 767px) 50vw, 25vw"
          alt={title}
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3>{title}</h3>
        {price && <p className={styles.price}>{price}</p>}
      </div>
    </>
  );
  return handle ? (
    <Link href={`/product/${encodeURIComponent(handle)}`} className={styles.card}>
      {content}
    </Link>
  ) : (
    <article className={styles.card}>{content}</article>
  );
}
