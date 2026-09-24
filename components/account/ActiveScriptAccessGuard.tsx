"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

export default function ActiveScriptAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, loading, error } = useAccountCustomer();
  const hasActiveScript = customer?.scriptActive === true;

  useEffect(() => {
    if (loading || error || hasActiveScript) return;
    router.replace(customer ? "/account" : `/account/login?next=${encodeURIComponent(pathname)}`);
  }, [customer, error, hasActiveScript, loading, pathname, router]);

  if (error) return <p role="alert">{error}</p>;
  if (loading || !hasActiveScript) return null;

  return children;
}
