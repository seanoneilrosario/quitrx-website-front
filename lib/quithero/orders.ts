import "server-only";

import { orderDiscountFingerprint } from "./discount-verification";
import { QuitHeroApiError, quitHeroPost, quitHeroFetch } from "./client";

export function orderConfirmationError(error: unknown) {
  const detail =
    error instanceof QuitHeroApiError && error.status === 400 ? `${error.message} ` : "";
  return `${detail}We could not confirm your order. If payment was taken, do not submit another payment. Contact support or retry confirmation from your payment return page.`;
}

export type QuitHeroOrderPayload = {
  source: "NATIVE";
  currencyCode: "AUD";
  subtotal: number;
  shippingTotal?: number;
  discountCode?: string;
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
  subtotal?: number | string;
  discountTotal?: number | string;
  shippingTotal?: number | string;
  discountApplications?: Array<{
    discountName?: string;
    discountCode?: string | null;
    scope?: string;
    amount?: number | string;
    details?: unknown;
  }>;
  total?: number | string;
  createdAt?: string;
  items?: Array<{
    variantId?: string;
    quantity?: number;
    productName?: string;
    variantName?: string;
    sku?: string;
    discountTotal?: number | string;
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

export async function getQuitHeroOrderById(id: string) {
  return quitHeroFetch<QuitHeroOrder>(`/orders/${encodeURIComponent(id)}`);
}

export async function createQuitHeroOrder(payload: QuitHeroOrderPayload) {
  return quitHeroPost<QuitHeroOrder>("/orders", payload);
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

/** A paid order must not be reported as confirmed when backend repricing differs. */
export function verifyOrderDiscountTotals(
  order: QuitHeroOrder | undefined,
  pending: {
    total: number;
    subtotal?: number;
    shippingTotal?: number;
    discountTotal?: number;
    discountFingerprint?: string;
  },
) {
  if (
    !order?.id ||
    !Number.isFinite(Number(order.total)) ||
    Math.round(Number(order.total) * 100) !== Math.round(pending.total * 100)
  )
    throw new Error(
      "The saved order total does not match the payment. Please contact support before retrying payment.",
    );
  if (
    pending.discountTotal !== undefined &&
    (!Number.isFinite(Number(order.discountTotal)) ||
      Math.round(Number(order.discountTotal) * 100) !== Math.round(pending.discountTotal * 100) ||
      (pending.discountTotal > 0 && !order.discountApplications?.length) ||
      (pending.shippingTotal !== undefined &&
        Math.round(Number(order.shippingTotal) * 100) !==
          Math.round(pending.shippingTotal * 100)) ||
      (pending.subtotal !== undefined &&
        Math.round(Number(order.subtotal) * 100) !== Math.round(pending.subtotal * 100)) ||
      (pending.discountFingerprint !== undefined &&
        orderDiscountFingerprint(order) !== pending.discountFingerprint) ||
      order.discountApplications?.some(
        (entry) => !entry.details || typeof entry.details !== "object",
      ))
  )
    throw new Error(
      "The saved order discounts could not be verified. Please contact support before retrying payment.",
    );
}
