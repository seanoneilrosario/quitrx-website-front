import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import { hasActiveScript } from "@/lib/script-access";

export default async function ContinueToTreatmentPage() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;

  if (!email) redirect("/account/login?next=/account/continue");

  const customer = await findQuitHeroCustomerByEmail(email);
  if (!customer?.id) redirect("/account/login?error=AccountNotFound&next=/account/continue");

  redirect(hasActiveScript(customer) ? "/pharmacy" : "/intake-form");
}
