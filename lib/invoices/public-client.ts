import "server-only";

const API_BASE = process.env.INVOICE_API_BASE_URL ?? "";

function apiKey(): string {
  const key = process.env.QUITHERO_API_KEY?.trim();

  if (!key) {
    throw new Error("QUITHERO_API_KEY is not configured.");
  }

  return key;
}

export type PublicInvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type InvoicePaymentState =
  | "CREATING_SESSION"
  | "SESSION_CREATED"
  | "RECONCILIATION_REQUIRED"
  | "PAID"
  | null;

export type PublicInvoice = {
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;

  orderStatus: string;
  paymentStatus: PublicInvoiceStatus;

  currency: string;

  subtotal: string | number;
  discountTotal: string | number;
  shippingTotal: string | number;
  taxTotal: string | number;
  total: string | number;
  amountDue: number | null;

  isPaid: boolean;
  requiresPayment: boolean;
  canPay: boolean;
  hasExistingPaymentAttempt: boolean;

  paymentSessionStatus: InvoicePaymentState;

  createdAt: string;
  updatedAt: string;
};

export class PublicInvoiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PublicInvoiceError";
  }
}

// Eway Transparent Redirect payment session
export type PaymentSession = {
  paymentMethod: "eway";
  paymentType: "TRANSPARENT_REDIRECT";
  accessCode: string;
  formActionUrl: string;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function unwrap(value: unknown) {
  const payload = objectValue(value);
  const data = objectValue(payload.data);

  return Object.keys(data).length ? data : payload;
}

function getErrorMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
    case 404:
    case 410:
      return "This invoice payment link is invalid, expired or unavailable.";

    case 409:
      return "A payment attempt already exists. Please contact support before attempting another payment.";

    case 429:
      return "Too many requests. Please try again shortly.";

    default:
      return "We could not process your invoice request. Please contact support.";
  }
}

// Validate the Eway payment submission URL.
function validateEwayFormActionUrl(value: string): string {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    const isEwayHost = hostname === "ewaypayments.com" || hostname.endsWith(".ewaypayments.com");

    if (url.protocol !== "https:" || !isEwayHost || url.username || url.password || url.port) {
      throw new Error("Invalid Eway payment URL.");
    }

    return url.toString();
  } catch {
    throw new PublicInvoiceError(
      "The payment service returned an invalid payment destination.",
      502,
    );
  }
}

async function publicInvoiceRequest(
  token: string,
  method: "GET" | "POST",
  suffix = "",
): Promise<Record<string, unknown>> {
  if (typeof token !== "string" || !token.trim() || token.length > 4096) {
    throw new PublicInvoiceError("This invoice payment link is invalid.", 400);
  }

  const baseUrl = API_BASE.replace(/\/+$/, "");

  const endpoint = `${baseUrl}/orders/invoice/` + `${encodeURIComponent(token.trim())}${suffix}`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey(),
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    console.error("[Public Invoice] Request failed:", {
      method,
      name: error instanceof Error ? error.name : "Unknown",
    });

    throw new PublicInvoiceError(
      "The invoice service is temporarily unavailable. Please contact support.",
      503,
    );
  }

  if (!response.ok) {
    throw new PublicInvoiceError(getErrorMessage(response.status), response.status);
  }

  try {
    return unwrap(await response.json());
  } catch {
    throw new PublicInvoiceError("The invoice service returned an invalid response.", 502);
  }
}

export async function getPublicInvoice(token: string): Promise<PublicInvoice> {
  const data = await publicInvoiceRequest(token, "GET");

  if (
    typeof data.orderId !== "string" ||
    typeof data.invoiceNumber !== "string" ||
    typeof data.paymentStatus !== "string" ||
    typeof data.currency !== "string" ||
    typeof data.canPay !== "boolean" ||
    typeof data.isPaid !== "boolean" ||
    typeof data.requiresPayment !== "boolean" ||
    typeof data.hasExistingPaymentAttempt !== "boolean"
  ) {
    throw new PublicInvoiceError("The invoice service returned incomplete information.", 502);
  }

  return data as PublicInvoice;
}

// Create an Eway Transparent Redirect payment session.
export async function createInvoicePaymentSession(token: string): Promise<PaymentSession> {
  const data = await publicInvoiceRequest(token, "POST", "/pay");

  if (
    data.success !== true ||
    data.paymentMethod !== "eway" ||
    data.paymentType !== "TRANSPARENT_REDIRECT" ||
    typeof data.accessCode !== "string" ||
    !data.accessCode.trim() ||
    data.accessCode.length > 2048 ||
    typeof data.formActionUrl !== "string" ||
    !data.formActionUrl.trim()
  ) {
    throw new PublicInvoiceError(
      "Unable to create a valid payment session. Please contact support.",
      502,
    );
  }

  const formActionUrl = validateEwayFormActionUrl(data.formActionUrl);

  return {
    paymentMethod: "eway",
    paymentType: "TRANSPARENT_REDIRECT",
    accessCode: data.accessCode,
    formActionUrl,
  };
}
