// Bounded, process-local cache. Failed refreshes never replace successful data.
export function createSummaryCache<T>(maxEntries: number, ttlMs = 300_000) {
  const entries = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();
  function set(key: string, value: T) {
    entries.delete(key);
    entries.set(key, { value, expires: Date.now() + ttlMs });
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
    return value;
  }
  return {
    set,
    async get(key: string, load: () => Promise<T>, fresh = false): Promise<T> {
      const running = pending.get(key);
      if (running) return running;
      const saved = entries.get(key);
      if (!fresh && saved && saved.expires > Date.now()) return saved.value;
      const request = Promise.resolve()
        .then(load)
        .then((value) => set(key, value))
        .finally(() => pending.delete(key));
      pending.set(key, request);
      return request;
    },
  };
}
