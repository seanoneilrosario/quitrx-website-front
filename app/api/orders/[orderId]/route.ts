import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { getQuitHeroOrdersForCustomer, getQuitHeroProducts } from "@/lib/quithero";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email) return NextResponse.json({ error: "Please sign in to view this order." }, { status: 401 });

    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Your customer account could not be found." }, { status: 404 });

    const { orderId } = await params;
    const [orders, products] = await Promise.all([
      getQuitHeroOrdersForCustomer(customer.id),
      getQuitHeroProducts().catch(() => []),
    ]);
    const order = orders.find((item) => item.id === orderId || item.orderNumber === orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const variants = new Map(products.flatMap((product) => (product.variants || []).flatMap((variant) =>
      variant.id ? [[variant.id, { product, variant }] as const] : [],
    )));
    const detailedOrder = {
      ...order,
      items: order.items?.map((item) => {
        const match = item.variantId ? variants.get(item.variantId) : undefined;
        return {
          ...item,
          productName: item.productName || match?.product.name,
          variantName: item.variantName || match?.variant.name,
          sku: item.sku || match?.variant.sku,
        };
      }),
    };

    return NextResponse.json(detailedOrder, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to load QuitHero order:", error);
    return NextResponse.json({ error: "We couldn't load this order. Please try again." }, { status: 502 });
  }
}
