import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createSignedCustomerSession, verifySignedCustomerSession } from "./customer-session";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("AUTH_SESSION_SECRET", "test-session-secret-that-is-at-least-32-characters");
});

describe("customer sessions", () => {
  it("round-trips the minimum customer identity", () => {
    const cookie = createSignedCustomerSession({ id: "customer-1", email: " User@Example.com " });
    expect(verifySignedCustomerSession(cookie)).toMatchObject({
      customerId: "customer-1",
      email: "user@example.com",
    });
  });

  it("rejects a modified cookie", () => {
    const cookie = createSignedCustomerSession({ email: "user@example.com" });
    expect(verifySignedCustomerSession(`${cookie}changed`)).toBeUndefined();
  });

  it("uses AUTH_SECRET when a separate session secret is not configured", () => {
    vi.stubEnv("AUTH_SESSION_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "shared-auth-secret-that-is-at-least-32-characters");

    const cookie = createSignedCustomerSession({ email: "user@example.com" });

    expect(verifySignedCustomerSession(cookie)?.email).toBe("user@example.com");
  });
});
