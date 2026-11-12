import { getInitialAccount } from "@/lib/account/account-data";
import { escriptRenewalUrl } from "@/lib/account/escript-renewal";
import { getQuitHeroCustomer } from "@/lib/quithero/customers";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const account = await getInitialAccount();
    if (!account?.id) return Response.json({ eligible: false }, { status: 401, headers });
    const customer = await getQuitHeroCustomer(account.id);
    return Response.json({ eligible: Boolean(customer.medicareNumber?.trim()) }, { headers });
  } catch {
    return Response.json({ eligible: false }, { status: 502, headers });
  }
}

export async function POST() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const account = await getInitialAccount();
    if (!account?.id) {
      return Response.json(
        { error: "Please sign in to renew your eScript." },
        { status: 401, headers },
      );
    }
    const customer = await getQuitHeroCustomer(account.id);
    if (!customer.medicareNumber?.trim()) {
      return Response.json(
        { error: "A saved Medicare number is required to renew your eScript." },
        { status: 403, headers },
      );
    }
    return Response.json({ url: escriptRenewalUrl({ ...account, ...customer }) }, { headers });
  } catch {
    return Response.json(
      { error: "Unable to load your renewal form. Please try again." },
      { status: 502, headers },
    );
  }
}
