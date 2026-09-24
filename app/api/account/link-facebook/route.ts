import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { setCustomerSession } from "@/lib/customer-session";
import {
  linkQuitHeroCustomerOAuth,
  syncQuitHeroCustomer,
} from "@/lib/quithero-customers";

type FacebookSessionUser = {
  email?: string | null;
  provider?: string;
  providerAccountId?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as FacebookSessionUser | undefined;
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to link your Facebook account." },
      { status: 401 },
    );
  }

  if (user.provider !== "facebook" || !user.providerAccountId) {
    return NextResponse.json(
      { error: "A Facebook login session is required." },
      { status: 400 },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json() as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  try {
    const customer = await syncQuitHeroCustomer({ email });
    if (!customer?.id) throw new Error("Customer creation did not return an ID.");

    await linkQuitHeroCustomerOAuth(customer.id, "facebook", user.providerAccountId);
    await setCustomerSession({ id: customer.id, email });
    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error("Failed to link Facebook account.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to connect your Facebook account." },
      { status: 500 },
    );
  }
}
