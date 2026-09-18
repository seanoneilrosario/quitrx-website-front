import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import { findQuitHeroCustomerByEmail } from "@/lib/quithero-customers";
import LoginPopup from "./LoginPopup";

export default async function LoginPage() {
  const session = await auth();
  const customerSession = await getCustomerSession();
  const email = session?.user?.email ?? customerSession?.email;
  const customer = email
    ? await findQuitHeroCustomerByEmail(email).catch(() => undefined)
    : undefined;
  if (customer?.id) redirect("/account");
  return <LoginPopup googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} facebookEnabled={Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET)} smsEnabled={process.env.SMS_LOGIN_ENABLED !== "false"} />;
}
