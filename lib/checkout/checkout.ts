import type { QuitHeroCustomer } from "@/lib/quithero/customers";

export const CHECKOUT_SHIPPING = {
  standard: 12.9,
  express: 15.9,
} as const;

export type CheckoutShippingMethod = keyof typeof CHECKOUT_SHIPPING;

export function isCheckoutShippingMethod(value: unknown): value is CheckoutShippingMethod {
  return value === "standard" || value === "express";
}

const AUSTRALIAN_STATE_CODES: Record<string, string> = {
  "australian capital territory": "ACT",
  "new south wales": "NSW",
  "northern territory": "NT",
  queensland: "QLD",
  "south australia": "SA",
  tasmania: "TAS",
  victoria: "VIC",
  "western australia": "WA",
};

export function getCheckoutCustomerDefaults(customer?: QuitHeroCustomer) {
  const savedAddresses = customer?.addresses ?? [];
  const address =
    savedAddresses.find((entry) => entry.isDefault) ?? customer?.address ?? savedAddresses[0];
  const state = (address?.state ?? address?.province ?? "").trim();

  return {
    email: customer?.email?.trim() ?? "",
    firstName: address?.firstName?.trim() || customer?.firstName?.trim() || "",
    lastName: address?.lastName?.trim() || customer?.lastName?.trim() || "",
    address: (address?.address1 ?? address?.line1 ?? "").trim(),
    address2: (address?.address2 ?? address?.line2 ?? "").trim(),
    city: address?.city?.trim() ?? "",
    state: AUSTRALIAN_STATE_CODES[state.toLowerCase()] ?? state.toUpperCase(),
    postcode: (address?.postcode ?? address?.zip ?? "").trim(),
    phone: address?.phone?.trim() || customer?.phone?.trim() || "",
  };
}
