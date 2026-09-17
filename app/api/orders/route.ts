import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { getQuitHeroOrdersForCustomer } from "@/lib/quithero";

export async function GET() {
  try {
    const session = await auth();
    const customerSession = await getCustomerSession();
    const email = session?.user?.email ?? customerSession?.email;
    if (!email) return NextResponse.json({ error: "Please sign in to view your orders." }, { status: 401 });

    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Your customer account could not be found." }, { status: 404 });

    return NextResponse.json(await getQuitHeroOrdersForCustomer(customer.id), {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    console.error("Unable to load QuitHero orders:", error);
    return NextResponse.json({ error: "We couldn't load your orders. Please try again." }, { status: 502 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Payment is required before an order can be created." }, { status: 402 });
}
