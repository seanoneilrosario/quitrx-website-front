import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHECKOUT_SHIPPING, isCheckoutShippingMethod } from "@/lib/checkout";
import { getCustomerSession } from "@/lib/customer-session";
import { createEwaySharedPayment, EwayApiError } from "@/lib/eway";
import { setPendingEwayPayment } from "@/lib/eway-payment-session";
import { getFreshQuitHeroProducts } from "@/lib/quithero";
import { getPurchasableStock } from "@/lib/quithero-bundle";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

type PaymentRequest = { items?: unknown; shippingMethod?: unknown; customer?: unknown };

function requiredText(record: Record<string, unknown>, key: string, maxLength: number) {
  const value = typeof record[key] === "string" ? record[key].trim() : "";
  return value ? value.slice(0, maxLength) : undefined;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email) return NextResponse.json({ error: "Please sign in before paying for your order." }, { status: 401 });

    const customerAccount = await findQuitHeroCustomerByEmail(email);
    if (!customerAccount?.id) return NextResponse.json({ error: "Your customer account could not be found." }, { status: 404 });

    const body = await request.json() as PaymentRequest;
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50 ||
      !isCheckoutShippingMethod(body.shippingMethod) || !body.customer || typeof body.customer !== "object") {
      return NextResponse.json({ error: "The checkout details are invalid." }, { status: 400 });
    }

    const items = body.items.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const variantId = typeof item.variantId === "string" ? item.variantId.trim() : "";
      const quantity = Number(item.quantity);
      return variantId && Number.isInteger(quantity) && quantity > 0 && quantity <= 99 ? [{ variantId, quantity }] : [];
    });
    if (items.length !== body.items.length) return NextResponse.json({ error: "One or more cart items are invalid." }, { status: 400 });

    const address = body.customer as Record<string, unknown>;
    const firstName = requiredText(address, "firstName", 50);
    const lastName = requiredText(address, "lastName", 50);
    const street1 = requiredText(address, "address", 50);
    const city = requiredText(address, "city", 50);
    const state = requiredText(address, "state", 50);
    const postalCode = requiredText(address, "postcode", 30);
    const phone = requiredText(address, "phone", 32);
    const checkoutEmail = requiredText(address, "email", 50);
    if (!firstName || !lastName || !street1 || !city || !state || !postalCode || !phone || !checkoutEmail) {
      return NextResponse.json({ error: "Please complete your contact and delivery details." }, { status: 400 });
    }

    const products = await getFreshQuitHeroProducts();
    const variants = new Map(products.flatMap((product) => (product.variants ?? []).flatMap((variant) =>
      variant.id ? [[variant.id, { product, variant }] as const] : [],
    )));
    const paymentItems = items.flatMap((item) => {
      const match = variants.get(item.variantId);
      if (!match || getPurchasableStock(match.variant) < item.quantity) return [];
      const numericPrice = typeof match.variant.price === "number"
        ? match.variant.price
        : Number(String(match.variant.price ?? "").replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(numericPrice) || numericPrice < 0) return [];
      const unitCost = Math.round(numericPrice * 100);
      return [{
        SKU: (match.variant.sku || item.variantId).slice(0, 12),
        Description: (match.product.name || match.variant.name || "QuitRx product").slice(0, 26),
        Quantity: item.quantity,
        UnitCost: unitCost,
        Total: unitCost * item.quantity,
      }];
    });
    if (paymentItems.length !== items.length) {
      return NextResponse.json({ error: "One or more items are unavailable or invalid. Please update your cart." }, { status: 409 });
    }

    const subtotalCents = paymentItems.reduce((sum, item) => sum + item.Total, 0);
    const shippingCents = Math.round(CHECKOUT_SHIPPING[body.shippingMethod] * 100);
    const totalCents = subtotalCents + shippingCents;
    const reference = `QuitRx-${Date.now()}`;
    const callbackUrl = new URL("/api/payments/eway/callback", request.url).toString();
    const cancelUrl = new URL("/api/payments/eway/cancel", request.url).toString();
    const street2 = requiredText(address, "address2", 50);

    const result = await createEwaySharedPayment({
      Customer: { FirstName: firstName, LastName: lastName, Street1: street1, Street2: street2, City: city, State: state, PostalCode: postalCode, Country: "au", Email: checkoutEmail, Phone: phone },
      ShippingAddress: { FirstName: firstName, LastName: lastName, Street1: street1, Street2: street2, City: city, State: state, PostalCode: postalCode, Country: "au", Phone: phone },
      Payment: { TotalAmount: totalCents, InvoiceDescription: "QuitRx order", InvoiceReference: reference, CurrencyCode: "AUD" },
      Items: [...paymentItems, { SKU: "SHIPPING", Description: `${body.shippingMethod} shipping`, Quantity: 1, UnitCost: shippingCents, Total: shippingCents }],
      RedirectUrl: callbackUrl,
      CancelUrl: cancelUrl,
      Method: "ProcessPayment",
      TransactionType: "Purchase",
    });
    if (!result.AccessCode || !result.SharedPaymentUrl) throw new Error("eWAY did not provide a payment URL.");

    await setPendingEwayPayment({
      accessCode: result.AccessCode,
      customerId: customerAccount.id,
      items,
      subtotal: subtotalCents / 100,
      total: totalCents / 100,
      createdAt: Date.now(),
    });
    return NextResponse.json({ paymentUrl: result.SharedPaymentUrl }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to start eWAY payment:", error);
    const isConfigurationError = error instanceof EwayApiError && (error.status === 401 || error.status === 403);
    const message = (error instanceof Error && error.message.includes("not configured")) || isConfigurationError
      ? "Payments are temporarily unavailable because the payment gateway is not configured correctly. Please contact support."
      : "We couldn't start the secure payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
