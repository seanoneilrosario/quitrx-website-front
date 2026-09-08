import { describe, expect, it } from "vitest";
import { bundleComponentsFrom, variantIsAvailable } from "./quithero-bundle";

describe("bundleComponentsFrom", () => {
  it("normalizes and sorts bundle components", () => {
    expect(bundleComponentsFrom({ components: [
      { componentVariantId: "second", position: 2, quantity: 2 },
      { componentVariant: { id: "first" }, position: 1, quantity: 3 },
    ] })).toEqual([
      { componentVariantId: "first", componentVariant: { id: "first" }, position: 1, quantity: 3 },
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

  it("keeps a zero-inventory bundle available when every component has enough inventory", () => {
    expect(variantIsAvailable({ inventory: 0, bundleComponents: [
      { componentVariant: { id: "one", inventory: 4 }, quantity: 2 },
      { componentVariant: { id: "two", inventory: 1 }, quantity: 1 },
    ] })).toBe(true);
  });

  it("marks a bundle unavailable when a component has insufficient inventory", () => {
    expect(variantIsAvailable({ inventory: 20, bundleComponents: [
      { componentVariant: { id: "one", inventory: 1 }, quantity: 2 },
    ] })).toBe(false);
  });

  it("uses updated bundle components when a refreshed API payload is normalized", () => {
    const original = { inventory: 0, bundleComponents: [
      { componentVariant: { id: "old", inventory: 0 }, quantity: 1 },
    ] };
    const refreshed = { ...original, bundleComponents: [
      { componentVariant: { id: "new", inventory: 3 }, quantity: 1 },
    ] };

    expect(variantIsAvailable(original)).toBe(false);
    expect(bundleComponentsFrom(refreshed)[0].componentVariantId).toBe("new");
    expect(variantIsAvailable(refreshed)).toBe(true);
  });

  it("preserves parent inventory behavior for non-bundle variants", () => {
    expect(variantIsAvailable({ inventory: 0 })).toBe(false);
    expect(variantIsAvailable({ inventory: 1 })).toBe(true);
    expect(variantIsAvailable({})).toBe(true);
  });
});
