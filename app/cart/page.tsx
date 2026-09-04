"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import styles from "@/app/store.module.css";

type CartItem = {
  key: string;
  productName: string;
  image?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
};

const CART_KEY = "quitrx-cart";

function numericPrice(value?: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export default function CartPage() {
  const storedCart = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("quitrx:cart-updated", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("quitrx:cart-updated", onStoreChange);
      };
    },
    () => localStorage.getItem(CART_KEY) || "[]",
    () => "[]",
  );
  const items = useMemo<CartItem[]>(() => JSON.parse(storedCart), [storedCart]);

  function save(nextItems: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: nextItems }));
  }

  const subtotal = items.reduce((total, item) => total + numericPrice(item.price) * item.quantity, 0);

  return (
    <main className={styles.cartPage}>
      <div className="page-width">
        <div className={styles.cartHeading}>
          <h1>Your cart</h1>
          <Link href="/collections/all-products">Continue shopping</Link>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <p>Your cart is empty.</p>
            <Link href="/collections/all-products">Shop products</Link>
          </div>
        ) : (
          <div className={styles.cartLayout}>
            <div className={styles.cartItems}>
              {items.map((item) => (
                <article className={styles.cartItem} key={item.key}>
                  <div className={styles.cartImage}>{item.image && <img src={item.image} alt="" />}</div>
                  <div className={styles.cartItemInfo}>
                    <h2>{item.productName}</h2>
                    <p>{item.variantName}</p>
                    <strong>{money(numericPrice(item.price))}</strong>
                  </div>
                  <div className={styles.cartQuantity}>
                    <button type="button" onClick={() => save(items.map((entry) => entry.key === item.key ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry))} aria-label={`Decrease ${item.productName} quantity`}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => save(items.map((entry) => entry.key === item.key ? { ...entry, quantity: entry.quantity + 1 } : entry))} aria-label={`Increase ${item.productName} quantity`}>+</button>
                  </div>
                  <button className={styles.removeCartItem} type="button" onClick={() => save(items.filter((entry) => entry.key !== item.key))}>Remove</button>
                </article>
              ))}
            </div>
            <aside className={styles.cartSummary}>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
              <p>Shipping and payment are confirmed at checkout.</p>
              <Link href="/checkout">Continue to checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
