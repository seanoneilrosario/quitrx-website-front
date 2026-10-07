// Shared by callers in this server process, rather than a separate pool per page.
export function createRequestGate(concurrency = 2) {
  let active = 0;
  let blockedUntil = 0;
  const waiting: Array<() => void> = [];
  return {
    cooldown(milliseconds: number) {
      blockedUntil = Math.max(blockedUntil, Date.now() + milliseconds);
    },
    async run<T>(request: () => Promise<T>): Promise<T> {
      if (active >= concurrency) await new Promise<void>((resolve) => waiting.push(resolve));
      else active += 1;
      try {
        if (Date.now() < blockedUntil)
          throw new Error("Product service is rate limited. Please try again later.");
        return await request();
      } finally {
        const next = waiting.shift();
        if (next) next();
        else active -= 1;
      }
    },
  };
}
