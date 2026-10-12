const DISCOUNT_KEY = "quitrx-checkout-discount:";
const DISCOUNT_EVENT = "quitrx:discount-updated";

export function readCheckoutDiscount(customerId?: string): string {
  if (!customerId) return "";
  try {
    return window.sessionStorage.getItem(`${DISCOUNT_KEY}${customerId}`) ?? "";
  } catch {
    return "";
  }
}

/** Persist only a validated code, never a preview or its totals. */
export function saveCheckoutDiscount(customerId: string | undefined, code: string) {
  if (!customerId) return;
  try {
    const key = `${DISCOUNT_KEY}${customerId}`;
    if (code) window.sessionStorage.setItem(key, code);
    else window.sessionStorage.removeItem(key);
    window.dispatchEvent(new Event(DISCOUNT_EVENT));
  } catch {
    // Checkout still works when browser storage is unavailable.
  }
}

export function subscribeCheckoutDiscount(onChange: () => void) {
  window.addEventListener(DISCOUNT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DISCOUNT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
