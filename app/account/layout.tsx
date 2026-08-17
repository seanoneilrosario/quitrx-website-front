import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";
import "./account.css";

export const metadata: Metadata = { title: "My account | QuitRX" };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
