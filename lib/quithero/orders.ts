import "server-only";

import { API_BASE, quitHeroFetch } from "./client";

export type QuitHeroOrderPayload = {
  source: "NATIVE";
  currencyCode: "AUD";
  subtotal: number;
  total: number;
  customerId: string;
  items: Array<{ variantId: string; quantity: number }>;
};

export type QuitHeroOrder = {
  id?: string;
  customerId?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  currencyCode?: string;
  total?: number | string;
  createdAt?: string;
  items?: Array<{
    variantId?: string;
    quantity?: number;
    productName?: string;
    variantName?: string;
    sku?: string;
    price?: number | string;
    total?: number | string;
  }>;
};

type QuitHeroOrdersResponse = {
  data?: QuitHeroOrder[];
  orders?: QuitHeroOrder[];
  items?: QuitHeroOrder[];
};

export async function getQuitHeroOrdersForCustomer(customerId: string) {
  const response = await quitHeroFetch<QuitHeroOrdersResponse>(
    `/orders?customerId=${encodeURIComponent(customerId)}&page=1&limit=50`,
  );
  return response.data ?? response.orders ?? response.items ?? [];
}

export async function createQuitHeroOrder(payload: QuitHeroOrderPayload) {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  const response = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await response.text();
  let parsed: unknown;
  try {
    parsed = body ? JSON.parse(body) : undefined;
  } catch {
    parsed = undefined;
  }
  if (!response.ok) throw new Error(`QuitHero order creation failed with ${response.status}.`);
  return parsed;
}

export async function findRecentlyCreatedQuitHeroOrder(
  payload: QuitHeroOrderPayload,
  createdAfter: number,
) {
  const response = await quitHeroFetch<QuitHeroOrdersResponse>("/orders?page=1&limit=25");
  const orders = response.data ?? response.orders ?? response.items ?? [];
  const requestedItems = new Map(payload.items.map((item) => [item.variantId, item.quantity]));

  return orders.find((order) => {
    const createdAt = Date.parse(order.createdAt ?? "");
    if (
      order.customerId !== payload.customerId ||
      !Number.isFinite(createdAt) ||
      createdAt < createdAfter
    )
      return false;
    if (
      Math.abs(Number(order.total) - payload.total) > 0.001 ||
      order.items?.length !== payload.items.length
    )
      return false;
    return order.items.every(
      (item) => item.variantId && requestedItems.get(item.variantId) === Number(item.quantity),
    );
  });
}
