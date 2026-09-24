import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const PAYPAL_PAYMENT_COOKIE = "quitrx_paypal_payment";
const PAYMENT_MAX_AGE = 60 * 60;

export type PendingPayPalPayment = {
  orderId: string;
  customerId: string;
  items: Array<{ variantId: string; quantity: number }>;
  subtotal: number;
  total: number;
  createdAt: number;
};

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined);
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET or AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function encodePayment(payment: PendingPayPalPayment) {
  const payload = Buffer.from(JSON.stringify(payment)).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  if (value.length > 3_800) throw new Error("The cart is too large to start payment.");
  return value;
}

function decodePayment(value?: string) {
  if (!value) return undefined;
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return undefined;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return undefined;
  try {
    const payment = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingPayPalPayment;
    if (!payment.orderId || !payment.customerId || !Array.isArray(payment.items) ||
      !Number.isFinite(payment.total) || payment.createdAt + PAYMENT_MAX_AGE * 1_000 < Date.now()) return undefined;
    return payment;
  } catch {
    return undefined;
  }
}

export async function setPendingPayPalPayment(payment: PendingPayPalPayment) {
  const cookieStore = await cookies();
  cookieStore.set(PAYPAL_PAYMENT_COOKIE, encodePayment(payment), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PAYMENT_MAX_AGE,
    priority: "high",
  });
}

export async function getPendingPayPalPayment() {
  const cookieStore = await cookies();
  return decodePayment(cookieStore.get(PAYPAL_PAYMENT_COOKIE)?.value);
}

export async function clearPendingPayPalPayment() {
  const cookieStore = await cookies();
  cookieStore.delete(PAYPAL_PAYMENT_COOKIE);
}
