import { getInitialAccount } from "@/lib/account/account-data";
import { escriptRenewalUrl } from "@/lib/account/escript-renewal";
import { getQuitHeroCustomer } from "@/lib/quithero/customers";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const account = await getInitialAccount();
    if (!account?.id) return Response.json({ url: null }, { status: 401, headers });
    const customer = await getQuitHeroCustomer(account.id);
    const url = customer.medicareNumber?.trim()
      ? escriptRenewalUrl({ ...account, ...customer })
      : null;
    return Response.json({ url }, { headers });
  } catch {
    return Response.json({ url: null }, { status: 502, headers });
  }
}
