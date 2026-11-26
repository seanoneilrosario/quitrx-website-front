"use server";

import { createInvoicePaymentSession } from "@/lib/invoices/public-client";

type StartPaymentResult =
  | { success: true; redirectUrl: string }
  | { success: false; message: string };

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
    if (typeof token !== "string" || !token.trim() || token.length > 4096) {
      return {
        success: false,
        message: "This payment link is invalid.",
      };
    }

    const session = await createInvoicePaymentSession(token.trim());

    if (typeof session.sharedPaymentUrl !== "string" || !isEwayUrl(session.sharedPaymentUrl)) {
      return {
        success: false,
        message: "The payment provider returned an invalid redirect. Please contact support.",
      };
    }

    return {
      success: true,
      redirectUrl: session.sharedPaymentUrl,
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
