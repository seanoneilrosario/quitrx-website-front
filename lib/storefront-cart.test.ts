import { describe, expect, it } from "vitest";
import { buildMultiItemCartPayload } from "./storefront-cart";

describe("buildMultiItemCartPayload", () => {
  it("includes the main item and only checked recommendation variants", () => {
    const main = {
      key: "main:large",
      productId: "main",
      productName: "Main",
      variantId: "large",
      variantName: "Large",
      quantity: 2,
    };
    const payload = buildMultiItemCartPayload(main, [
      { key: "one:mint", productId: "one", productName: "One", variantId: "mint", variantName: "Mint", quantity: 1, checked: true },
      { key: "two:plain", productId: "two", productName: "Two", variantId: "plain", variantName: "Plain", quantity: 1, checked: false },
    ]);

    expect(payload).toEqual([main, {
      key: "one:mint",
      productId: "one",
      productName: "One",
      variantId: "mint",
      variantName: "Mint",
      quantity: 1,
    }]);
  });
});

