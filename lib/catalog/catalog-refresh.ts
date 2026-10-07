// A full browser reload starts a fresh collection snapshot. Client-side
// navigation continues to share React Query's in-memory cache.
export function isBrowserReload() {
  if (typeof window === "undefined") return false;
  const navigation = window.performance?.getEntriesByType?.("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === "reload";
}

export function collectionCacheForRestore(snapshot: string | null, reload: boolean) {
  if (!snapshot || !reload) return snapshot;
  try {
    const persisted = JSON.parse(snapshot);
    if (!Array.isArray(persisted?.clientState?.queries)) return null;
    persisted.clientState.queries = persisted.clientState.queries.filter(
      (query: { queryKey?: unknown[] }) =>
        !(
          query.queryKey?.[0] === "api" &&
          query.queryKey?.[1] === "/api/quithero-products" &&
          query.queryKey?.[2] === "collection"
        ),
    );
    return JSON.stringify(persisted);
  } catch {
    return null;
  }
}
