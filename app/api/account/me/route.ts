import { NextResponse } from "next/server";
import { clearCustomerSession, getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(session.email);
    if (!customer) {
      await clearCustomerSession();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(customer, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load customer account." }, { status: 502 });
  }
}
