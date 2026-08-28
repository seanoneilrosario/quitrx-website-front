import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

export async function GET() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;

  if (!email) {
    return NextResponse.json(
      {
        error: "Email address is required to load the customer account.",
      },
      { status: 400 }
    );
  }

  const [oauthFirstName, ...oauthLastNameParts] = (session?.user?.name ?? "").trim().split(/\s+/);
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