import { describe, expect, it } from "vitest";
import { getCheckoutCustomerDefaults } from "./checkout";

describe("checkout customer defaults", () => {
  it("prefills account details and the default saved address", () => {
    expect(getCheckoutCustomerDefaults({
      email: " customer@example.com ",
      firstName: "Account",
      lastName: "Name",
      phone: "0400000000",
      addresses: [
        { address1: "1 First St", city: "Sydney", state: "NSW", postcode: "2000" },
        {
          isDefault: true,
          firstName: "Delivery",
          lastName: "Recipient",
          phone: "0411111111",
          line1: " 2 Default Rd ",
          line2: " Unit 3 ",
          city: " Melbourne ",
          province: "Victoria",
          zip: " 3000 ",
        },
      ],
    })).toEqual({
      email: "customer@example.com",
      firstName: "Delivery",
      lastName: "Recipient",
      address: "2 Default Rd",
      address2: "Unit 3",
      city: "Melbourne",
      state: "VIC",
      postcode: "3000",
      phone: "0411111111",
    });
  });

  it("keeps guest checkout fields empty", () => {
    expect(getCheckoutCustomerDefaults()).toEqual({
      email: "",
      firstName: "",
      lastName: "",
      address: "",
      address2: "",
      city: "",
      state: "",
      postcode: "",
      phone: "",
    });
  });
});
