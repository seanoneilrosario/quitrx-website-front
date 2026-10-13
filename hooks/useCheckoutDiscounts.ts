"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readCheckoutDiscount,
  saveCheckoutDiscount,
  subscribeCheckoutDiscount,
} from "@/lib/checkout/discount-storage";
import { parseDiscountPreview, type DiscountPreview } from "@/lib/checkout/discounts";
import type { CheckoutShippingMethod } from "@/lib/checkout/checkout";

export function useCheckoutDiscounts(
  items: Array<{ productId: string; variantId?: string; quantity: number }>,
  shippingMethod: CheckoutShippingMethod,
  customerId?: string,
  completed = false,
) {
  const savedCode = useSyncExternalStore(
    subscribeCheckoutDiscount,
    () => readCheckoutDiscount(customerId),
    () => "",
  );
  const [selection, setSelection] = useState<{ customerId?: string; code: string }>();
  const code = completed
    ? ""
    : selection && selection.customerId === customerId
      ? selection.code
      : savedCode;
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    preview?: DiscountPreview;
    error?: string;
  }>();
  const payload = JSON.stringify({
    items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    shippingMethod,
    discountCode: code || undefined,
  });
  const key = JSON.stringify([payload, customerId, revision]);
  const hasItems = items.length > 0 && !completed;

  useEffect(() => {
    if (completed) saveCheckoutDiscount(customerId, "");
  }, [completed, customerId]);

  useEffect(() => {
    if (!hasItems) return;
    const controller = new AbortController();
    let active = true;
    async function preview() {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("[Checkout discounts] Request", {
            endpoint: "/api/checkout/discounts",
            accountCustomerId: customerId,
            payload: JSON.parse(payload),
          });
        }
        const response = await fetch("/api/checkout/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });
        const body = await response.json();
        if (process.env.NODE_ENV === "development") {
          console.log("[Checkout discounts] Response", {
            request: JSON.parse(payload),
            status: response.status,
            ignored: !active,
            data: body,
          });
        }
        if (!response.ok) throw new Error(body.error || "Unable to confirm checkout totals.");
        const preview = parseDiscountPreview(body);
        if (active && process.env.NODE_ENV === "development") {
          console.groupCollapsed(
            `[Checkout discounts] Combination: ${preview.appliedDiscounts.length} applied (code: ${code || "none"})`,
          );
          console.table(preview.appliedDiscounts);
          console.log("Totals", {
            subtotal: preview.subtotal,
            discountAmount: preview.discountAmount,
            shippingBefore: preview.shippingTotal,
            shippingAfter: preview.shippingAfterDiscount,
            totalAfterDiscount: preview.totalAfterDiscount,
          });
          console.log("Line discounts", preview.lineDiscounts);
          console.groupEnd();
        }
        if (active) {
          saveCheckoutDiscount(customerId, code);
          setResult({ key, preview });
        }
      } catch (error) {
        if (active && process.env.NODE_ENV === "development") {
          console.error("[Checkout discounts] Error", {
            request: JSON.parse(payload),
            error,
          });
        }
        if (active)
          setResult({
            key,
            error: error instanceof Error ? error.message : "Unable to confirm checkout totals.",
          });
      }
    }
    void preview();
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasItems, key, payload, customerId, code]);

  const current = result?.key === key ? result : undefined;
  return {
    preview: current?.preview,
    error: current?.error,
    loading: hasItems && !current,
    code,
    apply: (value: string) => {
      const nextCode = value.trim();
      if (!nextCode) saveCheckoutDiscount(customerId, "");
      setSelection({ customerId, code: nextCode });
      setRevision((value) => value + 1);
    },
    refresh: () => setRevision((value) => value + 1),
  };
}
