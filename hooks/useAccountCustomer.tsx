"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { QuitHeroCustomer } from "@/lib/quithero-customers";
import {
  clearCustomerData,
  customerDataNeedsRefresh,
  markCustomerDataStale,
  readCustomerData,
  saveCustomerData,
} from "@/lib/customer-cache";

type AccountCustomerContextValue = {
  customer?: QuitHeroCustomer;
  loading: boolean;
  error?: string;
  setCustomer: (customer?: QuitHeroCustomer) => void;
  refreshCustomer: () => Promise<QuitHeroCustomer | undefined>;
  invalidateCustomer: () => void;
};

const AccountCustomerContext = createContext<AccountCustomerContextValue | undefined>(undefined);

export function AccountCustomerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [customer, setCustomerState] = useState<QuitHeroCustomer>();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string>();
  const initialized = useRef(false);
  const previousPathname = useRef(pathname);
  const requestInFlight = useRef<Promise<QuitHeroCustomer | undefined> | undefined>(undefined);

  const setCustomer = useCallback((nextCustomer?: QuitHeroCustomer) => {
    setCustomerState(nextCustomer);
    if (nextCustomer) saveCustomerData(nextCustomer);
    else clearCustomerData();
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (requestInFlight.current) return requestInFlight.current;

    const request = fetch("/api/account/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.ok) {
          const nextCustomer = await response.json() as QuitHeroCustomer;
          setCustomer(nextCustomer);
          setUnauthorized(false);
          setError(undefined);
          return nextCustomer;
        }
        if (response.status === 401) {
          setCustomer(undefined);
          setUnauthorized(true);
          setError(undefined);
          return;
        }
        setUnauthorized(false);
        setError("We couldn't load your account right now. Please try again shortly.");
      })
      .catch(() => {
        setUnauthorized(false);
        setError("We couldn't load your account right now. Please try again shortly.");
        return undefined;
      })
      .finally(() => {
        requestInFlight.current = undefined;
        setLoading(false);
      });

    requestInFlight.current = request;
    return request;
  }, [setCustomer]);

  const invalidateCustomer = useCallback(() => {
    markCustomerDataStale();
  }, []);

  useEffect(() => {
    const pathnameChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    if (!initialized.current) {
      initialized.current = true;
      const cachedCustomer = readCustomerData();
      if (cachedCustomer) {
        fetch("/api/account/session", { cache: "no-store" })
          .then(async (response) => {
            const session = response.ok
              ? await response.json() as { email?: string }
              : undefined;
            const cachedEmail = cachedCustomer.email?.trim().toLowerCase();
            if (session?.email?.trim().toLowerCase() === cachedEmail) {
              setCustomerState(cachedCustomer);
              setUnauthorized(false);
              setError(undefined);
              setLoading(false);
              return;
            }
            clearCustomerData();
            if (response.status === 401) {
              setUnauthorized(true);
              setLoading(false);
            } else {
              void refreshCustomer();
            }
          })
          .catch(() => {
            setError("We couldn't check your session right now. Please try again shortly.");
            setLoading(false);
          });
        return;
      }
      void refreshCustomer();
      return;
    }

    if (customerDataNeedsRefresh()) void refreshCustomer();
    // Retry after navigation (including returning from login), not just because
    // the initial request reported an unauthenticated session.
    else if (pathnameChanged && !customer && unauthorized && pathname !== "/account/login") void refreshCustomer();
  }, [customer, pathname, refreshCustomer, unauthorized]);

  useEffect(() => {
    const isProtectedAccountPage = pathname === "/account" || (
      pathname.startsWith("/account/") &&
      pathname !== "/account/login" &&
      pathname !== "/account/auth-popup"
    );
    if (!loading && unauthorized && isProtectedAccountPage) router.replace("/account/login");
  }, [loading, pathname, router, unauthorized]);

  return (
    <AccountCustomerContext.Provider value={{ customer, loading, error, setCustomer, refreshCustomer, invalidateCustomer }}>
      {children}
    </AccountCustomerContext.Provider>
  );
}

export function useAccountCustomer() {
  const context = useContext(AccountCustomerContext);
  if (!context) throw new Error("useAccountCustomer must be used inside AccountCustomerProvider.");
  return context;
}

export function useCustomerDataInvalidation() {
  const { invalidateCustomer } = useAccountCustomer();

  useEffect(() => {
    invalidateCustomer();
  }, [invalidateCustomer]);
}
