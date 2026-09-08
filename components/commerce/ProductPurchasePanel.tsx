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

type BundleSlot = {
  key: string;
  label?: string;
  defaultVariantId?: string;
  quantity: number;
  options: Array<{ productId: string; productName: string; variant: Variant }>;
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
  bundleComponents?: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    variantName: string;
    quantity: number;
  }>;
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

function bundleVariantLabel(variant: Variant, index: number) {
  return variant.name || variantLabel(variant, index);
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
  bundles,
  bundleAvailability,
  relatedProducts,
}: {
  productId: string;
  productName: string;
  image?: string;
  variants: Variant[];
  bundles: Record<string, BundleSlot[]>;
  bundleAvailability: Record<string, boolean>;
  relatedProducts: RelatedProduct[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedSelections, setRelatedSelections] = useState<Record<string, boolean>>({});
  const [relatedVariants, setRelatedVariants] = useState<Record<string, number>>({});
  const [bundleVariants, setBundleVariants] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const selected = variants[selectedIndex];
  const bundleSlots = selected?.id ? bundles[selected.id] || [] : [];
  const hasBundle = Boolean(selected?.id && Object.hasOwn(bundleAvailability, selected.id));
  const selectedBundleVariantId = (slot: BundleSlot) => bundleVariants[slot.key]
    ?? (slot.defaultVariantId && slot.options.some((option) => option.variant.id === slot.defaultVariantId) ? slot.defaultVariantId : undefined)
    ?? (slot.options.length === 1 ? slot.options[0].variant.id : undefined);
  const bundleSelectionsAreValid = !hasBundle || (bundleSlots.length > 0 && bundleSlots.every((slot) =>
    slot.options.some((option) => option.variant.id === selectedBundleVariantId(slot)),
  ));
  const inventory = selected?.inventory;
  const bundleIsAvailable = Boolean(selected?.id && bundleAvailability[selected.id] === true);
  const available = selected?.id && hasBundle
    ? bundleIsAvailable && bundleSelectionsAreValid
    : inventory === undefined || inventory > 0;
  const price = formatPrice(selected?.price);

  function selectParentVariant(index: number) {
    const nextVariant = variants[index];
    const nextSlots = nextVariant?.id ? bundles[nextVariant.id] || [] : [];
    setSelectedIndex(index);
    setBundleVariants(Object.fromEntries(nextSlots.flatMap((slot) => {
      const initial = slot.defaultVariantId && slot.options.some((option) => option.variant.id === slot.defaultVariantId)
        ? slot.defaultVariantId
        : slot.options.length === 1 ? slot.options[0].variant.id : undefined;
      return initial ? [[slot.key, initial]] : [];
    })));
  }

  function addToCart() {
    if (!available) return;

    const mainVariantName = selected ? variantLabel(selected, selectedIndex) : "Default";
    const selectedBundleComponents = bundleSlots.flatMap((slot) => {
      const option = slot.options.find((candidate) => candidate.variant.id === selectedBundleVariantId(slot));
      if (!option) return [];
      return {
        productId: option.productId,
        productName: option.productName,
        variantId: option.variant.id,
        variantName: bundleVariantLabel(option.variant, slot.options.indexOf(option)),
        quantity: slot.quantity,
      };
    });
    const combinedBundleComponents = Array.from(selectedBundleComponents.reduce((combined, component) => {
      const componentKey = `${component.productId}:${component.variantId || component.variantName}`;
      const existing = combined.get(componentKey);
      if (existing) existing.quantity += component.quantity;
      else combined.set(componentKey, component);
      return combined;
    }, new Map<string, NonNullable<CartItem["bundleComponents"]>[number]>()).values());
    const configurationKey = selectedBundleComponents.map((component) => component.variantId || component.variantName).join(",");
    const items: CartItem[] = [{
      key: `${productId}:${selected?.id || mainVariantName}${configurationKey ? `:${configurationKey}` : ""}`,
      productId,
      productName,
      image,
      variantId: selected?.id,
      variantName: mainVariantName,
      price: selected?.price,
      quantity,
      ...(combinedBundleComponents.length ? { bundleComponents: combinedBundleComponents } : {}),
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
              <button key={variant.id || `${variantLabel(variant, index)}-${index}`} type="button" className={selectedIndex === index ? styles.variantActive : ""} onClick={() => selectParentVariant(index)}>
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

      <p className={(hasBundle ? bundleIsAvailable : available) ? styles.stockStatus : styles.outOfStock}>
        {(hasBundle ? bundleIsAvailable : available) ? (inventory ? <>Low stock! Only <strong>{inventory}</strong> units left!</> : "In stock") : "Out of stock"}
      </p>
      <span className={styles.stockBar} aria-hidden="true"><span /></span>

      {hasBundle && (
        <section className={styles.bundleProducts} aria-label="Bundle includes">
          {bundleSlots.map((slot, slotIndex) => {
            const value = selectedBundleVariantId(slot) || "";
            const fallbackProductName = slot.options[0]?.productName || "Bundle Item";
            return (
              <label className={styles.bundleProduct} key={slot.key}>
                <span>{slot.label || `${fallbackProductName} - ${slotIndex + 1}`}</span>
                <select
                  value={value}
                  disabled={slot.options.length <= 1}
                  onChange={(event) => setBundleVariants((values) => ({ ...values, [slot.key]: event.target.value }))}
                  aria-label={`${slot.label || `Bundle item ${slotIndex + 1}`} option`}
                >
                  {!value && <option value="">Please select an option</option>}
                  {slot.options.map((option, variantOptionIndex) => (
                    <option key={option.variant.id || variantOptionIndex} value={option.variant.id}>
                      {bundleVariantLabel(option.variant, variantOptionIndex)}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </section>
      )}

      {!hasBundle && relatedProducts.length > 0 && (
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
        {added ? "Added to cart" : hasBundle && bundleIsAvailable && !bundleSelectionsAreValid ? "Select bundle options" : available ? "Add to cart" : "Sold out"}
      </button>

      <div className={styles.stickyPurchaseBar}>
        <div className={styles.stickyProduct}>
          {image && <img src={image} alt="" />}
          <strong>{productName}</strong>
        </div>
        {variants.length > 1 && (
          <select value={selectedIndex} onChange={(event) => selectParentVariant(Number(event.target.value))} aria-label="Product option">
            {variants.map((variant, index) => <option key={variant.id || index} value={index}>{variantLabel(variant, index)}</option>)}
          </select>
        )}
        <div className={styles.stickyQuantity}>
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
          <span>{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>+</button>
        </div>
        <strong className={styles.stickyPrice}>{price}</strong>
        <button type="button" className={styles.stickyButton} disabled={!available} onClick={addToCart}>{added ? "Added" : hasBundle && bundleIsAvailable && !bundleSelectionsAreValid ? "Select options" : available ? "Add to Cart" : "Sold out"}</button>
      </div>
    </>
  );
}
