"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import type { QuitHeroCustomer } from "@/lib/quithero/customers";
import { accountCustomerQuery } from "@/lib/account/account-query";
import { clearCustomerData, saveCustomerData } from "@/lib/account/customer-cache";

type AccountCustomerContextValue = {
  customer?: QuitHeroCustomer;
  loading: boolean;
  error?: string;
  setCustomer: (customer?: QuitHeroCustomer) => void;
  refreshCustomer: () => Promise<QuitHeroCustomer | undefined>;
  invalidateCustomer: () => void;
};

const AccountCustomerContext = createContext<AccountCustomerContextValue | undefined>(undefined);

export function AccountCustomerProvider({
  children,
  initialCustomer,
}: {
  children: React.ReactNode;
  initialCustomer?: QuitHeroCustomer | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    ...accountCustomerQuery,
    initialData: initialCustomer,
  });
  const customer = data ?? undefined;
  const previousPath = useRef(pathname);
  const [checkedPath, setCheckedPath] = useState(pathname);
  // Gate child access guards during the first render of a navigation, before
  // effects can start rechecking a session changed by login or logout.
  const loading = checkedPath !== pathname || isPending || (!customer && isFetching);
  const error = queryError
    ? "We couldn't load your account right now. Please try again shortly."
    : undefined;

  const setCustomer = useCallback(
    (nextCustomer?: QuitHeroCustomer) => {
      // Cancel a previous session's request before writing a login/logout update.
      void queryClient.cancelQueries({ queryKey: accountCustomerQuery.queryKey });
      queryClient.setQueryData(accountCustomerQuery.queryKey, nextCustomer ?? null);
    },
    [queryClient],
  );

  const refreshCustomer = useCallback(async () => {
    const result = await refetch();
    return result.isError ? undefined : (result.data ?? undefined);
  }, [refetch]);

  const invalidateCustomer = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: accountCustomerQuery.queryKey });
  }, [queryClient]);

  useEffect(() => {
    if (data === undefined) return;
    if (data) saveCustomerData(data);
    else clearCustomerData();

    // Remove private queries belonging to a previous account, including on logout.
    const customerKey = data?.id ?? data?.email;
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[0] === "api" &&
        typeof query.queryKey[1] === "string" &&
        (query.queryKey[1] === "/api/orders" || query.queryKey[1].startsWith("/api/orders/")) &&
        query.queryKey[2] !== customerKey,
    };
    void queryClient.cancelQueries(filters);
    queryClient.removeQueries(filters);
  }, [data, queryClient]);

  useEffect(() => {
    const changed = previousPath.current !== pathname;
    if (!changed) return;
    let active = true;
    // The URL is not proof of logout. Ask the API, and wait for its answer
    // before allowing any account or prescription guard to redirect.
    void refetch().then(() => {
      if (!active) return;
      previousPath.current = pathname;
      setCheckedPath(pathname);
    });
    return () => {
      active = false;
    };
  }, [pathname, refetch]);

  useEffect(() => {
    const protectedPage =
      pathname === "/account" ||
      (pathname.startsWith("/account/") &&
        pathname !== "/account/login" &&
        pathname !== "/account/auth-popup");
    if (!loading && !queryError && data === null && protectedPage) router.replace("/account/login");
  }, [data, loading, pathname, queryError, router]);

  return (
    <AccountCustomerContext.Provider
      value={{ customer, loading, error, setCustomer, refreshCustomer, invalidateCustomer }}
    >
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
  // Recheck after leaving an external form that may have changed the account,
  // rather than refetching as soon as the form mounts.
  useEffect(
    () => () => {
      invalidateCustomer();
    },
    [invalidateCustomer],
  );
}
