import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero/customers";
import { getFreshQuitHeroProductById } from "@/lib/quithero";
import { CHECKOUT_SHIPPING, isCheckoutShippingMethod } from "@/lib/checkout/checkout";
import {
  previewQuitHeroDiscounts,
  readDiscountCode,
  QuitHeroDiscountInputError,
} from "@/lib/quithero/discounts";
import { QuitHeroApiError } from "@/lib/quithero/client";
import { getPurchasableStock } from "@/lib/catalog/bundles";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email)
      return NextResponse.json(
        { error: "Please sign in to confirm checkout discounts and totals." },
        { status: 401 },
      );
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id)
      return NextResponse.json(
        { error: "Your customer account could not be found." },
        { status: 404 },
      );
    const body = (await request.json()) as {
      items?: unknown;
      shippingMethod?: unknown;
      discountCode?: unknown;
    } | null;
    if (
      !body ||
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 50 ||
      !isCheckoutShippingMethod(body.shippingMethod)
    )
      return NextResponse.json({ error: "The checkout details are invalid." }, { status: 400 });
    const items: Array<{ productId: string; variantId: string; quantity: number }> = body.items;
    if (
      items.some(
        (item) =>
          !item ||
          typeof item.productId !== "string" ||
          !item.productId ||
          typeof item.variantId !== "string" ||
          !item.variantId ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 99,
      )
    )
      return NextResponse.json({ error: "One or more cart items are invalid." }, { status: 400 });
    const discountCode = readDiscountCode(body.discountCode);
    const products = await Promise.all(
      [...new Set(items.map((item) => item.productId))].map(getFreshQuitHeroProductById),
    );
    let subtotalCents = 0;
    for (const item of items) {
      const variant = products
        .find((product) => product.id === item.productId)
        ?.variants?.find((variant) => variant.id === item.variantId);
      const price = variant?.price;
      const amount =
        typeof price === "number" ? price : Number(String(price ?? "").replace(/[^0-9.-]/g, ""));
      if (!variant || price == null || !Number.isFinite(amount) || amount < 0)
        return NextResponse.json(
          { error: "One or more cart items are unavailable. Please update your cart." },
          { status: 409 },
        );
      subtotalCents += Math.round(amount * 100) * item.quantity;
    }
    const preview = await previewQuitHeroDiscounts({
      customerId: customer.id,
      discountCode,
      subtotal: subtotalCents / 100,
      shippingTotal: CHECKOUT_SHIPPING[body.shippingMethod],
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
    });
    const promotionalProducts = await Promise.all(
      [...new Set(preview.promotionalItems.map((item) => item.productId))].map(
        getFreshQuitHeroProductById,
      ),
    );
    const promotionalItems = preview.promotionalItems.map((item) => {
      const product = promotionalProducts.find((entry) => entry.id === item.productId);
      const variant = product?.variants?.find((entry) => entry.id === item.variantId);
      if (!product || !variant)
        throw new Error("A promotional item is unavailable. Please try again.");
      return {
        ...item,
        productName: product.name || "Promotional item",
        variantName: variant.name || "Default",
        image: product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url,
        availableStock: getPurchasableStock(variant),
      };
    });
    return NextResponse.json(
      { ...preview, promotionalItems },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    const invalid =
      error instanceof QuitHeroDiscountInputError ||
      error instanceof SyntaxError ||
      (error instanceof QuitHeroApiError && error.status === 400);
    return NextResponse.json(
      {
        error:
          invalid && error instanceof Error
            ? error.message
            : "Unable to confirm checkout totals. Please try again.",
      },
      { status: invalid ? 400 : 502 },
    );
  }
}
