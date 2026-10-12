export type AppliedDiscount = {
  id?: string;
  name: string;
  code?: string | null;
  method?: string;
  scope: string;
  discountAmount: number;
};

export type PromotionalItem = {
  discountId: string;
  role: "GET_Y";
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  benefitType: "FREE" | "PERCENTAGE" | "FIXED_AMOUNT";
  isPromotional: true;
  productName?: string;
  variantName?: string;
  image?: string;
  availableStock?: number;
};

export type DiscountPreview = {
  subtotal: number;
  discountAmount: number;
  shippingTotal: number;
  shippingAfterDiscount: number;
  totalAfterDiscount: number;
  appliedDiscounts: AppliedDiscount[];
  lineDiscounts: Array<{
    itemIndex: number;
    variantId: string;
    productId?: string;
    quantity?: number;
    lineSubtotal?: number;
    discountAmount: number;
    lineTotal?: number;
    isGift?: boolean;
  }>;
  promotionalItems: PromotionalItem[];
};

/** Validate money at the API boundary; never substitute browser-calculated totals. */
export function parseDiscountPreview(value: unknown): DiscountPreview {
  if (!value || typeof value !== "object") throw new Error("Invalid discount preview.");
  const preview = value as Omit<DiscountPreview, "promotionalItems"> & {
    promotionalItems?: PromotionalItem[];
  };
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
        item.discountAmount < 0 ||
        (item.productId !== undefined && typeof item.productId !== "string") ||
        (item.quantity !== undefined && (!Number.isInteger(item.quantity) || item.quantity < 1)) ||
        (item.lineSubtotal !== undefined &&
          (!Number.isFinite(item.lineSubtotal) || item.lineSubtotal < 0)) ||
        (item.lineTotal !== undefined && (!Number.isFinite(item.lineTotal) || item.lineTotal < 0)) ||
        (item.isGift !== undefined && typeof item.isGift !== "boolean"),
    ) ||
    (preview.promotionalItems !== undefined &&
      (!Array.isArray(preview.promotionalItems) ||
        preview.promotionalItems.some(
          (item) =>
            !item ||
            typeof item.discountId !== "string" ||
            !item.discountId ||
            item.role !== "GET_Y" ||
            typeof item.productId !== "string" ||
            !item.productId ||
            typeof item.variantId !== "string" ||
            !item.variantId ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            !Number.isFinite(item.unitPrice) ||
            item.unitPrice < 0 ||
            !Number.isFinite(item.discountAmount) ||
            item.discountAmount < 0 ||
            !Number.isFinite(item.lineTotal) ||
            item.lineTotal < 0 ||
            !["FREE", "PERCENTAGE", "FIXED_AMOUNT"].includes(item.benefitType) ||
            item.isPromotional !== true,
        )))
  )
    throw new Error("Invalid discount preview details.");
  return { ...preview, promotionalItems: preview.promotionalItems ?? [] };
}

/** Convert BUY_X_GET_Y gift rows into checkout promotional items. */
export function deriveBuyXGetYPromotionalItems(
  preview: DiscountPreview,
  customerItemCount: number,
): DiscountPreview {
  if (preview.promotionalItems.length) return preview;
  const discount = preview.appliedDiscounts.find(
    (item) => item.method === "BUY_X_GET_Y" && item.id,
  );
  if (!discount?.id) return preview;
  const discountId = discount.id;

  const promotionalItems = preview.lineDiscounts.flatMap((line) => {
    if (
      (line.isGift !== true && line.itemIndex < customerItemCount) ||
      !line.productId ||
      !line.quantity ||
      line.lineSubtotal === undefined ||
      line.lineTotal === undefined
    )
      return [];
    return [{
      discountId,
      role: "GET_Y" as const,
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      unitPrice: line.lineSubtotal / line.quantity,
      discountAmount: line.discountAmount,
      lineTotal: line.lineTotal,
      benefitType: (line.lineTotal === 0 ? "FREE" : "FIXED_AMOUNT") as
        | "FREE"
        | "FIXED_AMOUNT",
      isPromotional: true as const,
    }];
  });
  return promotionalItems.length ? { ...preview, promotionalItems } : preview;
}
