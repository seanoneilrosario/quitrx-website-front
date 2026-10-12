import { previewDiscountFingerprint } from "@/lib/quithero/discount-verification";
import {
  previewQuitHeroDiscounts,
  readDiscountCode,
  QuitHeroDiscountInputError,
} from "@/lib/quithero/discounts";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHECKOUT_SHIPPING, isCheckoutShippingMethod } from "@/lib/checkout/checkout";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { createPayPalOrder, PayPalApiError } from "@/lib/payments/paypal";
import { setPendingPayPalPayment } from "@/lib/payments/paypal-payment-session";
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
    const street1 = requiredText(address, "address", 300);
    const street2 = requiredText(address, "address2", 300);
    const city = requiredText(address, "city", 120);
    const state = requiredText(address, "state", 300);
    const postalCode = requiredText(address, "postcode", 60);
    const checkoutEmail = requiredText(address, "email", 254);
    if (!firstName || !lastName || !street1 || !city || !state || !postalCode || !checkoutEmail) {
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
    const paypalItems = items.flatMap((item) => {
      const match = variants.get(`${item.productId}:${item.variantId}`);
      if (!match || getPurchasableStock(match.variant) < item.quantity) return [];
      const price =
        typeof match.variant.price === "number"
          ? match.variant.price
          : Number(String(match.variant.price ?? "").replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(price) || price < 0) return [];
      const unitCents = Math.round(price * 100);
      return [
        {
          name: (match.product.name || match.variant.name || "QuitRx product").slice(0, 127),
          sku: (match.variant.sku || item.variantId).slice(0, 127),
          quantity: String(item.quantity),
          category: "PHYSICAL_GOODS",
          unit_amount: { currency_code: "AUD", value: (unitCents / 100).toFixed(2) },
          unitCents,
        },
      ];
    });
    if (paypalItems.length !== items.length) {
      return NextResponse.json(
        { error: "One or more items are unavailable or invalid. Please update your cart." },
        { status: 409 },
      );
    }

    const subtotalCents = paypalItems.reduce(
      (sum, item, index) => sum + item.unitCents * items[index].quantity,
      0,
    );
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
    const returnUrl = new URL("/api/payments/paypal/callback", request.url).toString();
    const cancelUrl = new URL("/api/payments/paypal/cancel", request.url).toString();
    const requestId = randomUUID();
    const result = await createPayPalOrder(
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: requestId,
            description: "QuitRx order",
            amount: {
              currency_code: "AUD",
              value: (totalCents / 100).toFixed(2),
              ...(preview.discountAmount > 0 || Math.round(preview.subtotal * 100) !== subtotalCents
                ? {}
                : {
                    breakdown: {
                      item_total: { currency_code: "AUD", value: (subtotalCents / 100).toFixed(2) },
                      shipping: { currency_code: "AUD", value: (shippingCents / 100).toFixed(2) },
                    },
                  }),
            },
            items:
              preview.discountAmount > 0 || Math.round(preview.subtotal * 100) !== subtotalCents
                ? undefined
                : paypalItems.map((item) => ({
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    category: item.category,
                    unit_amount: item.unit_amount,
                  })),
            shipping: {
              name: { full_name: `${firstName} ${lastName}` },
              address: {
                address_line_1: street1,
                address_line_2: street2,
                admin_area_2: city,
                admin_area_1: state,
                postal_code: postalCode,
                country_code: "AU",
              },
            },
          },
        ],
        payer: { name: { given_name: firstName, surname: lastName }, email_address: checkoutEmail },
        application_context: {
          brand_name: "QuitRx",
          user_action: "PAY_NOW",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
      requestId,
    );
    const approvalUrl = result.links?.find(
      (link) => link.rel === "payer-action" || link.rel === "approve",
    )?.href;
    if (!result.id || !approvalUrl) throw new Error("PayPal did not provide an approval URL.");

    await setPendingPayPalPayment({
      orderId: result.id,
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
      { paymentUrl: approvalUrl },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    if (
      error instanceof QuitHeroDiscountInputError ||
      (error instanceof QuitHeroApiError && error.status === 400)
    )
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Unable to start PayPal payment:", error);
    const configurationError =
      (error instanceof Error && error.message.includes("not configured")) ||
      (error instanceof PayPalApiError && (error.status === 401 || error.status === 403));
    return NextResponse.json(
      {
        error: configurationError
          ? "PayPal is temporarily unavailable because it is not configured correctly. Please choose eWAY or contact support."
          : "We couldn't start the PayPal payment. Please try again.",
      },
      { status: 502 },
    );
  }
}
