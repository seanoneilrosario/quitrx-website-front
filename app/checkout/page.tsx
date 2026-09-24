"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./checkout.module.css";
import { CHECKOUT_SHIPPING } from "@/lib/checkout";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-image";

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

function readPaymentStatus() {
  return new URLSearchParams(window.location.search).get("payment");
}

export default function CheckoutPage() {
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"eway" | "paypal">("eway");
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
  const paymentStatus = useSyncExternalStore(() => () => undefined, readPaymentStatus, () => null);
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
  const shipping = CHECKOUT_SHIPPING[shippingMethod];

  const paymentNotice = paymentStatus === "success"
    ? "Payment successful. Your order has been placed."
    : paymentStatus === "failed"
      ? "Payment was declined or could not be completed. Please try again."
      : paymentStatus === "cancelled"
        ? "Payment was cancelled. Your cart has not been changed."
        : paymentStatus === "invalid"
          ? "We couldn't verify that payment session. Please try again."
          : "";
  const displayedNotice = notice || paymentNotice;

  useEffect(() => {
    if (paymentStatus === "success") {
      localStorage.setItem(CART_KEY, "[]");
      window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items: [] } }));
    }
  }, [paymentStatus]);

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
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/payments/${paymentMethod}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingMethod,
          items: orderItems,
          customer: {
            email: formData.get("email"),
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            address: formData.get("address"),
            address2: formData.get("address2"),
            city: formData.get("city"),
            state: formData.get("state"),
            postcode: formData.get("postcode"),
            phone: formData.get("phone"),
          },
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; paymentUrl?: string };
      if (!response.ok || !result.paymentUrl) throw new Error(result.error || "We couldn't start payment. Please try again.");
      window.location.assign(result.paymentUrl);
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
            <Image src="/images/quitrx-logo-light.png" width={174} height={71} alt="QuitRx" priority />
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
              <h2>{paymentStatus === "success" ? "Order confirmed" : "Your cart is empty"}</h2>
              <p>{displayedNotice || "Add a product before continuing to checkout."}</p>
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
                    <strong>{money(CHECKOUT_SHIPPING.standard)}</strong>
                  </label>
                  <label className={shippingMethod === "express" ? styles.selectedOption : ""}>
                    <input type="radio" name="shipping" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} />
                    <span><strong>Express shipping</strong><small>1–3 business days</small></span>
                    <strong>{money(CHECKOUT_SHIPPING.express)}</strong>
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>4</span>
                  <div><h2>Payment</h2><p>Payment details are encrypted and secure.</p></div>
                </div>
                <div className={styles.paymentOptions}>
                  <label className={paymentMethod === "eway" ? styles.selectedOption : ""}>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "eway"} onChange={() => setPaymentMethod("eway")} />
                    <span><strong>Credit or debit card via eWAY</strong><small>You&apos;ll enter your card details securely on eWAY.</small></span>
                  </label>
                  <label className={paymentMethod === "paypal" ? styles.selectedOption : ""}>
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} />
                    <span><strong>PayPal</strong><small>You&apos;ll be redirected to PayPal to approve your payment.</small></span>
                  </label>
                </div>
              </section>

              {displayedNotice && <p className={styles.notice} role="status">{displayedNotice}</p>}
              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>{isSubmitting ? `Connecting to ${paymentMethod === "paypal" ? "PayPal" : "eWAY"}…` : `Pay securely with ${paymentMethod === "paypal" ? "PayPal" : "eWAY"}`} <span aria-hidden="true">→</span></button>
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
                    <Image src={item.image || DEFAULT_PRODUCT_IMAGE} width={68} height={72} alt="" sizes="68px" />
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
