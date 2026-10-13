import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-vercel-forwarded-for": "192.0.2.1" }),
}));
import { allowLoginEmail, registerLoginCode, consumeLoginCode } from "./login-protection";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function setup(results: unknown[]) {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  vi.stubEnv("AUTH_SECRET", "s".repeat(32));
  vi.stubEnv("VERCEL", "1");
  const fetchMock = vi.fn();
  for (const result of results) fetchMock.mockResolvedValueOnce(Response.json({ result }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

it("enforces shared IP and email quotas without exposing raw identities in keys", async () => {
  const fetchMock = setup([1, 1, 1, 21]);
  expect(await allowLoginEmail("person@example.test")).toBe(true);
  expect(await allowLoginEmail("person@example.test")).toBe(false);
  const commands = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
  expect(commands[0][3]).toContain("ip-hour");
  expect(commands[1][3]).toContain("email-hour");
  expect(commands[2][3]).toContain("email-minute");
  expect(JSON.stringify(commands)).not.toContain("person@example.test");
  expect(JSON.stringify(commands)).not.toContain("192.0.2.1");
});

it("registers expiring codes and only accepts the atomic verification success result", async () => {
  const fetchMock = setup(["OK", 1, 0]);
  await registerLoginCode("challenge", "hashed-code");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual([
    "SET",
    "quitrx:login:code:challenge",
    JSON.stringify({ hash: "hashed-code", attempts: 0 }),
    "EX",
    600,
    "NX",
  ]);
  expect(await consumeLoginCode("challenge", "hashed-code")).toBe(true);
  expect(await consumeLoginCode("challenge", "hashed-code")).toBe(false);
});

it("fails closed if Redis is missing or unavailable", async () => {
  const fetchMock = setup([]);
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  await expect(allowLoginEmail("person@example.test")).rejects.toThrow("not configured");
  expect(fetchMock).not.toHaveBeenCalled();
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  fetchMock.mockResolvedValue(Response.json({ error: "Unavailable" }, { status: 503 }));
  await expect(consumeLoginCode("challenge", "hash")).rejects.toThrow("unavailable");
});
