"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { QuitHeroOrder } from "@/lib/quithero";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

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

const EMPTY_ORDERS: QuitHeroOrder[] = [];

export default function OrderHistoryTable({ onOrdersLoaded }: OrderHistoryTableProps) {
  const { customer } = useAccountCustomer();
  const customerKey = customer?.id ?? customer?.email;
  const { data: orders = EMPTY_ORDERS, isLoading, isError } = useQuery({
    queryKey: ["api", "/api/orders", customerKey],
    enabled: Boolean(customerKey),
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/orders", { signal });
      if (!response.ok) throw new Error("Unable to load orders.");
      return await response.json() as QuitHeroOrder[];
    },
  });

  useEffect(() => {
    if (!isLoading && !isError) onOrdersLoaded?.(orders);
  }, [isError, isLoading, onOrdersLoaded, orders]);

  return <div className="account-order-table">
    <div className="account-order-table__row account-order-table__head"><span>Order</span><span>Date</span><span>Status</span><span>Total</span><span>Details</span></div>
    {isLoading && <div className="account-order-table__empty">Loading your orders...</div>}
    {isError && <div className="account-order-table__empty">We couldn&apos;t load your orders. Please try again.</div>}
    {!isLoading && !isError && !orders.length && <div className="account-order-table__empty">You haven&apos;t placed any orders yet.</div>}
    {!isLoading && !isError && orders.map((order) => {
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
