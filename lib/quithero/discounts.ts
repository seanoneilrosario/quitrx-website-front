import "server-only";
import { quitHeroPost } from "./client";
import {
  deriveBuyXGetYPromotionalItems,
  parseDiscountPreview,
} from "@/lib/checkout/discounts";

export type DiscountPreviewPayload = {
  customerId: string;
  discountCode?: string;
  subtotal: number;
  quantity: number;
  shippingTotal: number;
  items: Array<{ variantId: string; quantity: number }>;
};

export async function previewQuitHeroDiscounts(payload: DiscountPreviewPayload) {
  if (process.env.NODE_ENV === "development") {
    console.log("[QuitHero discounts] Preview request", payload);
  }
  const preview = parseDiscountPreview(
    await quitHeroPost<unknown>("/discounts/preview", payload),
  );
  if (process.env.NODE_ENV === "development") {
    console.log("[QuitHero discounts] Preview result", {
      customerId: payload.customerId,
      requestedCode: payload.discountCode ?? null,
      appliedCount: preview.appliedDiscounts.length,
      ...preview,
    });
  }
  return deriveBuyXGetYPromotionalItems(preview, payload.items.length);
}

export function readDiscountCode(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > 200) throw new QuitHeroDiscountInputError();
  return value.trim() || undefined;
}

export class QuitHeroDiscountInputError extends Error {
  constructor() {
    super("Please enter a valid discount code (up to 200 characters).");
  }
}
