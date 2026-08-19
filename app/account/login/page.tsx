import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-session";
import LoginPopup from "./LoginPopup";

export default async function LoginPage() {
  if (await getCustomerSession()) redirect("/account");
  return <LoginPopup />;
}
