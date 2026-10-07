import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("does not retry 429 responses and suppresses later calls until Retry-After expires", async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubEnv("QUITHERO_API_KEY", "test-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response("Throttled", { status: 429, headers: { "retry-after": "60" } }),
    )
    .mockResolvedValueOnce(Response.json({ data: [] }));
  vi.stubGlobal("fetch", fetch);
  const { quitHeroFetch } = await import("./client");
  await expect(quitHeroFetch("/products")).rejects.toThrow("429");
  await expect(quitHeroFetch("/products")).rejects.toThrow("rate limited");
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60_000);
  await expect(quitHeroFetch("/products")).resolves.toEqual({ data: [] });
  expect(fetch).toHaveBeenCalledTimes(2);
});
