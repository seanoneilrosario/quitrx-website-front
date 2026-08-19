import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const CUSTOMER_SESSION_COOKIE = "quitrx_customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type CustomerSession = {
  customerId?: string;
  email: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.QUITHERO_API_KEY : undefined);
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSignedCustomerSession(customer: { id?: string; email: string }) {
  const session: CustomerSession = {
    customerId: customer.id,
    email: customer.email.trim().toLowerCase(),
    expiresAt: Date.now() + CUSTOMER_SESSION_MAX_AGE * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySignedCustomerSession(value?: string): CustomerSession | undefined {
  if (!value) return undefined;

  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return undefined;

  const expectedSignature = sign(payload);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return undefined;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CustomerSession;
    if (!session.email || !session.expiresAt || session.expiresAt <= Date.now()) return undefined;
    return session;
  } catch {
    return undefined;
  }
}

export async function setCustomerSession(customer: { id?: string; email: string }) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, createSignedCustomerSession(customer), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
    priority: "high",
  });
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  return verifySignedCustomerSession(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}
