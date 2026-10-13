import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  customer: vi.fn(),
  session: vi.fn(),
  allow: vi.fn(),
  register: vi.fn(),
  consume: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => ({ value: mocks.cookies.get(key) }),
    set: (key: string, value: string) => mocks.cookies.set(key, value),
    delete: (key: string) => mocks.cookies.delete(key),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@/lib/quithero/customers", () => ({ findQuitHeroCustomerByEmail: mocks.customer }));
vi.mock("@/lib/auth/customer-session", () => ({ setCustomerSession: mocks.session }));
vi.mock("@/lib/auth/login-protection", () => ({
  allowLoginEmail: mocks.allow,
  registerLoginCode: mocks.register,
  consumeLoginCode: mocks.consume,
}));
import { accessCustomerAccount } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookies.clear();
  vi.stubEnv("AUTH_SECRET", "s".repeat(32));
  vi.stubEnv("EMAIL_LOGIN_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("EMAIL_FROM", "login@example.test");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ id: "sent" })),
  );
  mocks.allow.mockResolvedValue(true);
  mocks.customer.mockResolvedValue({ id: "customer", email: "person@example.test" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function form(intent: string) {
  const data = new FormData();
  data.set("email", "person@example.test");
  data.set("intent", intent);
  data.set("code", "123456");
  return data;
}
it("does not send email or look up customers once the shared quota is exceeded", async () => {
  mocks.allow.mockResolvedValue(false);
  expect((await accessCustomerAccount({}, form("request"))).error).toContain("Too many requests");
  expect(mocks.customer).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
it("uses generic responses for existing and unknown accounts", async () => {
  const existing = await accessCustomerAccount({}, form("request"));
  mocks.cookies.clear();
  mocks.customer.mockResolvedValue(undefined);
  expect(await accessCustomerAccount({}, form("request"))).toEqual(existing);
});
it("never creates a session when server-side verification rejects a replay", async () => {
  await accessCustomerAccount({}, form("request"));
  const saved = mocks.cookies.get("quitrx_email_code")!;
  mocks.consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  await expect(accessCustomerAccount({}, form("verify"))).rejects.toThrow("REDIRECT:/account");
  mocks.cookies.set("quitrx_email_code", saved);
  expect((await accessCustomerAccount({}, form("verify"))).error).toContain("invalid");
  expect(mocks.session).toHaveBeenCalledTimes(1);
});
