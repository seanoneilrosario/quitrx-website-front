import "server-only";
import { quitHeroPost } from "./client";
import { parseDiscountPreview } from "@/lib/checkout/discounts";

export type DiscountPreviewPayload = {
  customerId: string;
  discountCode?: string;
  subtotal: number;
  quantity: number;
  shippingTotal: number;
  items: Array<{ variantId: string; quantity: number }>;
};

export async function previewQuitHeroDiscounts(payload: DiscountPreviewPayload) {
  return parseDiscountPreview(await quitHeroPost<unknown>("/discounts/preview", payload));
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
