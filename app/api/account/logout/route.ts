import { signOut } from "@/auth";
import { clearCustomerSession } from "@/lib/customer-session";

export async function POST() {
  await clearCustomerSession();
  return signOut({ redirectTo: "/account/login" });
}
