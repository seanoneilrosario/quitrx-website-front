export const CHECKOUT_SHIPPING = {
  standard: 12.9,
  express: 15.9,
} as const;

export type CheckoutShippingMethod = keyof typeof CHECKOUT_SHIPPING;

export function isCheckoutShippingMethod(value: unknown): value is CheckoutShippingMethod {
  return value === "standard" || value === "express";
}
