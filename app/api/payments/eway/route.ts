import { previewDiscountFingerprint } from "@/lib/quithero/discount-verification";
import {
  previewQuitHeroDiscounts,
  readDiscountCode,
  QuitHeroDiscountInputError,
} from "@/lib/quithero/discounts";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHECKOUT_SHIPPING, isCheckoutShippingMethod } from "@/lib/checkout/checkout";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { createEwayTransparentRedirect, EwayApiError } from "@/lib/payments/eway";
import { setPendingEwayPayment } from "@/lib/payments/eway-payment-session";
import { getFreshQuitHeroProductById } from "@/lib/quithero";
import { getPurchasableStock } from "@/lib/catalog/bundles";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero/customers";

type PaymentRequest = {
  items?: unknown;
  shippingMethod?: unknown;
  customer?: unknown;
  discountCode?: unknown;
  expectedTotal?: unknown;
};

function requiredText(record: Record<string, unknown>, key: string, maxLength: number) {
  const value = typeof record[key] === "string" ? record[key].trim() : "";
  return value ? value.slice(0, maxLength) : undefined;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email)
      return NextResponse.json(
        { error: "Please sign in before paying for your order." },
        { status: 401 },
      );

    const customerAccount = await findQuitHeroCustomerByEmail(email);
    if (!customerAccount?.id)
      return NextResponse.json(
        { error: "Your customer account could not be found." },
        { status: 404 },
      );

    const body = (await request.json()) as PaymentRequest;
    if (
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 50 ||
      !isCheckoutShippingMethod(body.shippingMethod) ||
      !body.customer ||
      typeof body.customer !== "object"
    ) {
      return NextResponse.json({ error: "The checkout details are invalid." }, { status: 400 });
    }

    const items = body.items.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const productId = typeof item.productId === "string" ? item.productId.trim() : "";
      const variantId = typeof item.variantId === "string" ? item.variantId.trim() : "";
      const quantity = Number(item.quantity);
      return productId && variantId && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
        ? [{ productId, variantId, quantity }]
        : [];
    });
    if (items.length !== body.items.length)
      return NextResponse.json({ error: "One or more cart items are invalid." }, { status: 400 });

    const address = body.customer as Record<string, unknown>;
    const firstName = requiredText(address, "firstName", 50);
    const lastName = requiredText(address, "lastName", 50);
    const street1 = requiredText(address, "address", 50);
    const city = requiredText(address, "city", 50);
    const state = requiredText(address, "state", 50);
    const postalCode = requiredText(address, "postcode", 30);
    const phone = requiredText(address, "phone", 32);
    const checkoutEmail = requiredText(address, "email", 50);
    if (
      !firstName ||
      !lastName ||
      !street1 ||
      !city ||
      !state ||
      !postalCode ||
      !phone ||
      !checkoutEmail
    ) {
      return NextResponse.json(
        { error: "Please complete your contact and delivery details." },
        { status: 400 },
      );
    }

    const products = await Promise.all(
      [...new Set(items.map((item) => item.productId))].map(getFreshQuitHeroProductById),
    );
    const variants = new Map(
      products.flatMap((product) =>
        (product.variants ?? []).flatMap((variant) =>
          product.id && variant.id
            ? [[`${product.id}:${variant.id}`, { product, variant }] as const]
            : [],
        ),
      ),
    );
    const paymentItems = items.flatMap((item) => {
      const match = variants.get(`${item.productId}:${item.variantId}`);
      if (!match || getPurchasableStock(match.variant) < item.quantity) return [];
      const numericPrice =
        typeof match.variant.price === "number"
          ? match.variant.price
          : Number(String(match.variant.price ?? "").replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(numericPrice) || numericPrice < 0) return [];
      const unitCost = Math.round(numericPrice * 100);
      return [
        {
          SKU: (match.variant.sku || item.variantId).slice(0, 12),
          Description: (match.product.name || match.variant.name || "QuitRx product").slice(0, 26),
          Quantity: item.quantity,
          UnitCost: unitCost,
          Total: unitCost * item.quantity,
        },
      ];
    });
    if (paymentItems.length !== items.length) {
      return NextResponse.json(
        { error: "One or more items are unavailable or invalid. Please update your cart." },
        { status: 409 },
      );
    }

    const subtotalCents = paymentItems.reduce((sum, item) => sum + item.Total, 0);
    const shippingCents = Math.round(CHECKOUT_SHIPPING[body.shippingMethod] * 100);
    const discountCode = readDiscountCode(body.discountCode);
    const preview = await previewQuitHeroDiscounts({
      customerId: customerAccount.id,
      discountCode,
      subtotal: subtotalCents / 100,
      shippingTotal: shippingCents / 100,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
    });
    const totalCents = Math.round(preview.totalAfterDiscount * 100);
    if (
      typeof body.expectedTotal !== "number" ||
      Math.round(body.expectedTotal * 100) !== totalCents
    )
      return NextResponse.json(
        {
          error:
            "Your checkout total has changed. Please refresh discounts and review your total before paying.",
        },
        { status: 409 },
      );
    if (totalCents <= 0)
      return NextResponse.json(
        { error: "Please contact support to complete an order with a zero total." },
        { status: 400 },
      );
    const reference = `QuitRx-${Date.now()}`;
    const callbackUrl = new URL("/api/payments/eway/callback", request.url).toString();
    const street2 = requiredText(address, "address2", 50);

    const result = await createEwayTransparentRedirect({
      Customer: {
        FirstName: firstName,
        LastName: lastName,
        Street1: street1,
        Street2: street2,
        City: city,
        State: state,
        PostalCode: postalCode,
        Country: "au",
        Email: checkoutEmail,
        Phone: phone,
      },
      ShippingAddress: {
        FirstName: firstName,
        LastName: lastName,
        Street1: street1,
        Street2: street2,
        City: city,
        State: state,
        PostalCode: postalCode,
        Country: "au",
        Phone: phone,
      },
      Payment: {
        TotalAmount: totalCents,
        InvoiceDescription: "QuitRx order",
        InvoiceReference: reference,
        CurrencyCode: "AUD",
      },
      Items:
        preview.discountAmount > 0 || Math.round(preview.subtotal * 100) !== subtotalCents
          ? [
              {
                SKU: "QUITRX",
                Description: "QuitRx discounted order",
                Quantity: 1,
                UnitCost: totalCents,
                Total: totalCents,
              },
            ]
          : [
              ...paymentItems,
              {
                SKU: "SHIPPING",
                Description: `${body.shippingMethod} shipping`,
                Quantity: 1,
                UnitCost: shippingCents,
                Total: shippingCents,
              },
            ],
      RedirectUrl: callbackUrl,
      Method: "ProcessPayment",
      TransactionType: "Purchase",
    });
    if (!result.AccessCode || !result.FormActionURL)
      throw new Error("eWAY did not provide a secure payment form action.");

    await setPendingEwayPayment({
      accessCode: result.AccessCode,
      customerId: customerAccount.id,
      items: [
        ...items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        ...preview.promotionalItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          isPromotional: true as const,
          discountId: item.discountId,
          benefitType: item.benefitType,
        })),
      ],
      subtotal: preview.subtotal,
      shippingTotal: preview.shippingTotal,
      discountCode,
      discountTotal: preview.discountAmount,
      discountFingerprint: previewDiscountFingerprint(preview),
      total: totalCents / 100,
      createdAt: Date.now(),
    });
    return NextResponse.json(
      { formActionUrl: result.FormActionURL, accessCode: result.AccessCode },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    if (
      error instanceof QuitHeroDiscountInputError ||
      (error instanceof QuitHeroApiError && error.status === 400)
    )
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Unable to start eWAY payment:", error);
    const isConfigurationError =
      error instanceof EwayApiError && (error.status === 401 || error.status === 403);
    const message =
      (error instanceof Error && error.message.includes("not configured")) || isConfigurationError
        ? "Payments are temporarily unavailable because the payment gateway is not configured correctly. Please contact support."
        : "We couldn't start the secure payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
