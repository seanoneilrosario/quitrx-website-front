export type AppliedDiscount = {
  name: string;
  code?: string | null;
  scope: string;
  discountAmount: number;
};

export type DiscountPreview = {
  subtotal: number;
  discountAmount: number;
  shippingTotal: number;
  shippingAfterDiscount: number;
  totalAfterDiscount: number;
  appliedDiscounts: AppliedDiscount[];
  lineDiscounts: Array<{ itemIndex: number; variantId: string; discountAmount: number }>;
};

/** Validate money at the API boundary; never substitute browser-calculated totals. */
export function parseDiscountPreview(value: unknown): DiscountPreview {
  if (!value || typeof value !== "object") throw new Error("Invalid discount preview.");
  const preview = value as DiscountPreview;
  for (const key of [
    "subtotal",
    "discountAmount",
    "shippingTotal",
    "shippingAfterDiscount",
    "totalAfterDiscount",
  ] as const) {
    if (typeof preview[key] !== "number" || !Number.isFinite(preview[key]) || preview[key] < 0)
      throw new Error("Invalid discount preview totals.");
  }
  if (
    !Array.isArray(preview.appliedDiscounts) ||
    !Array.isArray(preview.lineDiscounts) ||
    preview.appliedDiscounts.some(
      (item) =>
        !item ||
        typeof item.name !== "string" ||
        typeof item.scope !== "string" ||
        !Number.isFinite(item.discountAmount) ||
        item.discountAmount < 0,
    ) ||
    preview.lineDiscounts.some(
      (item) =>
        !item ||
        !Number.isInteger(item.itemIndex) ||
        item.itemIndex < 0 ||
        typeof item.variantId !== "string" ||
        !Number.isFinite(item.discountAmount) ||
        item.discountAmount < 0,
    )
  )
    throw new Error("Invalid discount preview details.");
  return preview;
}
