"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuitHeroOrder } from "@/lib/quithero";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function formatMoney(value?: number | string, currency = "AUD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
}

function readableStatus(value?: string) {
  return (value || "Pending").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
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
      const payload = await response.json() as QuitHeroOrder & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load this order.");
      return payload;
    },
  });
  const error = queryError instanceof Error ? queryError.message : "";

  if (error) return <section className="account-card account-order-detail__message" role="alert">{error}</section>;
  if (!order) return <section className="account-card account-order-detail__message">Loading order details...</section>;

  const status = order.fulfillmentStatus || order.status;
  const isCancelled = /^cancell?ed$/i.test(status || "") || /^cancell?ed$/i.test(order.status || "");

  return (
    <section className="account-card account-order-detail">
      <div className="account-order-detail__summary">
        <div><span>Order</span><strong>{order.orderNumber || order.id || "Order"}</strong></div>
        <div><span>Date placed</span><strong>{formatDate(order.createdAt)}</strong></div>
        <div><span>Status</span><strong className={`account-order-status${isCancelled ? " account-order-status--cancelled" : ""}`}><i />{readableStatus(status)}</strong></div>
        <div><span>Payment</span><strong>{readableStatus(order.paymentStatus)}</strong></div>
      </div>

      <div className="account-order-detail__items">
        <h2>Items</h2>
        {order.items?.length ? order.items.map((item, index) => (
          <div className="account-order-detail__item" key={`${item.variantId || "item"}-${index}`}>
            <div>
              <strong>{item.productName || item.variantName || "Order item"}</strong>
              {item.variantName && item.productName && <span>{item.variantName}</span>}
              {item.sku && <span>SKU: {item.sku}</span>}
              {!item.productName && !item.variantName && item.variantId && <span>Variant: {item.variantId}</span>}
            </div>
            <span>Qty: {item.quantity ?? 1}</span>
            <strong>{formatMoney(item.total ?? (item.price !== undefined ? Number(item.price) * Number(item.quantity ?? 1) : undefined), order.currencyCode)}</strong>
          </div>
        )) : <p className="account-order-detail__empty">Item details are not available for this order.</p>}
      </div>

      <div className="account-order-detail__total"><span>Order total</span><strong>{formatMoney(order.total, order.currencyCode)}</strong></div>
    </section>
  );
}
