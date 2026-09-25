import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { getCustomerSession } from "./customer-session";
import { findQuitHeroCustomerByEmail } from "./quithero-customers";

// Request-local memoization only: never share customer data between visitors.
export const getInitialAccount = cache(async () => {
  const customerSession = await getCustomerSession();
  const oauthSession = customerSession?.email ? undefined : await auth();
  const email = customerSession?.email ?? oauthSession?.user?.email;
  if (!email) return null;
  const customer = await findQuitHeroCustomerByEmail(email);
  if (!customer?.id) return null;
  const [firstName, ...lastName] = (oauthSession?.user?.name ?? "").trim().split(/\s+/);
  return {
    ...customer,
    email: customer.email?.trim() || email,
    firstName: customer.firstName?.trim() || firstName || undefined,
    lastName: customer.lastName?.trim() || lastName.join(" ") || undefined,
  };
});
