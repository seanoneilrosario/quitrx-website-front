"use client";

import { useState } from "react";
import styles from "@/app/store.module.css";
import { firstAvailableVariantIndex } from "@/lib/frequently-bought-together";
import { variantIsAvailable } from "@/lib/quithero-bundle";
import { buildMultiItemCartPayload } from "@/lib/storefront-cart";
import type { StorefrontCartItem } from "@/lib/storefront-cart";

type Variant = {
  id?: string;
  name?: string;
  price?: number | string;
  inventory?: number;
  size?: string;
  options?: Record<string, string>;
  bundleComponents?: unknown;
};

type RelatedProduct = {
  id: string;
  name: string;
  image?: string;
  variants: Variant[];
};

type BundleDropdown = {
  name: string;
  options: Array<{
    componentVariantId: string;
    productId: string;
    productName: string;
    variantName: string;
    available: boolean;
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

function addItemsToCart(items: StorefrontCartItem[]) {
  const stored = localStorage.getItem(CART_KEY);
  const cart: StorefrontCartItem[] = stored ? JSON.parse(stored) : [];

  items.forEach((item) => {
    const existing = cart.find((cartItem) => cartItem.key === item.key);
    if (existing) existing.quantity += item.quantity;
    else cart.push(item);
  });

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items: cart, open: true } }));
}

