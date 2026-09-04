"use client";

import { useState } from "react";
import styles from "@/app/store.module.css";

type Variant = {
  id?: string;
  name?: string;
  price?: number | string;
  inventory?: number;
  size?: string;
  options?: Record<string, string>;
};

type RelatedProduct = {
  id: string;
  name: string;
  image?: string;
  variants: Variant[];
};

type CartItem = {
  key: string;
  productId: string;
  productName: string;
  image?: string;
  variantId?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
};

const CART_KEY = "quitrx-cart";

function variantLabel(variant: Variant, index: number) {
  return variant.options?.strength || variant.options?.Strength || variant.size || variant.name || `Option ${index + 1}`;
}

function relatedVariantLabel(productName: string, variant: Variant, index: number) {
  const label = variantLabel(variant, index);
  if (!label.toLowerCase().startsWith(productName.toLowerCase())) return label;

  return label.slice(productName.length).replace(/^\s*[-–—:]\s*/, "") || label;
}

function formatPrice(value?: number | string) {
  if (typeof value === "number") return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
  return value || "Price on request";
}

function addItemsToCart(items: CartItem[]) {
  const stored = localStorage.getItem(CART_KEY);
  const cart: CartItem[] = stored ? JSON.parse(stored) : [];

  items.forEach((item) => {
    const existing = cart.find((cartItem) => cartItem.key === item.key);
    if (existing) existing.quantity += item.quantity;
    else cart.push(item);
  });

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items: cart, open: true } }));
}

export default function ProductPurchasePanel({
  productId,
  productName,
  image,
  variants,
  relatedProducts,
}: {
  productId: string;
  productName: string;
  image?: string;
  variants: Variant[];
  relatedProducts: RelatedProduct[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedSelections, setRelatedSelections] = useState<Record<string, boolean>>({});
  const [relatedVariants, setRelatedVariants] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);
  const selected = variants[selectedIndex];
  const inventory = selected?.inventory;
  const available = inventory === undefined || inventory > 0;
  const price = formatPrice(selected?.price);

  function addToCart() {
    if (!available) return;

    const mainVariantName = selected ? variantLabel(selected, selectedIndex) : "Default";
    const items: CartItem[] = [{
      key: `${productId}:${selected?.id || mainVariantName}`,
      productId,
      productName,
      image,
      variantId: selected?.id,
      variantName: mainVariantName,
      price: selected?.price,
      quantity,
    }];

    relatedProducts.forEach((product) => {
      if (!relatedSelections[product.id]) return;
      const index = relatedVariants[product.id] || 0;
      const variant = product.variants[index];
      const name = variant ? variantLabel(variant, index) : "Default";
      items.push({
        key: `${product.id}:${variant?.id || name}`,
        productId: product.id,
        productName: product.name,
        image: product.image,
        variantId: variant?.id,
        variantName: name,
        price: variant?.price,
        quantity: 1,
      });
    });

    addItemsToCart(items);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <>
      <p className={styles.detailPrice}>{price}{price !== "Price on request" && " AUD"}</p>
      <p className={styles.shippingNote}>Shipping calculated at checkout</p>

      {variants.length > 1 && (
        <fieldset className={styles.variantPicker}>
          <legend>Choose your strength</legend>
          <div className={styles.variantOptions}>
            {variants.map((variant, index) => (
              <button key={variant.id || `${variantLabel(variant, index)}-${index}`} type="button" className={selectedIndex === index ? styles.variantActive : ""} onClick={() => setSelectedIndex(index)}>
                {variantLabel(variant, index)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <span className={styles.quantityLabel}>Quantity</span>
      <div className={styles.quantityControl}>
        <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
        <output aria-live="polite">{quantity}</output>
        <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>+</button>
      </div>

      <p className={available ? styles.stockStatus : styles.outOfStock}>
        {available ? (inventory ? <>Low stock! Only <strong>{inventory}</strong> units left!</> : "In stock") : "Out of stock"}
      </p>
      <span className={styles.stockBar} aria-hidden="true"><span /></span>

      {relatedProducts.length > 0 && (
        <section className={styles.relatedProducts} aria-labelledby="frequently-bought-heading">
          <h2 id="frequently-bought-heading">Frequently Bought Together</h2>
          {relatedProducts.map((product) => {
            const variantIndex = relatedVariants[product.id] || 0;
            return (
              <label className={styles.relatedProduct} key={product.id}>
                <input type="checkbox" checked={Boolean(relatedSelections[product.id])} onChange={(event) => setRelatedSelections((values) => ({ ...values, [product.id]: event.target.checked }))} />
                {product.image && <img src={product.image} alt="" />}
                <span>
                  <strong>{product.name}</strong>
                  <small>{formatPrice(product.variants[variantIndex]?.price)}</small>
                  {product.variants.length > 0 && (
                    <select value={variantIndex} onChange={(event) => setRelatedVariants((values) => ({ ...values, [product.id]: Number(event.target.value) }))} aria-label={`${product.name} option`}>
                      {product.variants.map((variant, index) => <option key={variant.id || index} value={index}>{relatedVariantLabel(product.name, variant, index)}</option>)}
                    </select>
                  )}
                </span>
              </label>
            );
          })}
        </section>
      )}

      <button type="button" className={styles.addToCart} disabled={!available} onClick={addToCart}>
        {added ? "Added to cart" : available ? "Add to cart" : "Sold out"}
      </button>

      <div className={styles.stickyPurchaseBar}>
        <div className={styles.stickyProduct}>
          {image && <img src={image} alt="" />}
          <strong>{productName}</strong>
        </div>
        {variants.length > 1 && (
          <select value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))} aria-label="Product option">
            {variants.map((variant, index) => <option key={variant.id || index} value={index}>{variantLabel(variant, index)}</option>)}
          </select>
        )}
        <div className={styles.stickyQuantity}>
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
          <span>{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>+</button>
        </div>
        <strong className={styles.stickyPrice}>{price}</strong>
        <button type="button" className={styles.stickyButton} disabled={!available} onClick={addToCart}>{added ? "Added" : available ? "Add to Cart" : "Sold out"}</button>
      </div>
    </>
  );
}
