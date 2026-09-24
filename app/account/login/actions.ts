"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { setCustomerSession } from "@/lib/customer-session";

const EMAIL_CODE_COOKIE = "quitrx_email_code";
const CODE_MAX_AGE_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

type EmailCodeChallenge = {
  email: string;
  customerId?: string;
  codeHash: string;
  expiresAt: number;
  resendAt: number;
  attempts: number;
};

export type CustomerAccessState = {
  step?: "code";
  email?: string;
  accountNotFound?: boolean;
  error?: string;
  message?: string;
};

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET or AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function codeHash(email: string, code: string) {
  return sign(`${email}:${code}`);
}

function encodeChallenge(challenge: EmailCodeChallenge) {
  const payload = Buffer.from(JSON.stringify(challenge)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeChallenge(value?: string) {
  if (!value) return;
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) return;

  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmailCodeChallenge;
  } catch {
    return;
  }
}

async function storeChallenge(challenge: EmailCodeChallenge) {
  const cookieStore = await cookies();
  cookieStore.set(EMAIL_CODE_COOKIE, encodeChallenge(challenge), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CODE_MAX_AGE_SECONDS,
    priority: "high",
  });
}

async function sendLoginCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email login is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your QuitRx sign-in code",
      text: `Your QuitRx sign-in code is ${code}. It expires in 10 minutes.`,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function requestCode(email: string): Promise<CustomerAccessState> {
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };

  const normalizedEmail = email.toLowerCase();
  const cookieStore = await cookies();
  const existingChallenge = decodeChallenge(cookieStore.get(EMAIL_CODE_COOKIE)?.value);
  if (existingChallenge?.email === normalizedEmail && existingChallenge.resendAt > Date.now()) {
    return {
      step: "code",
      email: normalizedEmail,
      error: "Please wait a minute before requesting another code.",
    };
  }
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  try {
    const customer = await findQuitHeroCustomerByEmail(normalizedEmail);
    if (!customer) {
      return { accountNotFound: true };
    }

    await sendLoginCode(normalizedEmail, code);
    await storeChallenge({
      email: normalizedEmail,
      customerId: customer?.id,
      codeHash: codeHash(normalizedEmail, code),
      expiresAt: Date.now() + CODE_MAX_AGE_SECONDS * 1000,
      resendAt: Date.now() + 60_000,
      attempts: 0,
    });
    return { step: "code", email: normalizedEmail, message: `We sent a confirmation code to ${normalizedEmail}.` };
  } catch (error) {
    console.error("Email sign-in code delivery failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { error: "We could not send your email code. Please try again." };
  }
}

export async function accessCustomerAccount(
  state: CustomerAccessState,
  formData: FormData,
): Promise<CustomerAccessState> {
  if (process.env.EMAIL_LOGIN_ENABLED === "false") {
    return { error: "Email sign-in is temporarily unavailable." };
  }

  const intent = formData.get("intent");
  const redirectValue = formData.get("redirectTo");
  const redirectTo = typeof redirectValue === "string" && redirectValue.startsWith("/") && !redirectValue.startsWith("//")
    ? redirectValue
    : "/account";
  const cookieStore = await cookies();

  if (intent === "reset") {
    cookieStore.delete(EMAIL_CODE_COOKIE);
    return {};
  }

  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  if (intent !== "verify") return requestCode(email);

  const codeValue = formData.get("code");
  const code = typeof codeValue === "string" ? codeValue.trim() : "";
  const challenge = decodeChallenge(cookieStore.get(EMAIL_CODE_COOKIE)?.value);
  const codeStep = { step: "code" as const, email: challenge?.email ?? state.email };

  if (!/^\d{6}$/.test(code)) return { ...codeStep, error: "Enter the six-digit code." };
  if (!challenge || challenge.expiresAt <= Date.now()) {
    cookieStore.delete(EMAIL_CODE_COOKIE);
    return { error: "That code has expired. Enter your email to request a new one." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    cookieStore.delete(EMAIL_CODE_COOKIE);
    return { error: "Too many incorrect attempts. Request a new code." };
  }

  const expected = Buffer.from(challenge.codeHash);
  const supplied = Buffer.from(codeHash(challenge.email, code));
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    await storeChallenge({ ...challenge, attempts: challenge.attempts + 1 });
    return { ...codeStep, error: "That code is incorrect. Please try again." };
  }

  try {
    await setCustomerSession({ id: challenge.customerId, email: challenge.email });
    cookieStore.delete(EMAIL_CODE_COOKIE);
  } catch (error) {
    console.error("Customer session creation failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { ...codeStep, error: "We could not connect to your account. Please try again." };
  }

  redirect(redirectTo);
}
