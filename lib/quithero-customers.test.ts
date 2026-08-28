import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  findQuitHeroCustomerByEmail,
  findQuitHeroCustomerByOAuth,
  linkQuitHeroCustomerOAuth,
  syncQuitHeroCustomer,
  syncQuitHeroCustomerWithoutBlocking,
  updateQuitHeroCustomer,
} from "./quithero-customers";

const fetchMock = vi.fn();

function response(body: unknown, status = 200) {
  return new Response(body === undefined ? "" : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("QUITHERO_API_KEY", "test-key");
  vi.stubEnv("QUITHERO_API_BASE_URL", "https://retail-api.test");
  vi.stubGlobal("fetch", fetchMock);
});

describe("QuitHero customer synchronization", () => {
  it("finds a customer by OAuth provider account", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: { id: "customer-1", email: "user@example.com" } }));

    const customer = await findQuitHeroCustomerByOAuth("facebook", " facebook/123 ");

    expect(customer?.id).toBe("customer-1");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://retail-api.test/customers/oauth/facebook/facebook%2F123",
    );
  });

  it("links an OAuth account to a customer", async () => {
    fetchMock.mockResolvedValueOnce(response({ id: "customer/1", email: "user@example.com" }, 201));

    await linkQuitHeroCustomerOAuth(" customer/1 ", "google", " google/456 ");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://retail-api.test/customers/customer%2F1/oauth",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ provider: "google", providerAccountId: "google/456" }),
      }),
    );
  });

  it("PATCHes a customer by ID", async () => {
    fetchMock.mockResolvedValueOnce(response({ id: "customer/123", firstName: "Updated" }));

    const customer = await updateQuitHeroCustomer(" customer/123 ", {
      firstName: "Updated",
      phone: "0412345678",
    });

    expect(customer.firstName).toBe("Updated");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://retail-api.test/customers/customer%2F123",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ firstName: "Updated", phone: "0412345678" }),
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-api-key": "test-key",
        }),
      }),
    );
  });

  it("requires a customer ID before updating", async () => {
    await expect(updateQuitHeroCustomer("  ", { firstName: "Updated" })).rejects.toThrow(
      "Customer ID is required.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not POST when a matching customer exists", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [{ email: " Customer@Example.com " }] }));

    await syncQuitHeroCustomer({ email: "customer@example.com" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://retail-api.test/customers?search=customer%40example.com",
    );
  });

  it("POSTs a new customer with only available user data", async () => {
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ email: "new@example.com" }, 201));

    await syncQuitHeroCustomer({
      email: " new@example.com ",
      firstName: "New",
      lastName: "Customer",
      phone: "0400000000",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: "new@example.com",
      firstName: "New",
      lastName: "Customer",
      phone: "0400000000",
    });
  });

  it("matches emails case-insensitively and trims whitespace", async () => {
    fetchMock.mockResolvedValueOnce(response({ results: [{ email: "USER@EXAMPLE.COM" }] }));

    const customer = await findQuitHeroCustomerByEmail(" user@example.com ");

    expect(customer?.email).toBe("USER@EXAMPLE.COM");
  });

  it("creates a customer for empty and unexpected search responses", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ unexpected: "shape" }))
      .mockResolvedValueOnce(response({ email: "empty@example.com" }, 201));

    await syncQuitHeroCustomer({ email: "empty@example.com" });

    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("treats a duplicate response as an existing customer", async () => {
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ message: "Customer already exists" }, 409))
      .mockResolvedValueOnce(response([{ email: "race@example.com" }]));

    const customer = await syncQuitHeroCustomer({ email: "race@example.com" });

    expect(customer?.email).toBe("race@example.com");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("treats a validation response that reports an existing email as a duplicate", async () => {
    fetchMock
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ errors: { email: ["Email already exists"] } }, 422))
      .mockResolvedValueOnce(response({ customers: [{ email: "validation@example.com" }] }));

    const customer = await syncQuitHeroCustomer({ email: "validation@example.com" });

    expect(customer?.email).toBe("validation@example.com");
  });

  it("does not reject login when QuitHero is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network unavailable"));

    await expect(
      syncQuitHeroCustomerWithoutBlocking({ email: "offline@example.com" }),
    ).resolves.toBeUndefined();
  });

  it("shares simultaneous synchronization requests for the same email", async () => {
    let resolveSearch: ((value: Response) => void) | undefined;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => { resolveSearch = resolve; }));

    const first = syncQuitHeroCustomer({ email: "same@example.com" });
    const second = syncQuitHeroCustomer({ email: " SAME@example.com " });
    resolveSearch?.(response([{ email: "same@example.com" }]));

    await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
