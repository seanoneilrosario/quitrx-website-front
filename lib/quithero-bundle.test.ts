import { describe, expect, it } from "vitest";
import { bundleComponentsFrom } from "./quithero-bundle";

describe("bundleComponentsFrom", () => {
  it("normalizes and sorts bundle components", () => {
    expect(bundleComponentsFrom({ components: [
      { componentVariantId: "second", position: 2, quantity: 2 },
      { componentVariant: { id: "first" }, position: 1, quantity: 3 },
    ] })).toEqual([
      { componentVariantId: "first", position: 1, quantity: 3 },
      { componentVariantId: "second", position: 2, quantity: 2 },
    ]);
  });

  it("accepts a nested bundle response and safe quantity defaults", () => {
    expect(bundleComponentsFrom({ bundle: { components: [
      { componentVariantId: "variant", quantity: 0 },
    ] } })).toEqual([
      { componentVariantId: "variant", position: 0, quantity: 1 },
    ]);
  });

  it("accepts the API product-variant response shape", () => {
    expect(bundleComponentsFrom({ bundleComponents: [
      { componentVariantId: "configured-variant", position: 0, quantity: 2 },
    ] })).toEqual([
      { componentVariantId: "configured-variant", position: 0, quantity: 2 },
    ]);
  });
});
