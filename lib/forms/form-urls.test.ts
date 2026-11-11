import { describe, expect, it } from "vitest";
import { buildQuitRxFormUrl, formatAustralianPhoneForForm } from "./form-urls";

const customer = {
  email: "alex+forms@example.com",
  firstName: "Alex Jane",
  lastName: "O'Connor",
  phone: "+61 400 123 456",
  address: {
    address1: "12 Smith & Jones St",
    address2: "Unit 4/B",
    city: "North Sydney",
    postcode: "2060",
    state: "NSW",
  },
};

describe("buildQuitRxFormUrl", () => {
  it("populates and encodes intake customer fields", () => {
    const url = buildQuitRxFormUrl("intake", customer);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      email: customer.email,
      firstname: customer.firstName,
      lastname: customer.lastName,
      phone: "0400123456",
    });
    expect(url.toString()).toContain("email=alex%2Bforms%40example.com");
  });

  it.each([
    ["+61 481 870 441", "0481870441"],
    ["%2B61481870441", "0481870441"],
    ["61481870441", "0481870441"],
    ["0481 870 441", "0481870441"],
    ["481870441", "0481870441"],
  ])("formats %s for embedded form phone fields", (phone, expected) => {
    expect(formatAustralianPhoneForForm(phone)).toBe(expected);
    expect(buildQuitRxFormUrl("intake", { phone }).searchParams.get("phone")).toBe(expected);
  });

  it("uses the required eScript address field names", () => {
    const url = buildQuitRxFormUrl("escriptRequest", customer);
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      streetaddress: customer.address.address1,
      streetaddress2: customer.address.address2,
      city: customer.address.city,
      zip: customer.address.postcode,
      state: customer.address.state,
    });
  });

  it("uses empty strings for unavailable fields", () => {
    const url = buildQuitRxFormUrl("renewal");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      firstname: "",
      lastname: "",
      email: "",
    });
    expect(url.toString()).not.toMatch(/undefined|null/);
  });

  it("handles a null phone returned by the customer API", () => {
    expect(formatAustralianPhoneForForm(null)).toBe("");
    expect(buildQuitRxFormUrl("intake", { phone: null }).searchParams.get("phone")).toBe("");
  });

  it.each(["intake", "uploadScript", "escriptRequest", "renewal"] as const)(
    "builds the %s form URL when all optional customer fields are null",
    (form) => {
      const url = buildQuitRxFormUrl(form, {
        email: null,
        firstName: null,
        lastName: null,
        phone: null,
        address: null,
        addresses: [null],
      });

      expect(url.protocol).toBe("https:");
      expect(url.searchParams.get("zf_rszfm")).toBe("1");
      expect(url.toString()).not.toMatch(/undefined|null/);
    },
  );
});
