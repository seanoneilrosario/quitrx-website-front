import { describe, expect, it } from "vitest";
import { customerHasMobile, normalizeAustralianMobile } from "./sms-login";

describe("SMS login phone matching", () => {
  it.each([
    "0412 345 678",
    "0412-345-678",
    "+61 412 345 678",
    "61412345678",
    "412345678",
  ])("normalizes %s", (phone) => {
    expect(normalizeAustralianMobile(phone)).toBe("+61412345678");
  });

  it("matches a phone stored on the customer", () => {
    expect(customerHasMobile({ phone: "0412 345 678" }, "+61412345678")).toBe(true);
  });

  it("matches a phone stored on the default address", () => {
    expect(customerHasMobile({ address: { phone: "0412 345 678" } }, "+61412345678")).toBe(true);
  });

  it("matches a phone stored in saved addresses", () => {
    expect(customerHasMobile({ addresses: [{ phone: "0412 345 678" }] }, "+61412345678")).toBe(true);
  });

  it("rejects a different or invalid phone", () => {
    expect(customerHasMobile({ addresses: [{ phone: "0412 345 678" }] }, "+61498765432")).toBe(false);
    expect(normalizeAustralianMobile("12345")).toBeUndefined();
  });
});
