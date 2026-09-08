"use client";

import { useEffect, useState } from "react";
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

type BundleComponent = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  available: boolean;
  choices?: Array<{
    variantId: string;
    productId: string;
    productName: string;
    variantName: string;
    available: boolean;
  }>;
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

function bundleChoiceLabel(productName: string, variantName: string) {
  if (variantName === "Default") return productName;
  if (variantName.toLowerCase().startsWith(productName.toLowerCase())) return variantName;
  return `${productName} ${variantName}`;
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
  isBundle,
  relatedProducts,
}: {
  productId: string;
  productName: string;
  image?: string;
  variants: Variant[];
  isBundle: boolean;
  relatedProducts: RelatedProduct[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedSelections, setRelatedSelections] = useState<Record<string, boolean>>({});
  const [relatedVariants, setRelatedVariants] = useState<Record<string, number>>({});
  const [bundleComponents, setBundleComponents] = useState<BundleComponent[]>([]);
  const [bundleLoading, setBundleLoading] = useState(isBundle && Boolean(variants[0]?.id));
  const [bundleError, setBundleError] = useState("");
  const [added, setAdded] = useState(false);
  const selected = variants[selectedIndex];
  const inventory = selected?.inventory;
  const bundleIsAvailable = bundleComponents.length > 0 && bundleComponents.every((component) => component.available);
  const available = isBundle
    ? Boolean(selected?.id) && !bundleLoading && !bundleError && bundleIsAvailable
    : inventory === undefined || inventory > 0;
  const price = formatPrice((selected || variants[0])?.price);

  useEffect(() => {
    if (!isBundle || !selected?.id) return;

    const controller = new AbortController();
    fetch(`/api/quithero-bundle/${encodeURIComponent(productId)}/${encodeURIComponent(selected.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load this bundle.");
        return response.json() as Promise<BundleComponent[]>;
      })
      .then(setBundleComponents)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBundleError("Unable to load this bundle. Please choose it again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBundleLoading(false);
      });

    return () => controller.abort();
  }, [isBundle, productId, selected?.id]);

  function selectParentVariant(index: number) {
    if (isBundle) {
      setBundleComponents([]);
      setBundleError("");
      setBundleLoading(true);
    }
    setSelectedIndex(index);
  }

  function selectBundleComponent(componentIndex: number, variantId: string) {
    setBundleComponents((components) => components.map((component, index) => {
      if (index !== componentIndex) return component;
      const choice = component.choices?.find((option) => option.variantId === variantId);
      return choice ? { ...component, ...choice, quantity: 1 } : component;
    }));
  }

  function addToCart() {
    if (!available) return;

    const mainVariantName = selected ? variantLabel(selected, selectedIndex) : "Default";
    const selectedBundleComponents = bundleComponents.map((component) => ({
      productId: component.productId,
      productName: component.productName,
      variantId: component.variantId,
      variantName: component.variantName,
      quantity: component.quantity,
    }));
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

      {!isBundle && variants.length > 1 && (
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

      <p className={available ? styles.stockStatus : styles.outOfStock}>
        {bundleLoading ? "Loading bundle..." : bundleError || (available ? (inventory ? <>Low stock! Only <strong>{inventory}</strong> units left!</> : "In stock") : selected ? "Out of stock" : "Select a bundle")}
      </p>
      <span className={styles.stockBar} aria-hidden="true"><span /></span>

      {isBundle && bundleComponents.length > 0 && (
        <section className={styles.bundleProducts} aria-label="Bundle includes">
          {bundleComponents.map((component, componentIndex) => (
            <label className={styles.bundleComponent} key={component.id || `${component.variantId}-${componentIndex}`}>
              <span>Selection {componentIndex + 1}</span>
              <select
                className={styles.bundleComponentValue}
                value={component.variantId}
                onChange={(event) => selectBundleComponent(componentIndex, event.target.value)}
              >
                {(component.choices || [component]).map((choice) => (
                  <option key={choice.variantId} value={choice.variantId} disabled={!choice.available}>
                    {bundleChoiceLabel(choice.productName, choice.variantName)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}

      {!isBundle && relatedProducts.length > 0 && (
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
        {added ? "Added to cart" : bundleLoading ? "Loading bundle" : !selected ? "Select a bundle" : available ? "Add to cart" : "Sold out"}
      </button>

      <div className={styles.stickyPurchaseBar}>
        <div className={styles.stickyProduct}>
          {image && <img src={image} alt="" />}
          <strong>{productName}</strong>
        </div>
        {!isBundle && variants.length > 1 && (
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
        <button type="button" className={styles.stickyButton} disabled={!available} onClick={addToCart}>{added ? "Added" : bundleLoading ? "Loading" : !selected ? "Select bundle" : available ? "Add to Cart" : "Sold out"}</button>
      </div>
    </>
  );
}
