import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero/customers";
import { getQuitHeroOrdersForCustomer } from "@/lib/quithero";
import { enrichOrderItems } from "@/lib/quithero/order-items";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email)
      return NextResponse.json({ error: "Please sign in to view this order." }, { status: 401 });

    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id)
      return NextResponse.json(
        { error: "Your customer account could not be found." },
        { status: 404 },
      );

    const { orderId } = await params;
    const orders = await getQuitHeroOrdersForCustomer(customer.id);
    const order = orders.find((item) => item.id === orderId || item.orderNumber === orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const [detailedOrder] = await enrichOrderItems([order]);

    return NextResponse.json(detailedOrder, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to load QuitHero order:", error);
    return NextResponse.json(
      { error: "We couldn't load this order. Please try again." },
      { status: 502 },
    );
  }
}
