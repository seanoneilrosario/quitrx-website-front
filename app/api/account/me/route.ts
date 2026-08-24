import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

export async function GET() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    return NextResponse.json(customer ?? { email }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("QuitHero customer lookup failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ email }, { headers: { "cache-control": "no-store" } });
  }
}
