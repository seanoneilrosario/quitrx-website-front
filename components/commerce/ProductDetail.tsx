import Link from "next/link";
import type { QuitHeroProduct } from "@/lib/quithero";
import { getPrimaryImage, getProductPrice } from "@/lib/quithero";
import styles from "@/app/store.module.css";

export default function ProductDetail({ product }: { product: QuitHeroProduct }) {
  const image = getPrimaryImage(product);
  const price = getProductPrice(product);
  const variant = product.variants?.[0];
  const inventory = variant?.inventory;
  const available = inventory === undefined || inventory > 0;
  const description = (product.description || product.shortDescription || "").replace(/<[^>]*>/g, "");

  return (
    <main className={styles.productPage}>
      <div className={`${styles.productDetail} page-width`}>
        <div className={styles.productImageWrap}>
          {image && <img src={image} alt={product.name || "Product"} className={styles.productImage} />}
        </div>

        <div className={styles.productContent}>
          {product.brand?.slug && (
            <Link href={`/collections/${product.brand.slug}`} className={styles.eyebrow}>
              {product.brand.name}
            </Link>
          )}
          <h1>{product.name}</h1>
          {price && <p className={styles.detailPrice}>{price}</p>}
          <p className={styles.shippingNote}>Shipping calculated at checkout</p>

          <label className={styles.quantityLabel} htmlFor="product-quantity">Quantity</label>
          <input className={styles.quantityInput} id="product-quantity" type="number" min="1" defaultValue="1" />

          <p className={available ? styles.stockStatus : styles.outOfStock}>
            {available ? (inventory ? `Low stock! Only ${inventory} units left!` : "In stock") : "Out of stock"}
          </p>
          <span className={styles.stockBar} aria-hidden="true"><span /></span>

          <Link href="/contact" className={styles.addToCart}>
            Contact us to purchase
          </Link>

          <details className={styles.productDisclosure} open>
            <summary>Details</summary>
            <div className={styles.disclosureContent}>
              {description && <p>{description}</p>}
              {variant?.sku && <p className={styles.sku}>SKU: {variant.sku}</p>}
            </div>
          </details>
          <details className={styles.productDisclosure}>
            <summary>What&apos;s in the box</summary>
            <p className={styles.disclosureContent}>See the product packaging and description for included items.</p>
          </details>
          <details className={styles.productDisclosure}>
            <summary>Shipping &amp; Delivery</summary>
            <p className={styles.disclosureContent}>Delivery options and costs are confirmed during checkout.</p>
          </details>
        </div>
      </div>
    </main>
  );
}
