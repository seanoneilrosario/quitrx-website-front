"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { QuitHeroCustomer } from "@/lib/quithero-customers";

type AccountCustomerContextValue = {
  customer?: QuitHeroCustomer;
  loading: boolean;
  setCustomer: React.Dispatch<React.SetStateAction<QuitHeroCustomer | undefined>>;
};

const AccountCustomerContext = createContext<AccountCustomerContextValue | undefined>(undefined);

export function AccountCustomerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [customer, setCustomer] = useState<QuitHeroCustomer>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/account/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        setCustomer(response.ok ? await response.json() as QuitHeroCustomer : undefined);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setCustomer(undefined);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [pathname]);

  return (
    <AccountCustomerContext.Provider value={{ customer, loading, setCustomer }}>
      {children}
    </AccountCustomerContext.Provider>
  );
}

export function useAccountCustomer() {
  const context = useContext(AccountCustomerContext);
  if (!context) throw new Error("useAccountCustomer must be used inside AccountCustomerProvider.");
  return context;
}
