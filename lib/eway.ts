import "server-only";

const SANDBOX_API_URL = "https://api.sandbox.ewaypayments.com";
const PRODUCTION_API_URL = "https://api.ewaypayments.com";

type EwayErrorResponse = { Errors?: string | null };

export type EwaySharedPaymentRequest = {
  Customer: EwayAddress & { Email: string };
  ShippingAddress: EwayAddress;
  Payment: { TotalAmount: number; InvoiceDescription: string; InvoiceReference: string; CurrencyCode: "AUD" };
  Items: EwayLineItem[];
  RedirectUrl: string;
  CancelUrl: string;
  Method: "ProcessPayment";
  TransactionType: "Purchase";
};

type EwayAddress = {
  FirstName: string;
  LastName: string;
  Street1: string;
  Street2?: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: "au";
  Phone: string;
};

type EwayLineItem = {
  SKU: string;
  Description: string;
  Quantity: number;
  UnitCost: number;
  Total: number;
};

export type EwaySharedPaymentResponse = EwayErrorResponse & { AccessCode?: string; SharedPaymentUrl?: string };
export type EwayPaymentResult = EwayErrorResponse & {
  AccessCode?: string;
  ResponseCode?: string;
  ResponseMessage?: string;
  TotalAmount?: number;
  TransactionID?: number;
  TransactionStatus?: boolean;
};

function getEwayConfig() {
  const apiKey = process.env.EWAY_API_KEY?.trim();
  const password = process.env.EWAY_PASSWORD?.trim();
  if (!apiKey || !password) throw new Error("eWAY payment credentials are not configured.");

  const configuredUrl = process.env.EWAY_API_BASE_URL?.trim().replace(/\/$/, "");
  const isProduction = process.env.EWAY_ENVIRONMENT === "production" ||
    (!process.env.EWAY_ENVIRONMENT && process.env.VERCEL_ENV === "production");
  return {
    apiUrl: configuredUrl || (isProduction ? PRODUCTION_API_URL : SANDBOX_API_URL),
    authorization: `Basic ${Buffer.from(`${apiKey}:${password}`).toString("base64")}`,
  };
}

async function ewayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, authorization } = getEwayConfig();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-EWAY-APIVERSION": "47",
      Authorization: authorization,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  let body: T & EwayErrorResponse;
  try {
    body = (text ? JSON.parse(text) : {}) as T & EwayErrorResponse;
  } catch {
    throw new Error(`eWAY returned an invalid response (${response.status}).`);
  }
  if (!response.ok || body.Errors) {
    throw new Error(`eWAY rejected the payment request${body.Errors ? ` (${body.Errors})` : ""}.`);
  }
  return body;
}

export function createEwaySharedPayment(payload: EwaySharedPaymentRequest) {
  return ewayFetch<EwaySharedPaymentResponse>("/AccessCodesShared", { method: "POST", body: JSON.stringify(payload) });
}

export function getEwayPaymentResult(accessCode: string) {
  return ewayFetch<EwayPaymentResult>(`/AccessCode/${encodeURIComponent(accessCode)}`);
}
