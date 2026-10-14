import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  customer: vi.fn(),
  session: vi.fn(),
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
it("uses generic responses for existing and unknown accounts", async () => {
  const existing = await accessCustomerAccount({}, form("request"));
  mocks.cookies.clear();
  mocks.customer.mockResolvedValue(undefined);
  expect(await accessCustomerAccount({}, form("request"))).toEqual(existing);
});
it("sends and verifies a signed cookie code", async () => {
  expect((await accessCustomerAccount({}, form("request"))).step).toBe("code");
  const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
  const code = body.text.match(/code is (\d{6})/)[1];
  const verify = form("verify");
  verify.set("code", code);
  await expect(accessCustomerAccount({}, verify)).rejects.toThrow("REDIRECT:/account");
  expect(mocks.session).toHaveBeenCalledOnce();
  expect(mocks.cookies.has("quitrx_email_code")).toBe(false);
});

it("rejects incorrect codes after five attempts", async () => {
  await accessCustomerAccount({}, form("request"));
  const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
  const code = body.text.match(/code is (\d{6})/)[1];
  const verify = form("verify");
  verify.set("code", code === "000000" ? "000001" : "000000");
  for (let attempt = 0; attempt < 5; attempt++)
    expect((await accessCustomerAccount({}, verify)).error).toContain("invalid");
  verify.set("code", code);
  expect((await accessCustomerAccount({}, verify)).error).toContain("invalid");
  expect(mocks.session).not.toHaveBeenCalled();
});
