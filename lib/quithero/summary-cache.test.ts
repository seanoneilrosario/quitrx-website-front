import { afterEach, expect, it, vi } from "vitest";
import { createSummaryCache } from "./summary-cache";
afterEach(() => vi.useRealTimers());

it("reuses successful entries for five minutes and refreshes on expiry", async () => {
  vi.useFakeTimers();
  const cache = createSummaryCache<number>(2);
  const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
  expect(await cache.get("one", load)).toBe(1);
  expect(await cache.get("one", load)).toBe(1);
  expect(load).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(300_000);
  expect(await cache.get("one", load)).toBe(2);
});

it("shares concurrent refreshes and replaces the cached value", async () => {
  const cache = createSummaryCache<number>(2);
  cache.set("one", 1);
  const load = vi.fn().mockResolvedValue(2);
  expect(await Promise.all([cache.get("one", load, true), cache.get("one", load, true)])).toEqual([
    2, 2,
  ]);
  expect(await cache.get("one", load)).toBe(2);
  expect(load).toHaveBeenCalledTimes(1);
});

it("preserves previous data after a failed refresh and retries later", async () => {
  const cache = createSummaryCache<number>(2);
  cache.set("one", 1);
  await expect(
    cache.get(
      "one",
      async () => {
        throw new Error("Offline");
      },
      true,
    ),
  ).rejects.toThrow("Offline");
  expect(await cache.get("one", async () => 2)).toBe(1);
  expect(await cache.get("one", async () => 2, true)).toBe(2);
});

it("evicts old entries at the memory bound", async () => {
  const cache = createSummaryCache<number>(2);
  cache.set("one", 1);
  cache.set("two", 2);
  cache.set("three", 3);
  const load = vi.fn().mockResolvedValue(4);
  expect(await cache.get("one", load)).toBe(4);
  expect(load).toHaveBeenCalledTimes(1);
});
