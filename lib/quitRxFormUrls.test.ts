import { describe, expect, it } from "vitest";
import { buildQuitRxFormUrl } from "./quitRxFormUrls";

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
      phone: customer.phone,
    });
    expect(url.toString()).toContain("email=alex%2Bforms%40example.com");
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
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ firstname: "", lastname: "", email: "" });
    expect(url.toString()).not.toMatch(/undefined|null/);
  });
});
