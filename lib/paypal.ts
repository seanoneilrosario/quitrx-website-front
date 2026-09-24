import "server-only";

const SANDBOX_API_URL = "https://api-m.sandbox.paypal.com";
const PRODUCTION_API_URL = "https://api-m.paypal.com";

type PayPalLink = { href: string; rel: string; method?: string };
type PayPalError = { message?: string; details?: Array<{ description?: string }> };

export class PayPalApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PayPalApiError";
  }
}

export type PayPalOrder = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
  }>;
};

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("PayPal payment credentials are not configured.");
  const configuredUrl = process.env.PAYPAL_API_BASE_URL?.trim().replace(/\/$/, "");
  const isProduction = process.env.PAYPAL_ENVIRONMENT === "production" ||
    (!process.env.PAYPAL_ENVIRONMENT && process.env.VERCEL_ENV === "production");
  return {
    apiUrl: configuredUrl || (isProduction ? PRODUCTION_API_URL : SANDBOX_API_URL),
    authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
  };
}

async function getAccessToken() {
  const { apiUrl, authorization } = getPayPalConfig();
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({})) as { access_token?: string } & PayPalError;
  if (!response.ok || !body.access_token) throw new PayPalApiError(body.message || "PayPal authentication failed.", response.status);
  return { apiUrl, accessToken: body.access_token };
}

async function paypalFetch(path: string, body: unknown, requestId: string) {
  const { apiUrl, accessToken } = await getAccessToken();
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as PayPalOrder & PayPalError;
  if (!response.ok) {
    const detail = result.details?.[0]?.description;
    throw new PayPalApiError(detail || result.message || "PayPal rejected the payment request.", response.status);
  }
  return result;
}

export function createPayPalOrder(payload: unknown, requestId: string) {
  return paypalFetch("/v2/checkout/orders", payload, requestId);
}

export function capturePayPalOrder(orderId: string) {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, `${orderId}-capture`);
}
