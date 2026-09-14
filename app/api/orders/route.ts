import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { createQuitHeroOrder, getFreshQuitHeroProducts } from "@/lib/quithero";
import { getPurchasableStock } from "@/lib/quithero-bundle";

type OrderRequest = {
  subtotal?: unknown;
  total?: unknown;
  items?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email) return NextResponse.json({ error: "Please sign in before placing your order." }, { status: 401 });

    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Your customer account could not be found." }, { status: 404 });

    const body = await request.json() as OrderRequest;
    const subtotal = Number(body.subtotal);
    const total = Number(body.total);
    if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(total) || total < subtotal || !Array.isArray(body.items) || !body.items.length) {
      return NextResponse.json({ error: "The order details are invalid." }, { status: 400 });
    }

    const items = body.items.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const variantId = typeof item.variantId === "string" ? item.variantId.trim() : "";
      const quantity = Number(item.quantity);
      return variantId && Number.isInteger(quantity) && quantity > 0 ? [{ variantId, quantity }] : [];
    });
    if (items.length !== body.items.length) return NextResponse.json({ error: "One or more cart items are invalid." }, { status: 400 });

    const products = await getFreshQuitHeroProducts();
    const variants = new Map(products.flatMap((product) => (product.variants ?? []).flatMap((variant) => variant.id ? [[variant.id, variant] as const] : [])));
    const unavailable = items.find((item) => getPurchasableStock(variants.get(item.variantId)) < item.quantity);
    if (unavailable) return NextResponse.json({ error: "One or more items no longer have enough stock. Please update your cart." }, { status: 409 });

    const order = await createQuitHeroOrder({
      source: "NATIVE",
      currencyCode: "AUD",
      subtotal,
      total,
      customerId: customer.id,
      items,
    });
    return NextResponse.json(order ?? { success: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to create QuitHero order:", error);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 502 });
  }
}