async function syncBundleComponents(item: StorefrontCartItem) {
  if (!item.variantId || !item.bundleComponents?.length) return;

  const bundlePayload = item.bundleComponents.map((component, index) => ({
    componentVariantId: component.variantId,
    position: index,
    quantity: component.quantity ?? 1,
  }));

  const response = await fetch(
    `/api/quithero-bundle/${encodeURIComponent(item.productId)}/${encodeURIComponent(item.variantId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundlePayload),
    },
  );
  if (!response.ok) throw new Error("Unable to add this bundle to the cart.");
}

export default function ProductPurchasePanel({
  productId,
  productName,
  image,
  variants,
  isBundle,
  bundleDropdowns,
  relatedProducts,
}: {
  productId: string;
  productName: string;
  image?: string;
  variants: Variant[];
  isBundle: boolean;
  bundleDropdowns: BundleDropdown[];
  relatedProducts: RelatedProduct[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(() => isBundle ? 0 : firstAvailableVariantIndex(variants));
  const [quantity, setQuantity] = useState(1);
  const [relatedSelections, setRelatedSelections] = useState<Record<string, boolean>>({});
  const [relatedVariants, setRelatedVariants] = useState<Record<string, number>>(() => Object.fromEntries(
    relatedProducts.map((product) => [product.id, firstAvailableVariantIndex(product.variants)]),
  ));
  const [bundleSelections, setBundleSelections] = useState(() => bundleDropdowns.map((dropdown) =>
    dropdown.options.find((option) => option.available)?.componentVariantId || "",
  ));
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState("");
  const [added, setAdded] = useState(false);
  const selected = variants[selectedIndex];
  const inventory = selected?.inventory;
  const selectedBundleOptions = bundleDropdowns.map((dropdown, index) =>
    dropdown.options.find((option) => option.componentVariantId === bundleSelections[index]),
  );
  const bundleIsAvailable = selectedBundleOptions.length > 0
    && selectedBundleOptions.every((option) => option?.available);
  const available = isBundle
    ? Boolean(selected?.id) && !bundleLoading && !bundleError && bundleIsAvailable
    : variantIsAvailable(selected);
  const price = formatPrice((selected || variants[0])?.price);

  function selectParentVariant(index: number) {
    setSelectedIndex(index);
  }

  function selectBundleComponent(dropdownIndex: number, variantId: string) {
    setBundleSelections((selections) => selections.map((selection, index) =>
      index === dropdownIndex ? variantId : selection,
    ));
  }

  async function addToCart() {
    if (!available) return;

    const mainVariantName = selected ? variantLabel(selected, selectedIndex) : "Default";
    const selectedBundleComponents = selectedBundleOptions.flatMap((option) => option ? [{
      productId: option.productId,
      productName: option.productName,
      variantId: option.componentVariantId,
      variantName: option.variantName,
      quantity: 1,
    }] : []);
    const configurationKey = selectedBundleComponents.map((component) => component.variantId || component.variantName).join(",");
    const mainItem: StorefrontCartItem = {
      key: `${productId}:${selected?.id || mainVariantName}${configurationKey ? `:${configurationKey}` : ""}`,
      productId,
      productName,
      image,
      variantId: selected?.id,
      variantName: mainVariantName,
      price: selected?.price,
      quantity,
      ...(selectedBundleComponents.length ? { bundleComponents: selectedBundleComponents } : {}),
    };
    const recommendationItems = relatedProducts.flatMap((product) => {
      const index = relatedVariants[product.id] || 0;
      const variant = product.variants[index];
      if (!variant || !variantIsAvailable(variant)) return [];
      const name = variant ? variantLabel(variant, index) : "Default";
      return [{
        key: `${product.id}:${variant?.id || name}`,
        productId: product.id,
        productName: product.name,
        image: product.image,
        variantId: variant?.id,
        variantName: name,
        price: variant?.price,
        quantity: 1,
        checked: Boolean(relatedSelections[product.id]),
      }];
    });
    const items = buildMultiItemCartPayload(mainItem, recommendationItems);

    if (isBundle) {
      setBundleLoading(true);
      setBundleError("");
      try {
        await syncBundleComponents(items[0]);
      } catch {
        setBundleError("Unable to add this bundle to the cart. Please try again.");
        setBundleLoading(false);
        return;
      }
      setBundleLoading(false);
    }
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
              <button key={variant.id || `${variantLabel(variant, index)}-${index}`} type="button" className={selectedIndex === index ? styles.variantActive : ""} disabled={!variantIsAvailable(variant)} onClick={() => selectParentVariant(index)}>
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

      {isBundle && bundleDropdowns.length > 0 && (
        <section className={styles.bundleProducts} aria-label="Bundle includes">
          {bundleDropdowns.map((dropdown, dropdownIndex) => (
            <label className={styles.bundleComponent} key={`${dropdown.name}-${dropdownIndex}`}>
              <span>{dropdown.name}</span>
              <select
                className={styles.bundleComponentValue}
                value={bundleSelections[dropdownIndex]}
                required
                onChange={(event) => selectBundleComponent(dropdownIndex, event.target.value)}
              >
                <option value="" disabled>Select an option</option>
                {dropdown.options.map((choice) => (
                  <option key={choice.componentVariantId} value={choice.componentVariantId} disabled={!choice.available}>
                    {bundleChoiceLabel(choice.productName, choice.variantName)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className={styles.relatedProducts} aria-labelledby="frequently-bought-heading">
          <h2 id="frequently-bought-heading">Frequently Bought Together.</h2>
          {relatedProducts.map((product) => {
            const variantIndex = relatedVariants[product.id] || 0;
            return (
              <article className={styles.relatedProduct} key={product.id}>
                <input id={`related-${product.id}`} type="checkbox" checked={Boolean(relatedSelections[product.id])} onChange={(event) => setRelatedSelections((values) => ({ ...values, [product.id]: event.target.checked }))} />
                {product.image && <img src={product.image} alt="" />}
                <span>
                  <label htmlFor={`related-${product.id}`}><strong>{product.name}</strong></label>
                  <small>{formatPrice(product.variants[variantIndex]?.price)}</small>
                  {product.variants.length > 0 && (
                    <select value={variantIndex} onChange={(event) => setRelatedVariants((values) => ({ ...values, [product.id]: Number(event.target.value) }))} aria-label={`${product.name} option`}>
                      {product.variants.map((variant, index) => <option key={variant.id || index} value={index} disabled={!variantIsAvailable(variant)}>{relatedVariantLabel(product.name, variant, index)}</option>)}
                    </select>
                  )}
                </span>
              </article>
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
            {variants.map((variant, index) => <option key={variant.id || index} value={index} disabled={!variantIsAvailable(variant)}>{variantLabel(variant, index)}</option>)}
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
