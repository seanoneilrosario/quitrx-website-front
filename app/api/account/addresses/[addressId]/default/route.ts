import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail, setDefaultQuitHeroCustomerAddress } from "@/lib/quithero-customers";

export async function PATCH(_request: Request, { params }: { params: Promise<{ addressId: string }> }) {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (!email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
    const { addressId } = await params;
    const result = await setDefaultQuitHeroCustomerAddress(customer.id, addressId);
    return NextResponse.json(result ?? { success: true });
  } catch (error) {
    console.error("Failed to set default customer address.", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Unable to set the default address." }, { status: 503 });
  }
}
