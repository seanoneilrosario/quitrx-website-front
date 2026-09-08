import { describe, expect, it } from "vitest";
import { bundleComponentsFrom, bundleDropdownsFrom, bundleSlotsFrom, variantIsAvailable } from "./quithero-bundle";

describe("bundleDropdownsFrom", () => {
  it("normalizes the current variant bundle dropdown structure", () => {
    expect(bundleDropdownsFrom({ bundleDropdowns: [{
      name: "Choose a flavour",
      options: [
        { componentVariantId: "mint", componentVariant: { name: "Mint", inventory: 4 } },
        { componentVariantId: "berry" },
      ],
    }] })).toEqual([{
      name: "Choose a flavour",
      options: [
        { componentVariantId: "mint", componentVariant: { name: "Mint", inventory: 4 } },
        { componentVariantId: "berry" },
      ],
    }]);
  });

  it("ignores malformed dropdowns and options", () => {
    expect(bundleDropdownsFrom({ bundleDropdowns: [
      { name: "", options: [{ componentVariantId: "mint" }] },
      { name: "Device", options: [{ componentVariantId: "" }, {}] },
    ] })).toEqual([]);
  });

  it("treats a configured dropdown bundle independently of parent inventory", () => {
    expect(variantIsAvailable({
      inventory: 0,
      bundleDropdowns: [{ name: "Device", options: [{ componentVariantId: "device" }] }],
    })).toBe(true);
  });
});

describe("bundleSlotsFrom", () => {
  it("normalizes dashboard slots and their allowed child variants", () => {
    expect(bundleSlotsFrom({ bundle: { slots: [{
      id: "slot-1",
      name: "Pods - 1",
      allowedVariants: [{ id: "menthol-0" }, { variantId: "mint-10" }],
      defaultVariantId: "mint-10",
    }] } })).toEqual([{
      id: "slot-1",
      label: "Pods - 1",
      position: 0,
      quantity: 1,
      defaultVariantId: "mint-10",
      allowedVariantIds: ["menthol-0", "mint-10"],
    }]);
  });

  it("expands legacy component quantities into independent slots", () => {
    const slots = bundleSlotsFrom({ components: [{ componentVariantId: "pod", position: 1, quantity: 2 }] });
    expect(slots).toHaveLength(2);
    expect(slots.every((slot) => slot.allowProductVariants)).toBe(true);
  });
});

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
