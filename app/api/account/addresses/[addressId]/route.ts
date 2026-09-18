import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail, updateQuitHeroCustomerAddress, type QuitHeroAddress } from "@/lib/quithero-customers";

export async function PATCH(request: Request, { params }: { params: Promise<{ addressId: string }> }) {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (!email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
    const { addressId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const address = Object.fromEntries(
      ["address1", "address2", "city", "state", "postcode", "country"]
        .filter((key) => typeof body[key] === "string")
        .map((key) => [key, (body[key] as string).trim()]),
    ) as QuitHeroAddress;
    const result = await updateQuitHeroCustomerAddress(customer.id, addressId, address);
    return NextResponse.json(result ?? { success: true });
  } catch (error) {
    console.error("Failed to update customer address.", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Unable to update the address." }, { status: 503 });
  }
}
