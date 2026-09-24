import AccountDashboard from "./AccountDashboard";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";

export default async function AccountPage() {
  const customerSession = await getCustomerSession();
  const session = customerSession?.email ? undefined : await auth();
  const email = customerSession?.email ?? session?.user?.email;
  const initialCustomer = email
    ? await findQuitHeroCustomerByEmail(email).catch(() => undefined)
    : undefined;

  return <AccountDashboard initialCustomer={initialCustomer} />;
}
