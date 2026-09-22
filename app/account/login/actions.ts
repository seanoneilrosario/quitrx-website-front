"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { setCustomerSession } from "@/lib/customer-session";

const SMS_CODE_COOKIE = "quitrx_sms_code";
const CODE_MAX_AGE_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

type SmsCodeChallenge = {
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
  phone?: string;
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

function encodeChallenge(challenge: SmsCodeChallenge) {
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
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SmsCodeChallenge;
  } catch {
    return;
  }
}

async function storeChallenge(challenge: SmsCodeChallenge) {
  const cookieStore = await cookies();
  cookieStore.set(SMS_CODE_COOKIE, encodeChallenge(challenge), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CODE_MAX_AGE_SECONDS,
    priority: "high",
  });
}

function normalizeSmsDestination(phone: string) {
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

function isAllowedTestDestination(destination: string) {
  return process.env.SMS_LOGIN_ALLOW_TEST_NUMBER === "true"
    && normalizeSmsDestination(process.env.SMS_LOGIN_TEST_PHONE ?? "") === destination;
}

async function sendLoginCode(phone: string, code: string) {
  const apiKey = process.env.SINCH_ENGAGE_API_KEY;
  const apiSecret = process.env.SINCH_ENGAGE_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("SMS login is not configured.");

  const response = await fetch("https://api.messagemedia.com/v1/messages", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      "content-type": "application/json",
      "user-agent": "QuitRx/1.0",
    },
    body: JSON.stringify({
      messages: [{
        content: `Your QuitRx sign-in code is ${code}. It expires in 10 minutes.`,
        destination_number: phone,
        format: "SMS",
      }],
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`SMS provider returned ${response.status}.`);
}

async function requestCode(email: string, phone: string): Promise<CustomerAccessState> {
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };

  const normalizedEmail = email.toLowerCase();
  const destination = normalizeSmsDestination(phone);
  if (!destination) return { error: "Enter a valid Australian mobile number, such as 0412 345 678." };

  const cookieStore = await cookies();
  const existingChallenge = decodeChallenge(cookieStore.get(SMS_CODE_COOKIE)?.value);
  if (existingChallenge?.email === normalizedEmail && existingChallenge.resendAt > Date.now()) {
    return {
      step: "code",
      email: normalizedEmail,
      phone: destination,
      error: "Please wait a minute before requesting another code.",
    };
  }
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  try {
    const customer = await findQuitHeroCustomerByEmail(normalizedEmail);
    const accountPhone = customer?.phone ? normalizeSmsDestination(customer.phone) : undefined;
    const usingTestDestination = isAllowedTestDestination(destination);
    if (!usingTestDestination && (!customer || accountPhone !== destination)) {
      return { error: "No account found with these details. Check your email and mobile number, or contact us for help getting started." };
    }

    await sendLoginCode(destination, code);
    await storeChallenge({
      email: normalizedEmail,
      customerId: customer?.id,
      codeHash: codeHash(normalizedEmail, code),
      expiresAt: Date.now() + CODE_MAX_AGE_SECONDS * 1000,
      resendAt: Date.now() + 60_000,
      attempts: 0,
    });
    return { step: "code", email: normalizedEmail, phone: destination, message: "We sent a confirmation code to your mobile number." };
  } catch (error) {
    console.error("SMS sign-in code delivery failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { error: "We could not send your SMS code. Please try again." };
  }
}

export async function accessCustomerAccount(
  state: CustomerAccessState,
  formData: FormData,
): Promise<CustomerAccessState> {
  if (process.env.SMS_LOGIN_ENABLED === "false") {
    return { error: "SMS sign-in is temporarily unavailable." };
  }

  const intent = formData.get("intent");
  const redirectValue = formData.get("redirectTo");
  const redirectTo = typeof redirectValue === "string" && redirectValue.startsWith("/") && !redirectValue.startsWith("//")
    ? redirectValue
    : "/account";
  const cookieStore = await cookies();

  if (intent === "reset") {
    cookieStore.delete(SMS_CODE_COOKIE);
    return {};
  }

  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const phoneValue = formData.get("phone");
  const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
  if (intent !== "verify") return requestCode(email, phone);

  const codeValue = formData.get("code");
  const code = typeof codeValue === "string" ? codeValue.trim() : "";
  const challenge = decodeChallenge(cookieStore.get(SMS_CODE_COOKIE)?.value);
  const codeStep = { step: "code" as const, email: challenge?.email ?? state.email, phone: state.phone };

  if (!/^\d{6}$/.test(code)) return { ...codeStep, error: "Enter the six-digit code." };
  if (!challenge || challenge.expiresAt <= Date.now()) {
    cookieStore.delete(SMS_CODE_COOKIE);
    return { error: "That code has expired. Enter your email to request a new one." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    cookieStore.delete(SMS_CODE_COOKIE);
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
    cookieStore.delete(SMS_CODE_COOKIE);
  } catch (error) {
    console.error("Customer session creation failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { ...codeStep, error: "We could not connect to your account. Please try again." };
  }

  redirect(redirectTo);
}
