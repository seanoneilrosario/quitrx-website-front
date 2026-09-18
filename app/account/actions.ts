"use server";

import { signOut } from "@/auth";
import { clearCustomerSession } from "@/lib/customer-session";

export async function logoutAccount() {
  await clearCustomerSession();
  await signOut({ redirectTo: "/account/login" });
}
