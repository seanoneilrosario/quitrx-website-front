import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

async function command<T>(args: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || new URL(url).protocol !== "https:") {
    throw new Error("Login protection storage is not configured.");
  }
  const response = await fetch(url.replace(/\/$/, ""), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const body = await response.json();
  if (!response.ok || body.error || !("result" in body)) {
    throw new Error("Login protection storage is unavailable.");
  }
  return body.result as T;
}

function privateKey(scope: string, value: string) {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Session secret is not configured.");
  const hash = createHmac("sha256", secret).update(value).digest("hex");
  return `quitrx:login:${scope}:${hash}`;
}

const LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count
`;

export async function allowLoginEmail(email: string) {
  const requestHeaders = await headers();
  // Only trust the client IP header overwritten by Vercel. Other deployments
  // share a conservative bucket until their trusted proxy is configured.
  const ip =
    process.env.VERCEL === "1"
      ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown"
      : "non-vercel";
  const limits = [
    { scope: "ip-hour", value: ip, seconds: 3600, max: 20 },
    { scope: "email-hour", value: email, seconds: 3600, max: 5 },
    { scope: "email-minute", value: email, seconds: 60, max: 1 },
  ];
  for (const limit of limits) {
    const count = await command<number>([
      "EVAL",
      LIMIT_SCRIPT,
      1,
      privateKey(limit.scope, limit.value),
      limit.seconds,
    ]);
    if (!Number.isInteger(count) || count > limit.max) return false;
  }
  return true;
}

export async function registerLoginCode(id: string, hash: string) {
  const result = await command<string | null>([
    "SET",
    `quitrx:login:code:${id}`,
    JSON.stringify({ hash, attempts: 0 }),
    "EX",
    600,
    "NX",
  ]);
  if (result !== "OK") throw new Error("Unable to register login code.");
}

const VERIFY_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local challenge = cjson.decode(raw)
if challenge.attempts >= 5 then return 0 end
if challenge.hash == ARGV[1] then
  redis.call('DEL', KEYS[1])
  return 1
end
challenge.attempts = challenge.attempts + 1
if challenge.attempts >= 5 then
  redis.call('DEL', KEYS[1])
else
  redis.call('SET', KEYS[1], cjson.encode(challenge), 'KEEPTTL')
end
return 0
`;

export async function consumeLoginCode(id: string, hash: string) {
  // Verification, attempt counting and consumption are one atomic operation.
  return (await command<number>(["EVAL", VERIFY_SCRIPT, 1, `quitrx:login:code:${id}`, hash])) === 1;
}
