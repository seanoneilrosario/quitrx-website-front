"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { QuitHeroCustomer } from "@/lib/quithero-customers";

type AccountCustomerContextValue = {
  customer?: QuitHeroCustomer;
  loading: boolean;
  error?: string;
  setCustomer: React.Dispatch<React.SetStateAction<QuitHeroCustomer | undefined>>;
};

const AccountCustomerContext = createContext<AccountCustomerContextValue | undefined>(undefined);

export function AccountCustomerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomer] = useState<QuitHeroCustomer>();
  const [loading, setLoading] = useState(true);
  const [loadedPathname, setLoadedPathname] = useState<string>();
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (customer) return;

    const controller = new AbortController();

    fetch("/api/account/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          setCustomer(await response.json() as QuitHeroCustomer);
          setUnauthorized(false);
          setError(undefined);
        } else if (response.status === 401) {
          setCustomer(undefined);
          setUnauthorized(true);
          setError(undefined);
        } else {
          setUnauthorized(false);
          setError("We couldn't load your account right now. Please try again shortly.");
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setUnauthorized(false);
          setError("We couldn't load your account right now. Please try again shortly.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadedPathname(pathname);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [customer, pathname]);

  const isLoadingCurrentPath = !customer && (loading || loadedPathname !== pathname);

  useEffect(() => {
    const isProtectedAccountPage = pathname === "/account" || (
      pathname.startsWith("/account/") &&
      pathname !== "/account/login" &&
      pathname !== "/account/auth-popup"
    );
    if (!isLoadingCurrentPath && unauthorized && isProtectedAccountPage) router.replace("/account/login");
  }, [isLoadingCurrentPath, pathname, router, unauthorized]);

  return (
    <AccountCustomerContext.Provider value={{ customer, loading: isLoadingCurrentPath, error, setCustomer }}>
      {children}
    </AccountCustomerContext.Provider>
  );
}

export function useAccountCustomer() {
  const context = useContext(AccountCustomerContext);
  if (!context) throw new Error("useAccountCustomer must be used inside AccountCustomerProvider.");
  return context;
}
