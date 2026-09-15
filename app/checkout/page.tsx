"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./checkout.module.css";

type CartItem = {
  key: string;
  productName: string;
  image?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
  variantId?: string;
};

const CART_KEY = "quitrx-cart";
const STANDARD_SHIPPING = 12.90;
const EXPRESS_SHIPPING = 15.90;

function numericPrice(value?: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function readCart() {
  return localStorage.getItem(CART_KEY) || "[]";
}

export default function CheckoutPage() {
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const storedCart = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("quitrx:cart-updated", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("quitrx:cart-updated", onStoreChange);
      };
    },
    readCart,
    () => "[]",
  );
  const items = useMemo<CartItem[]>(() => {
    try {
      return JSON.parse(storedCart);
    } catch {
      return [];
    }
  }, [storedCart]);
  const subtotal = items.reduce(
    (total, item) => total + numericPrice(item.price) * item.quantity,
    0,
  );
  const shipping = shippingMethod === "express" ? EXPRESS_SHIPPING : STANDARD_SHIPPING;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;
    const orderItems = items.flatMap((item) => item.variantId
      ? [{ variantId: item.variantId, quantity: item.quantity }]
      : []);
    if (orderItems.length !== items.length) {
      setNotice("One or more cart items are missing a variant. Please remove them and add them again.");
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtotal, total: subtotal + shipping, items: orderItems }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We couldn't place your order. Please try again.");

      localStorage.setItem(CART_KEY, "[]");
      window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items: [] } }));
      setNotice("Your order has been placed successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We couldn't place your order. Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.checkoutShell}>
        <section className={styles.formColumn}>
          <Link className={styles.logo} href="/" aria-label="QuitRx homepage">
            Quit<span>Rx</span>
          </Link>
          <Link className={styles.backLink} href="/cart" aria-label="Return to cart">
            <span aria-hidden="true">←</span> Return to cart
          </Link>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.eyebrow}>Secure checkout</p>
              <h1>Checkout</h1>
            </div>
            <div className={styles.secureBadge} aria-label="Secure checkout">
              <span aria-hidden="true">▣</span> Secure
            </div>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>{notice ? "Order confirmed" : "Your cart is empty"}</h2>
              <p>{notice || "Add a product before continuing to checkout."}</p>
              <Link href="/collections/all-products">Browse products</Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>1</span>
                  <div><h2>Contact</h2><p>We&apos;ll send your order updates here.</p></div>
                </div>
                <label className={styles.fieldWide}>
                  <span>Email address</span>
                  <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
                </label>
                <label className={styles.checkbox}>
                  <input type="checkbox" name="newsletter" />
                  <span>Email me news and special offers</span>
                </label>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>2</span>
                  <div><h2>Delivery address</h2><p>Where should we send your order?</p></div>
                </div>
                <div className={styles.fieldGrid}>
                  <label><span>First name</span><input name="firstName" autoComplete="given-name" required /></label>
                  <label><span>Last name</span><input name="lastName" autoComplete="family-name" required /></label>
                  <label className={styles.fieldWide}><span>Address</span><input name="address" autoComplete="street-address" required /></label>
                  <label className={styles.fieldWide}><span>Apartment, suite, etc. <em>Optional</em></span><input name="address2" autoComplete="address-line2" /></label>
                  <label><span>Suburb</span><input name="city" autoComplete="address-level2" required /></label>
                  <label><span>State</span><select name="state" autoComplete="address-level1" defaultValue="" required><option value="" disabled>Select state</option><option>ACT</option><option>NSW</option><option>NT</option><option>QLD</option><option>SA</option><option>TAS</option><option>VIC</option><option>WA</option></select></label>
                  <label><span>Postcode</span><input name="postcode" autoComplete="postal-code" inputMode="numeric" required /></label>
                  <label><span>Phone</span><input type="tel" name="phone" autoComplete="tel" required /></label>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>3</span>
                  <div><h2>Shipping method</h2><p>Choose how quickly your order arrives.</p></div>
                </div>
                <div className={styles.shippingOptions}>
                  <label className={shippingMethod === "standard" ? styles.selectedOption : ""}>
                    <input type="radio" name="shipping" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} />
                    <span><strong>Standard shipping</strong><small>3–7 business days</small></span>
                    <strong>{money(STANDARD_SHIPPING)}</strong>
                  </label>
                  <label className={shippingMethod === "express" ? styles.selectedOption : ""}>
                    <input type="radio" name="shipping" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} />
                    <span><strong>Express shipping</strong><small>1–3 business days</small></span>
                    <strong>{money(EXPRESS_SHIPPING)}</strong>
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>4</span>
                  <div><h2>Payment</h2><p>Payment details are encrypted and secure.</p></div>
                </div>
                <div className={styles.paymentPlaceholder}>
                  <span aria-hidden="true">◇</span>
                  <div><strong>Secure payment gateway</strong><p>Connect your payment provider to accept card details and place orders.</p></div>
                </div>
              </section>

              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing order…" : "Place order"} <span aria-hidden="true">→</span></button>
              <p className={styles.terms}>By continuing, you agree to our <Link href="/terms-and-conditions">terms</Link> and <Link href="/privacy-policy">privacy policy</Link>.</p>
            </form>
          )}
        </section>

        <aside className={styles.summaryColumn} aria-label="Order summary">
          <div className={styles.summaryInner}>
            <h2>Order summary <span>{items.reduce((count, item) => count + item.quantity, 0)} items</span></h2>
            <div className={styles.items}>
              {items.map((item) => (
                <article className={styles.item} key={item.key}>
                  <div className={styles.itemImage}>
                    {item.image && <Image src={item.image} width={68} height={72} alt="" sizes="68px" />}
                    <span>{item.quantity}</span>
                  </div>
                  <div><strong>{item.productName}</strong><small>{item.variantName}</small></div>
                  <strong>{money(numericPrice(item.price) * item.quantity)}</strong>
                </article>
              ))}
            </div>
            <div className={styles.discount}>
              <label><span className="sr-only">Discount code</span><input placeholder="Discount code" /></label>
              <button type="button">Apply</button>
            </div>
            <dl className={styles.totals}>
              <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{money(shipping)}</dd></div>
              <div className={styles.total}><dt>Total <small>AUD</small></dt><dd>{money(subtotal + shipping)}</dd></div>
            </dl>
            <div className={styles.help}><span aria-hidden="true">?</span><p><strong>Need help?</strong><br /><Link href="/contact">Contact our support team</Link></p></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
