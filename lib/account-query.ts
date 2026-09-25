import { queryOptions } from "@tanstack/react-query";
import type { QuitHeroCustomer } from "./quithero-customers";
import { API_STALE_TIME } from "./query-cache";

export const accountCustomerQuery = queryOptions({
  queryKey: ["api", "/api/account/me"] as const,
  queryFn: async ({ signal }): Promise<QuitHeroCustomer | null> => {
    const response = await fetch("/api/account/me", {
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Unable to load your account.");
    return await response.json() as QuitHeroCustomer;
  },
  staleTime: API_STALE_TIME,
  retry: 1,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});
