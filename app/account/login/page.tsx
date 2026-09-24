import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import LoginPopup from "./LoginPopup";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const { error, next } = await searchParams;
  const redirectTo = typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";
  const loginError = error === "AccountNotFound"
    ? "No account found with these details. Please contact us for help getting started."
    : error === "ServiceUnavailable"
      ? "We couldn't check your account right now. Please try again shortly."
      : error
        ? "We couldn't sign you in. Please try again or contact us for help."
        : undefined;
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  if (email && error !== "AccountNotFound") redirect(redirectTo);
  return <LoginPopup redirectTo={redirectTo} loginError={loginError} googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} facebookEnabled={Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET)} />;
}
