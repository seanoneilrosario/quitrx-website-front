import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail, updateQuitHeroCustomer } from "@/lib/quithero-customers";

async function customerEmail() {
  const session = await auth();
  const customerSession = await getCustomerSession();

  return {
    user: session?.user,
    email: session?.user?.email ?? customerSession?.email,
  };
}

export async function GET() {
  const { user: customerAuthUser, email } = await customerEmail();

  if (!email) {
    return NextResponse.json(
      {
        error: "Email address is required to load the customer account.",
      },
      { status: 401 }
    );
  }

  const [oauthFirstName, ...oauthLastNameParts] = (customerAuthUser?.name ?? "").trim().split(/\s+/);
  const identity = {
    email,
    firstName: oauthFirstName || undefined,
    lastName: oauthLastNameParts.join(" ") || undefined,
  };

  try {
    const customer = await findQuitHeroCustomerByEmail(email);
    const account = customer ? {
      ...customer,
      email: customer.email?.trim() || identity.email,
      firstName: customer.firstName?.trim() || identity.firstName,
      lastName: customer.lastName?.trim() || identity.lastName,
    } : identity;
    return NextResponse.json(account, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("QuitHero customer lookup failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(identity, { headers: { "cache-control": "no-store" } });
  }
}

export async function PATCH(request: Request) {
  const { email } = await customerEmail();
  if (!email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const customer = await findQuitHeroCustomerByEmail(email);
  if (!customer?.id) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });

  const body = await request.json() as Record<string, unknown>;
  const stringField = (key: string) => typeof body[key] === "string" ? body[key].trim() : undefined;
  const address1 = stringField("address1");
  const updated = await updateQuitHeroCustomer(customer.id, {
    firstName: stringField("firstName"),
    lastName: stringField("lastName"),
    phone: stringField("phone"),
    ...(address1 !== undefined ? { address: { ...(customer.address ?? customer.addresses?.[0]), address1, line1: address1 } } : {}),
  });

  return NextResponse.json(updated, { headers: { "cache-control": "no-store" } });
}
