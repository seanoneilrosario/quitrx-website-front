import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { createQuitHeroCustomerAddress, findQuitHeroCustomerByEmail, type QuitHeroAddress } from "@/lib/quithero-customers";

export async function POST(request: Request) {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (!email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    if (!customer?.id) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    const address = Object.fromEntries(
      ["address1", "address2", "city", "state", "postcode", "country"]
        .filter((key) => typeof body[key] === "string")
        .map((key) => [key, (body[key] as string).trim()]),
    ) as QuitHeroAddress;
    const result = await createQuitHeroCustomerAddress(customer.id, address);
    return NextResponse.json(result ?? { success: true });
  } catch (error) {
    console.error("Failed to add customer address.", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Unable to add the address." }, { status: 503 });
  }
}
