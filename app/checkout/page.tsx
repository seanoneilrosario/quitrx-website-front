"use client";

import { useCheckoutDiscounts } from "@/hooks/useCheckoutDiscounts";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./checkout.module.css";
import { CHECKOUT_SHIPPING, getCheckoutCustomerDefaults } from "@/lib/checkout/checkout";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/catalog/product-image";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

type CartItem = {
  key: string;
  productId: string;
  productName: string;
  image?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
  variantId?: string;
  bundleComponents?: Array<{
    productName: string;
    variantName: string;
    quantity: number;
  }>;
};

const CART_KEY = "quitrx-cart";
const PAYPAL_ENABLED = process.env.NEXT_PUBLIC_PAYPAL_ENABLED === "true";

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
  const { customer } = useAccountCustomer();
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"eway" | "paypal">("eway");
  const [discountInput, setDiscountInput] = useState<string>();
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentNeedsReview, setPaymentNeedsReview] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(false);
  const submissionLock = useRef(false);
  const cardNameRef = useRef<HTMLInputElement>(null);
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const cardExpiryMonthRef = useRef<HTMLInputElement>(null);
  const cardExpiryYearRef = useRef<HTMLInputElement>(null);
  const cardCvnRef = useRef<HTMLInputElement>(null);
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
  const paymentStatus = useSyncExternalStore(
    () => () => undefined,
    readPaymentStatus,
    () => null,
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
  const discounts = useCheckoutDiscounts(
    items,
    shippingMethod,
    customer?.id,
    completedPayment || paymentStatus === "success",
  );
  const displayedDiscountInput = discountInput ?? discounts.code;
  const preview = discounts.preview;
  const customerDefaults = useMemo(() => getCheckoutCustomerDefaults(customer), [customer]);

  const paymentNotice =
    paymentStatus === "success"
      ? "Payment successful. Your order has been placed."
      : paymentStatus === "failed"
        ? "Payment was declined or could not be completed. Please try again."
        : paymentStatus === "cancelled"
          ? "Payment was cancelled. Your cart has not been changed."
          : paymentStatus === "invalid"
            ? "We couldn't verify that payment session. Please try again."
            : "";
  const displayedNotice =
    notice ||
    (completedPayment ? "Payment successful. Your order has been placed." : paymentNotice);

  useEffect(() => {
    if (paymentStatus === "success" || completedPayment) {
      localStorage.setItem(CART_KEY, "[]");
      window.dispatchEvent(new CustomEvent("quitrx:cart-updated", { detail: { items: [] } }));
    }
  }, [completedPayment, paymentStatus]);

  function submitEwayPayment(formActionUrl: string, accessCode: string) {
    const fields = {
      EWAY_ACCESSCODE: accessCode,
      EWAY_PAYMENTTYPE: "Credit Card",
      EWAY_CARDNAME: cardNameRef.current?.value.trim() || "",
      EWAY_CARDNUMBER: cardNumberRef.current?.value.replace(/\D/g, "") || "",
      EWAY_CARDEXPIRYMONTH: cardExpiryMonthRef.current?.value.trim() || "",
      EWAY_CARDEXPIRYYEAR: cardExpiryYearRef.current?.value.trim() || "",
      EWAY_CARDCVN: cardCvnRef.current?.value.replace(/\D/g, "") || "",
    };
    const paymentForm = document.createElement("form");
    paymentForm.method = "POST";
    paymentForm.action = formActionUrl;
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      paymentForm.appendChild(input);
    }
    document.body.appendChild(paymentForm);
    paymentForm.submit();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current || paymentNeedsReview || !preview || discounts.loading) return;
    const orderItems = items.flatMap((item) =>
      item.productId && item.variantId
        ? [{ productId: item.productId, variantId: item.variantId, quantity: item.quantity }]
        : [],
    );
    if (orderItems.length !== items.length) {
      setNotice(
        "One or more cart items are missing a variant. Please remove them and add them again.",
      );
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
          discountCode: discounts.code || undefined,
          expectedTotal: preview.totalAfterDiscount,
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
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        paymentUrl?: string;
        formActionUrl?: string;
        accessCode?: string;
      };
      if (
        !response.ok ||
        (paymentMethod === "eway" ? !result.formActionUrl : !result.paymentUrl)
      ) {
        discounts.refresh();
        throw new Error(result.error || "We couldn't start payment. Please try again.");
      }
      if (paymentMethod === "eway") {
        if (!result.accessCode) throw new Error("We couldn't verify the secure payment session.");
        submitEwayPayment(result.formActionUrl!, result.accessCode);
      } else {
        window.location.assign(result.paymentUrl!);
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "We couldn't place your order. Please try again.",
      );
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
            <Image
              src="/images/quitrx-logo-light.png"
              width={174}
              height={71}
              alt="QuitRx"
              priority
            />
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
              <h2>
                {paymentStatus === "success" || completedPayment
                  ? "Order confirmed"
                  : "Your cart is empty"}
              </h2>
              <p>{displayedNotice || "Add a product before continuing to checkout."}</p>
              <Link href="/collections/all-products">Browse products</Link>
            </div>
          ) : (
            <form
              className={styles.form}
              key={customer?.id ?? customer?.email ?? "guest"}
              onSubmit={handleSubmit}
            >
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>1</span>
                  <div>
                    <h2>Contact</h2>
                    <p>We&apos;ll send your order updates here.</p>
                  </div>
                </div>
                <label className={styles.fieldWide}>
                  <span>Email address</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    defaultValue={customerDefaults.email}
                    required
                  />
                </label>
                <label className={styles.checkbox}>
                  <input type="checkbox" name="newsletter" defaultChecked />
                  <span>Email me news and special offers</span>
                </label>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>2</span>
                  <div>
                    <h2>Delivery address</h2>
                    <p>Where should we send your order?</p>
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <label>
                    <span>First name</span>
                    <input
                      name="firstName"
                      autoComplete="given-name"
                      defaultValue={customerDefaults.firstName}
                      required
                    />
                  </label>
                  <label>
                    <span>Last name</span>
                    <input
                      name="lastName"
                      autoComplete="family-name"
                      defaultValue={customerDefaults.lastName}
                      required
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>Address</span>
                    <input
                      name="address"
                      autoComplete="street-address"
                      defaultValue={customerDefaults.address}
                      required
                    />
                  </label>
                  <label className={styles.fieldWide}>
                    <span>
                      Apartment, suite, etc. <em>Optional</em>
                    </span>
                    <input
                      name="address2"
                      autoComplete="address-line2"
                      defaultValue={customerDefaults.address2}
                    />
                  </label>
                  <label>
                    <span>Suburb</span>
                    <input
                      name="city"
                      autoComplete="address-level2"
                      defaultValue={customerDefaults.city}
                      required
                    />
                  </label>
                  <label>
                    <span>State</span>
                    <select
                      name="state"
                      autoComplete="address-level1"
                      defaultValue={customerDefaults.state}
                      required
                    >
                      <option value="" disabled>
                        Select state
                      </option>
                      <option>ACT</option>
                      <option>NSW</option>
                      <option>NT</option>
                      <option>QLD</option>
                      <option>SA</option>
                      <option>TAS</option>
                      <option>VIC</option>
                      <option>WA</option>
                    </select>
                  </label>
                  <label>
                    <span>Postcode</span>
                    <input
                      name="postcode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      defaultValue={customerDefaults.postcode}
                      required
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      defaultValue={customerDefaults.phone}
                      required
                    />
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>3</span>
                  <div>
                    <h2>Shipping method</h2>
                    <p>Choose how quickly your order arrives.</p>
                  </div>
                </div>
                <div className={styles.shippingOptions}>
                  <label className={shippingMethod === "standard" ? styles.selectedOption : ""}>
                    <input
                      type="radio"
                      name="shipping"
                      disabled={isSubmitting}
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                    />
                    <span>
                      <strong>Standard shipping</strong>
                      <small>3–7 business days</small>
                    </span>
                    <strong>{money(CHECKOUT_SHIPPING.standard)}</strong>
                  </label>
                  <label className={shippingMethod === "express" ? styles.selectedOption : ""}>
                    <input
                      type="radio"
                      name="shipping"
                      disabled={isSubmitting}
                      checked={shippingMethod === "express"}
                      onChange={() => setShippingMethod("express")}
                    />
                    <span>
                      <strong>Express shipping</strong>
                      <small>1–3 business days</small>
                    </span>
                    <strong>{money(CHECKOUT_SHIPPING.express)}</strong>
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <span>4</span>
                  <div>
                    <h2>Payment</h2>
                    <p>Payment details are encrypted and secure.</p>
                  </div>
                </div>
                <div className={styles.paymentOptions}>
                  <label className={paymentMethod === "eway" ? styles.selectedOption : ""}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "eway"}
                      onChange={() => setPaymentMethod("eway")}
                    />
                    <span>
                      <strong>Credit or debit card</strong>
                      <small>Pay securely using your credit or debit card.</small>
                    </span>
                  </label>
                  {PAYPAL_ENABLED && (
                    <label className={paymentMethod === "paypal" ? styles.selectedOption : ""}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "paypal"}
                        onChange={() => setPaymentMethod("paypal")}
                      />
                      <span>
                        <strong>PayPal</strong>
                        <small>You&apos;ll be redirected to PayPal to approve your payment.</small>
                      </span>
                    </label>
                  )}
                </div>
                {paymentMethod === "eway" && (
                  <div className={styles.cardFields}>
                    <label className={styles.fieldWide}>
                      <span>Name on card</span>
                      <input ref={cardNameRef} autoComplete="cc-name" maxLength={50} required />
                    </label>
                    <label className={styles.fieldWide}>
                      <span>Card number</span>
                      <input
                        ref={cardNumberRef}
                        autoComplete="cc-number"
                        inputMode="numeric"
                        minLength={12}
                        maxLength={23}
                        pattern="[0-9 ]{12,23}"
                        required
                      />
                    </label>
                    <label>
                      <span>Expiry month</span>
                      <input
                        ref={cardExpiryMonthRef}
                        autoComplete="cc-exp-month"
                        inputMode="numeric"
                        placeholder="MM"
                        minLength={2}
                        maxLength={2}
                        pattern="0[1-9]|1[0-2]"
                        required
                      />
                    </label>
                    <label>
                      <span>Expiry year</span>
                      <input
                        ref={cardExpiryYearRef}
                        autoComplete="cc-exp-year"
                        inputMode="numeric"
                        placeholder="YY"
                        minLength={2}
                        maxLength={2}
                        pattern="[0-9]{2}"
                        required
                      />
                    </label>
                    <label>
                      <span>Security code</span>
                      <input
                        ref={cardCvnRef}
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        minLength={3}
                        maxLength={4}
                        pattern="[0-9]{3,4}"
                        required
                      />
                    </label>
                    <p className={styles.cardSecurityNote}>
                      Card details are submitted securely from your browser directly to eWAY and
                      never pass through our server.
                    </p>
                  </div>
                )}
              </section>

              {displayedNotice && (
                <p className={styles.notice} role="status">
                  {displayedNotice}
                </p>
              )}
              <button
                className={styles.submitButton}
                type="submit"
                disabled={paymentNeedsReview || isSubmitting || !preview || discounts.loading}
              >
                {isSubmitting ? "Processing…" : "Pay Securely Now"}{" "}
                <span aria-hidden="true">→</span>
              </button>
              <p className={styles.terms}>
                By continuing, you agree to our <Link href="/terms-and-conditions">terms</Link> and{" "}
                <Link href="/privacy-policy">privacy policy</Link>.
              </p>
            </form>
          )}
        </section>

        <aside className={styles.summaryColumn} aria-label="Order summary">
          <div className={styles.summaryInner}>
            <h2>
              Order summary{" "}
              <span>
                {items.reduce((count, item) => count + item.quantity, 0) +
                  (preview?.promotionalItems.reduce(
                    (count, item) => count + item.quantity,
                    0,
                  ) ?? 0)}{" "}
                items
              </span>
            </h2>
            <div className={styles.items}>
              {items.map((item, itemIndex) => (
                <article className={styles.item} key={item.key}>
                  <div className={styles.itemImage}>
                    <Image
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      width={68}
                      height={72}
                      alt=""
                      sizes="68px"
                    />
                    <span>{item.quantity}</span>
                  </div>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.variantName}</small>
                    {preview?.lineDiscounts
                      .filter(
                        (line) =>
                          line.itemIndex === itemIndex &&
                          line.variantId === item.variantId &&
                          line.discountAmount > 0,
                      )
                      .map((line, index) => (
                        <small className={styles.savings} key={index}>
                          Savings: {money(line.discountAmount)}
                        </small>
                      ))}
                    {item.bundleComponents?.length ? (
                      <ol className={styles.itemBundle} aria-label="Bundle selections">
                        {item.bundleComponents.map((component, index) => (
                          <li key={`${component.productName}-${component.variantName}-${index}`}>
                            <span>{component.productName}</span>
                            {component.variantName !== "Default" && (
                              <span> - {component.variantName}</span>
                            )}
                            <span> &times; {component.quantity * item.quantity}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                  <strong>{money(numericPrice(item.price) * item.quantity)}</strong>
                </article>
              ))}
              {preview?.promotionalItems.map((item) => {
                const originalTotal = item.unitPrice * item.quantity;
                return (
                  <article
                    className={`${styles.item} ${styles.promotionalItem}`}
                    key={`promotion:${item.discountId}:${item.variantId}`}
                  >
                    <div className={styles.itemImage}>
                      <Image
                        src={item.image || DEFAULT_PRODUCT_IMAGE}
                        width={68}
                        height={72}
                        alt=""
                        sizes="68px"
                      />
                      <span>{item.quantity}</span>
                    </div>
                    <div>
                      <strong>{item.productName || "Promotional item"}</strong>
                      <small>{item.variantName || "Default"}</small>
                      <small className={styles.savings}>
                        Promotional item · {item.benefitType.toLowerCase().replace("_", " ")}
                      </small>
                    </div>
                    <strong>
                      {item.lineTotal < originalTotal && <del>{money(originalTotal)} </del>}
                      {item.lineTotal === 0 ? "FREE" : money(item.lineTotal)}
                    </strong>
                  </article>
                );
              })}
            </div>
            <form
              className={styles.discount}
              onSubmit={(event) => {
                event.preventDefault();
                if (!discounts.loading && !isSubmitting && displayedDiscountInput.trim()) {
                  discounts.apply(displayedDiscountInput);
                  setDiscountInput(undefined);
                }
              }}
            >
              <label>
                <span className="sr-only">Discount code</span>
                <input
                  placeholder="Discount code"
                  value={displayedDiscountInput}
                  maxLength={200}
                  disabled={isSubmitting || discounts.loading}
                  aria-describedby="discount-status"
                  onChange={(event) => setDiscountInput(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={
                  paymentNeedsReview ||
                  isSubmitting ||
                  discounts.loading ||
                  !items.length ||
                  !displayedDiscountInput.trim()
                }
              >
                {discounts.loading ? "Checking..." : "Apply"}
              </button>
              {discounts.code && (
                <button
                  className={styles.discountRemove}
                  type="button"
                  disabled={isSubmitting || discounts.loading}
                  onClick={() => {
                    setDiscountInput("");
                    discounts.apply("");
                  }}
                >
                  Remove {discounts.code}
                </button>
              )}
              <p id="discount-status" className={styles.discountStatus} role="status">
                {discounts.loading
                  ? "Updating discounts and totals..."
                  : discounts.error ||
                    (preview && discounts.code ? `Code ${discounts.code} applied.` : "")}
              </p>
              {discounts.error && (
                <button type="button" disabled={isSubmitting} onClick={discounts.refresh}>
                  Retry totals
                </button>
              )}
            </form>
            {preview && preview.appliedDiscounts.length > 0 && (
              <ul className={styles.appliedDiscounts} aria-label="Applied discounts">
                {preview.appliedDiscounts.map((discount, index) => (
                  <li key={`${discount.name}-${index}`}>
                    <span>
                      {discount.name} <small>({discount.scope.toLowerCase()})</small>
                    </span>
                    <strong>-{money(discount.discountAmount)}</strong>
                  </li>
                ))}
              </ul>
            )}
            <dl className={styles.totals}>
              <div>
                <dt>Subtotal</dt>
                <dd>
                  {preview ? money(preview.subtotal) : money(subtotal)}
                  {!preview && " (estimated)"}
                </dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>
                  {preview ? (
                    <>
                      {preview.shippingAfterDiscount !== preview.shippingTotal && (
                        <del>{money(preview.shippingTotal)} </del>
                      )}
                      {money(preview.shippingAfterDiscount)}
                    </>
                  ) : (
                    "Pending"
                  )}
                </dd>
              </div>
              <div>
                <dt>Total discount</dt>
                <dd>{preview ? `-${money(preview.discountAmount)}` : "Pending"}</dd>
              </div>
              <div className={styles.total}>
                <dt>
                  Total <small>AUD</small>
                </dt>
                <dd>{preview ? money(preview.totalAfterDiscount) : "Pending"}</dd>
              </div>
            </dl>
            <div className={styles.help}>
              <span aria-hidden="true">?</span>
              <p>
                <strong>Need help?</strong>
                <br />
                <Link href="/contact">Contact our support team</Link>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
