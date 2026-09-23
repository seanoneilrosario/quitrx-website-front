"use client";

import { useEffect, useState } from "react";
import type { QuitHeroOrder } from "@/lib/quithero";

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
  const [order, setOrder] = useState<QuitHeroOrder>();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as QuitHeroOrder & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Unable to load this order.");
        setOrder(payload);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load this order.");
      });
    return () => controller.abort();
  }, [orderId]);

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
