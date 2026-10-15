import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCustomerSession } from "@/lib/auth/customer-session";
import LoginPopup from "../login/LoginPopup";
import FacebookLinkForm from "./FacebookLinkForm";

export default async function AuthPopupCompletePage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (session.user.email) redirect("/account");
  if (session.user.provider !== "facebook" || !session.user.providerAccountId) {
    redirect("/account/login?error=SessionRequired");
  }
  const verifiedSession = await getCustomerSession();
  if (verifiedSession?.email) return <FacebookLinkForm email={verifiedSession.email} />;
  return (
    <LoginPopup
      redirectTo="/account/auth-popup"
      googleEnabled={false}
      facebookEnabled={false}
      localLoginEnabled={false}
      facebookLink
    />
  );
}
