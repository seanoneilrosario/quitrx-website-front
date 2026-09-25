"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";

export default function ActiveScriptAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, loading, error } = useAccountCustomer();
  const scriptIsActive = hasActiveScript(customer);

  useEffect(() => {
    if (loading || error || scriptIsActive) return;
    router.replace(customer ? "/account" : `/account/login?next=${encodeURIComponent(pathname)}`);
  }, [customer, error, loading, pathname, router, scriptIsActive]);

  if (error) return <p role="alert">{error}</p>;
  if (loading || !scriptIsActive) return null;

  return children;
}
