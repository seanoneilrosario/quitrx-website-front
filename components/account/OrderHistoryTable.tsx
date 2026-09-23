"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

interface OrderHistoryTableProps {
  onOrdersLoaded?: (orders: QuitHeroOrder[]) => void;
}

export default function OrderHistoryTable({ onOrdersLoaded }: OrderHistoryTableProps) {
  const [orders, setOrders] = useState<QuitHeroOrder[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/orders", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load orders.");
        const loadedOrders = await response.json() as QuitHeroOrder[];
        setOrders(loadedOrders);
        onOrdersLoaded?.(loadedOrders);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState("error");
      });
    return () => controller.abort();
  }, [onOrdersLoaded]);

  return <div className="account-order-table">
    <div className="account-order-table__row account-order-table__head"><span>Order</span><span>Date</span><span>Status</span><span>Total</span><span>Details</span></div>
    {state === "loading" && <div className="account-order-table__empty">Loading your orders...</div>}
    {state === "error" && <div className="account-order-table__empty">We couldn&apos;t load your orders. Please try again.</div>}
    {state === "ready" && !orders.length && <div className="account-order-table__empty">You haven&apos;t placed any orders yet.</div>}
    {state === "ready" && orders.map((order) => {
      const orderIdentifier = order.id || order.orderNumber;
      const orderHref = orderIdentifier ? `/account/orders/${encodeURIComponent(orderIdentifier)}` : undefined;
      return <div className="account-order-table__row" key={orderIdentifier}>
        <strong>
          {orderHref ? <Link className="account-order-link" href={orderHref}>{order.orderNumber || "View order"}</Link> : "Order"}
        </strong>
        <span>{formatDate(order.createdAt)}</span>
        <span className={`account-order-status${isCancelled(order) ? " account-order-status--cancelled" : ""}`}><i />{readableStatus(order)}</span>
        <strong>{formatMoney(order.total, order.currencyCode)}</strong>
        {orderHref ? <Link className="account-order-details-button" href={orderHref}>View details</Link> : <span>—</span>}
      </div>;
    })}
  </div>;
}
