import type { QuitHeroCustomer } from "./quithero-customers";

export function normalizeAustralianMobile(phone: string) {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  const international = compact.startsWith("+") ? compact
    : compact.startsWith("00") ? `+${compact.slice(2)}`
    : compact.startsWith("0") ? `+61${compact.slice(1)}`
    : compact.startsWith("61") ? `+${compact}`
    : compact.startsWith("4") ? `+61${compact}`
    : `+${compact}`;

  const normalizedInternational = international.startsWith("+6104")
    ? `+61${international.slice(4)}`
    : international;

  return /^\+614\d{8}$/.test(normalizedInternational) ? normalizedInternational : undefined;
}

export function customerHasMobile(customer: QuitHeroCustomer | undefined, mobile: string) {
  if (!customer) return false;

  const phones = [
    customer.phone,
    customer.address?.phone,
    ...(customer.addresses ?? []).map((address) => address.phone),
  ];

  return phones.some((phone) => phone && normalizeAustralianMobile(phone) === mobile);
}
