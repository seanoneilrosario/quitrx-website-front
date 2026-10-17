"use client";

import { useEffect, useRef } from "react";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { collectionPageQuery, type CollectionPageFilters } from "@/lib/catalog/catalog-queries";

// Navigation timing describes the document load, not later client-side navigation.
export function isCurrentDocumentReload() {
  const navigation = performance.getEntriesByType?.("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (navigation?.type !== "reload") return false;
  const loadedUrl = new URL(navigation.name, window.location.href);
  return (
    loadedUrl.pathname === window.location.pathname && loadedUrl.search === window.location.search
  );
}

export function useReloadCollection(
  hydrated: boolean,
  slug: string,
  page: number,
  filters: CollectionPageFilters,
  hasServerData = false,
) {
  const client = useQueryClient();
  const restoring = useIsRestoring();
  const checked = useRef(false);

  useEffect(() => {
    if (!hydrated || restoring || checked.current) return;
    checked.current = true;
    if (hasServerData) return;
    if (!isCurrentDocumentReload()) return;

    const query = collectionPageQuery(slug, page, filters, true);
    // Wait for persisted data to restore, cancel an older ordinary read, then
    // replace that same cache entry with a fresh response. Other pages stay cached.
    void client
      .cancelQueries({ queryKey: query.queryKey, exact: true })
      .then(() => client.fetchQuery({ ...query, staleTime: 0 }))
      .catch(() => {
        // React Query exposes failures to the catalog's existing error/retry UI.
      });
  }, [client, hydrated, restoring, slug, page, filters, hasServerData]);
}
