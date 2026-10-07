"use server";

import { signOut } from "@/auth";
import { clearCustomerSession } from "@/lib/auth/customer-session";

export async function logoutAccount() {
  await clearCustomerSession();
  await signOut({ redirectTo: "/account/login" });
}
