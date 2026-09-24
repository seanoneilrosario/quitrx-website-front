import type { QuitHeroCustomer } from "@/lib/quithero-customers";

export const CUSTOMER_DATA_KEY = "customerData";
const CUSTOMER_DATA_STALE_KEY = "customerDataStale";

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readCustomerData(): QuitHeroCustomer | undefined {
  if (!storageAvailable() || sessionStorage.getItem(CUSTOMER_DATA_STALE_KEY)) return;

  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(CUSTOMER_DATA_KEY) ?? "null");
    if (!value || typeof value !== "object") return;
    const customer = value as QuitHeroCustomer;
    return customer.id || customer.email ? customer : undefined;
  } catch {
    sessionStorage.removeItem(CUSTOMER_DATA_KEY);
    return;
  }
}

export function saveCustomerData(customer: QuitHeroCustomer) {
  if (!storageAvailable()) return;
  sessionStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customer));
  sessionStorage.removeItem(CUSTOMER_DATA_STALE_KEY);
}

export function markCustomerDataStale() {
  if (storageAvailable()) sessionStorage.setItem(CUSTOMER_DATA_STALE_KEY, "true");
}

export function customerDataNeedsRefresh() {
  return storageAvailable() && sessionStorage.getItem(CUSTOMER_DATA_STALE_KEY) === "true";
}

export function clearCustomerData() {
  if (!storageAvailable()) return;
  sessionStorage.removeItem(CUSTOMER_DATA_KEY);
  sessionStorage.removeItem(CUSTOMER_DATA_STALE_KEY);
}
