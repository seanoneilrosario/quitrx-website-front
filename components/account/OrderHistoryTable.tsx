"use client";

import { useEffect, useState } from "react";
import type { QuitHeroOrder } from "@/lib/quithero";

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatMoney(value?: number | string, currency = "AUD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Not available";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
}

function readableStatus(order: QuitHeroOrder) {
  return (order.fulfillmentStatus || order.status || "Pending")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function isCancelled(order: QuitHeroOrder) {
  return [order.fulfillmentStatus, order.status].some((status) =>
    /^cancell?ed$/.test(status?.trim().toLowerCase() || ""),
  );
}

export default function OrderHistoryTable() {
  const [orders, setOrders] = useState<QuitHeroOrder[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/orders", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load orders.");
        setOrders(await response.json() as QuitHeroOrder[]);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState("error");
      });
    return () => controller.abort();
  }, []);

  return <div className="account-order-table">
    <div className="account-order-table__row account-order-table__head"><span>Order</span><span>Date</span><span>Status</span><span>Total</span></div>
    {state === "loading" && <div className="account-order-table__empty">Loading your orders...</div>}
    {state === "error" && <div className="account-order-table__empty">We couldn&apos;t load your orders. Please try again.</div>}
    {state === "ready" && !orders.length && <div className="account-order-table__empty">You haven&apos;t placed any orders yet.</div>}
    {state === "ready" && orders.map((order) => <div className="account-order-table__row" key={order.id || order.orderNumber}>
      <strong>{order.orderNumber || "Order"}</strong>
      <span>{formatDate(order.createdAt)}</span>
      <span className={`account-order-status${isCancelled(order) ? " account-order-status--cancelled" : ""}`}><i />{readableStatus(order)}</span>
      <strong>{formatMoney(order.total, order.currencyCode)}</strong>
    </div>)}
  </div>;
}
