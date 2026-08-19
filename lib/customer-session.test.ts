import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createSignedCustomerSession, verifySignedCustomerSession } from "./customer-session";

beforeEach(() => {
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
});
