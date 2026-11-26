"use server";

import { createInvoicePaymentSession } from "@/lib/invoices/public-client";

type StartPaymentResult =
  | {
      success: true;
      paymentMethod: "eway";
      paymentType: "TRANSPARENT_REDIRECT";
      accessCode: string;
      formActionUrl: string;
    }
  | {
      success: false;
      message: string;
    };

function isEwayUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "ewaypayments.com" || url.hostname.endsWith(".ewaypayments.com"))
    );
  } catch {
    return false;
  }
}

export async function startInvoicePayment(token: string): Promise<StartPaymentResult> {
  try {
    // 1. Validate the invoice token.
    if (typeof token !== "string" || !token.trim() || token.length > 4096) {
      return {
        success: false,
        message: "This payment link is invalid.",
      };
    }

    // 2. Create the Eway payment session.
    const session = await createInvoicePaymentSession(token.trim());

    // 3. Validate the payment session.
    if (
      session.paymentMethod !== "eway" ||
      session.paymentType !== "TRANSPARENT_REDIRECT" ||
      typeof session.accessCode !== "string" ||
      !session.accessCode.trim() ||
      session.accessCode.length > 2048 ||
      typeof session.formActionUrl !== "string" ||
      !isEwayUrl(session.formActionUrl)
    ) {
      return {
        success: false,
        message:
          "The payment provider returned an invalid payment session. Please contact support.",
      };
    }

    // 4. Return the session to the custom payment form.
    return {
      success: true,
      paymentMethod: "eway",
      paymentType: "TRANSPARENT_REDIRECT",
      accessCode: session.accessCode,
      formActionUrl: session.formActionUrl,
    };
  } catch (error) {
    console.error("[Invoice Payment] Failed to start:", {
      name: error instanceof Error ? error.name : "Unknown",
    });

    return {
      success: false,
      message:
        "Payment could not be started. Please contact support before attempting another payment.",
    };
  }
}
