"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";

export default function RequestScriptAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { customer, loading, error } = useAccountCustomer();
  const canRequestScript = customer?.scriptActive === false;

  useEffect(() => {
    if (loading || error || canRequestScript) return;
    router.replace(customer?.scriptActive === true ? "/account" : "/account/login?next=/request-script");
  }, [canRequestScript, customer?.scriptActive, error, loading, router]);

  if (error) return <p role="alert">{error}</p>;
  if (loading || !canRequestScript) return null;

  return children;
}
