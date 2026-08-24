import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/customer-session";
import LoginPopup from "./LoginPopup";

export default async function LoginPage() {
  if ((await auth()) || (await getCustomerSession())) redirect("/account");
  return <LoginPopup googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} facebookEnabled={Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET)} />;
}
