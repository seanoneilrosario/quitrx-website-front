"use client";

import { useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { API_STALE_TIME, API_CACHE_TIME, shouldPersistQuery } from "@/lib/query-cache";

export { API_STALE_TIME } from "@/lib/query-cache";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: API_STALE_TIME,
        gcTime: API_CACHE_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }));
  const [persister] = useState(() => createSyncStoragePersister({
    key: "quitrx-catalog-query-cache-v1",
    storage: {
      getItem: (key) => {
        try { return window.sessionStorage.getItem(key); } catch { return null; }
      },
      setItem: (key, value) => {
        try { window.sessionStorage.setItem(key, value); } catch { /* Memory cache still works if storage is full or disabled. */ }
      },
      removeItem: (key) => {
        try { window.sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
      },
    },
  }));

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{
      persister,
      maxAge: API_CACHE_TIME,
      buster: "catalog-v1",
      dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery, shouldDehydrateMutation: () => false },
    }}>
      {children}
    </PersistQueryClientProvider>
  );
}
