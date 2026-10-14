"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuitHeroOrder } from "@/lib/quithero";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import OrderItems from "./OrderItems";
import styles from "./order-details.module.css";

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function formatMoney(value?: number | string, currency = "AUD") {
  if (value == null || value === "") return "Not available";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
}

function readableStatus(value?: string) {
  return (value || "Pending")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function OrderDetails({ orderId }: { orderId: string }) {
  const { customer } = useAccountCustomer();
  const customerKey = customer?.id ?? customer?.email;
  const url = `/api/orders/${encodeURIComponent(orderId)}`;
  const { data: order, error: queryError } = useQuery({
    queryKey: ["api", url, customerKey],
    enabled: Boolean(customerKey),
    queryFn: async ({ signal }) => {
      const response = await fetch(url, { signal });
      const payload = (await response.json()) as QuitHeroOrder & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load this order.");
      return payload;
    },
  });
  const error = queryError instanceof Error ? queryError.message : "";

  if (error)
    return (
      <section className="account-card account-order-detail__message" role="alert">
        {error}
      </section>
    );
  if (!order)
    return (
      <section className="account-card account-order-detail__message">
        Loading order details...
      </section>
    );

  const status = order.fulfillmentStatus || order.status;
  const isCancelled =
    /^cancell?ed$/i.test(status || "") || /^cancell?ed$/i.test(order.status || "");

  const paid = order.paymentStatus?.toLowerCase() === "paid";
  const fulfilled = status?.toLowerCase() === "fulfilled";
  const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) ?? 0;
  const hasAmount = (value?: number | string) =>
    value != null && value !== "" && Number.isFinite(Number(value));

  return (
    <section className={styles.panel} aria-label="Order details">
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" />
              <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5v4" />
            </svg>
          </span>
          <div>
            <p className={styles.eyebrow}>Order reference</p>
            <h2>{order.orderNumber || order.id || "Order"}</h2>
            <p className={styles.date}>Placed {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className={styles.statuses}>
          <span
            className={`${styles.badge} ${isCancelled ? styles.cancelled : fulfilled ? styles.success : styles.pending}`}
          >
            <i aria-hidden="true" />
            {readableStatus(status)}
          </span>
          <span className={`${styles.badge} ${paid ? styles.success : styles.neutral}`}>
            Payment: {readableStatus(order.paymentStatus)}
          </span>
        </div>
      </header>
      <div className={styles.layout}>
        <div className={styles.items}>
          <div className={styles.sectionHeading}>
            <h3>Products ordered</h3>
            <span>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <OrderItems order={order} />
        </div>
        <aside className={styles.receipt} aria-label="Order summary">
          <h3>Order summary</h3>
          <dl>
            {hasAmount(order.subtotal) && (
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal, order.currencyCode)}</dd>
              </div>
            )}
            {hasAmount(order.discountTotal) && Number(order.discountTotal) !== 0 && (
              <div>
                <dt>Discount</dt>
                <dd>{formatMoney(-Math.abs(Number(order.discountTotal)), order.currencyCode)}</dd>
              </div>
            )}
            {hasAmount(order.shippingTotal) && (
              <div>
                <dt>Shipping</dt>
                <dd>
                  {Number(order.shippingTotal) === 0
                    ? "Free"
                    : formatMoney(order.shippingTotal, order.currencyCode)}
                </dd>
              </div>
            )}
            <div className={styles.total}>
              <dt>Order total</dt>
              <dd>{formatMoney(order.total, order.currencyCode)}</dd>
            </div>
          </dl>
          <p className={styles.currency}>{order.currencyCode || "AUD"}</p>
        </aside>
      </div>
    </section>
  );
}
