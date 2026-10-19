import { redirect } from "next/navigation";
import RenewalForm from "@/components/sections/forms/RenewalForm";
import { getInitialAccount } from "@/lib/account/account-data";
import { canRenewScript } from "@/lib/account/script-access";

export default async function PrescriptionsPage() {
  const customer = await getInitialAccount();

  if (!canRenewScript(customer ?? undefined)) {
    redirect("/account");
  }

  return <RenewalForm />;
}
