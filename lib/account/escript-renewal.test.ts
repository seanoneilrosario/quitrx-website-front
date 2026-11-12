import { describe, expect, it } from "vitest";
import { escriptRenewalUrl } from "./escript-renewal";

describe("eScript renewal prefill", () => {
  it("maps Medicare fields and preserves special characters and leading zeroes", () => {
    const url = new URL(
      escriptRenewalUrl({
        email: "person+test@example.com",
        firstName: "Anne & Jo",
        lastName: "Smith",
        phone: "+61401234567",
        medicareNumber: "0123456789",
        medicareIRNumber: "1",
        IHINumber: "8003601234567890",
        address: { city: "Old city" },
        addresses: [
          {
            isDefault: true,
            address1: "1 Main St",
            address2: "Unit 2",
            city: "Brisbane",
            state: "QLD",
            postcode: "4000",
          },
        ],
      }),
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      email: "person+test@example.com",
      firstname: "Anne & Jo",
      lastname: "Smith",
      phone: "+61401234567",
      MedicareNumber: "0123456789",
      IRN: "1",
      IHINumber: "8003601234567890",
      streetaddress: "1 Main St",
      streetaddress2: "Unit 2",
      city: "Brisbane",
      state: "QLD",
      zip: "4000",
    });
  });

  it("leaves missing customer fields blank", () => {
    const url = new URL(escriptRenewalUrl({}));
    expect([...url.searchParams.values()].every((value) => value === "")).toBe(true);
  });
});
