import Link from "next/link";
import Image from "next/image";
import type { QuitHeroProduct } from "@/lib/quithero";
import {
  bundleComponentsFrom,
  bundleDropdownsFrom,
  productIsAvailable,
} from "@/lib/catalog/bundles";
import { getAvailableStock } from "@/lib/catalog/available-stock";
import type { StorefrontCartItem } from "@/lib/checkout/storefront-cart";
import ProductImage from "./ProductImage";
import styles from "./collection-catalog.module.css";

const CART_KEY = "quitrx-cart";

type ProductCardProps = {
  product: QuitHeroProduct;
  locked?: boolean;
  onLockedClick?: () => void;
};

export default function ProductCard({ product, locked = false, onLockedClick }: ProductCardProps) {
  const image = product.images?.find((item) => item.isPrimary) ?? product.images?.[0];
  const prices = (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") return [];
    const value =
      typeof variant.price === "number"
        ? variant.price
        : Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? [value] : [];
  });
  const currency = product.variants?.find((variant) => variant.currencyCode)?.currencyCode ?? "AUD";
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency });
  const minimumPrice = prices.length ? Math.min(...prices) : undefined;
  const maximumPrice = prices.length ? Math.max(...prices) : undefined;
  const price =
    minimumPrice === undefined
      ? undefined
      : minimumPrice === maximumPrice
        ? formatter.format(minimumPrice)
        : `${formatter.format(minimumPrice)}–${formatter.format(maximumPrice!)}`;
  const productHandle = product.handle ?? product.slug;
  const productUrl = `/product/${encodeURIComponent(productHandle!)}`;
  const isAvailable = productIsAvailable(product);
  const variants = product.variants ?? [];
  const productType =
    typeof product.productType === "string"
      ? product.productType
      : product.productType?.name || product.productType?.slug || "";
  const tags =
    product.tags?.flatMap((tag) =>
      typeof tag === "string"
        ? [tag]
        : [tag.name, tag.slug, tag.tag?.name, tag.tag?.slug].filter((value): value is string =>
            Boolean(value),
          ),
    ) ?? [];
  const isBundle =
    [productType, ...tags].some((value) => value.trim().toLowerCase() === "bundle") ||
    variants.some(
      (variant) =>
        bundleComponentsFrom(variant).length > 0 || bundleDropdownsFrom(variant).length > 0,
    );
  const directVariant =
    !isBundle && variants.length === 1 && variants[0]?.id ? variants[0] : undefined;

  function addToCart() {
    if (!directVariant || !product.id || !isAvailable) return;

    const variantName = directVariant.name || "Default";
    const key = `${product.id}:${directVariant.id}`;
    const availableStock = getAvailableStock(directVariant);
    const storedCart: StorefrontCartItem[] = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    const existing = storedCart.find((item) => item.key === key);

    if (existing) {
      if (existing.quantity >= availableStock) return;
      existing.quantity += 1;
    } else {
      storedCart.push({
        key,
        productId: product.id,
        productName: product.name || "Product",
        image: image?.url,
        variantId: directVariant.id,
        variantName,
        price: directVariant.price,
        quantity: 1,
        availableStock,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(storedCart));
    window.dispatchEvent(
      new CustomEvent("quitrx:cart-updated", {
        detail: { items: storedCart, open: true },
      }),
    );
  }

  const lockedClick =
    locked && onLockedClick
      ? (event: React.MouseEvent) => {
          event.preventDefault();
          onLockedClick();
        }
      : undefined;

  return (
    <article className={styles.productCard}>
      <Link href={productUrl} className={styles.productLink} onClick={lockedClick}>
        <span className={styles.productImageWrap}>
          {locked && <span className={styles.scriptRequired}>Script required</span>}
          {locked ? (
            <Image
              src="/images/lock-icon.webp"
              width={64}
              height={64}
              alt=""
              className={styles.lockIcon}
              aria-hidden="true"
            />
          ) : (
            <ProductImage
              src={image?.url}
              width={600}
              height={600}
              sizes="(max-width: 599px) 190px, (max-width: 989px) 50vw, 25vw"
              alt={image?.altText || product.name || "Product"}
              className={styles.productImage}
            />
          )}
        </span>
        <span className={styles.productInfo}>
          {product.brand?.name && <span className={styles.brand}>{product.brand.name}</span>}
          <strong>{product.name}</strong>
          {price && <span className={styles.price}>{price}</span>}
        </span>
      </Link>
      {directVariant && isAvailable && !locked ? (
        <button type="button" className={styles.chooseButton} onClick={addToCart}>
          Add to cart
        </button>
      ) : (
        <Link href={productUrl} className={styles.chooseButton} onClick={lockedClick}>
          {locked ? "View product" : isAvailable ? "Choose options" : "Sold out"}
        </Link>
      )}
    </article>
  );
}
