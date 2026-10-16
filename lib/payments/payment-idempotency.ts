const PAYMENT_LOCK_TTL_MS = 10 * 60 * 1000;

const globalPaymentLocks = globalThis as typeof globalThis & {
  __quitRxPaymentLocks?: Map<string, number>;
};

const paymentLocks = (globalPaymentLocks.__quitRxPaymentLocks ??= new Map());

export function acquirePaymentLock(key: string) {
  const now = Date.now();
  const expiresAt = paymentLocks.get(key);

  if (expiresAt && expiresAt > now) return;
  if (expiresAt) paymentLocks.delete(key);

  paymentLocks.set(key, now + PAYMENT_LOCK_TTL_MS);
  let released = false;

  return () => {
    if (released) return;
    released = true;
    paymentLocks.delete(key);
  };
}

export function clearPaymentLocksForTesting() {
  paymentLocks.clear();
}
