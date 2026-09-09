import { describe, expect, it } from "vitest";
import {
  firstAvailableVariantIndex,
  FREQUENTLY_BOUGHT_TOGETHER_QUERY,
  resolveFrequentlyBoughtTogether,
} from "./frequently-bought-together";

describe("Frequently Bought Together", () => {
  it("queries the recommendation by the current QuitHero product ID", () => {
    expect(FREQUENTLY_BOUGHT_TOGETHER_QUERY).toContain('_type == "frequentlyBoughtTogether"');
    expect(FREQUENTLY_BOUGHT_TOGETHER_QUERY).toContain("productId == $productId");
    expect(FREQUENTLY_BOUGHT_TOGETHER_QUERY).toContain("relatedProductIds");
  });

  it("preserves saved order and removes the current and unavailable products", () => {
    const products = [
      { id: "second", name: "Second", variants: [{ id: "second-v", inventory: 2 }] },
      { id: "sold-out", name: "Sold out", variants: [{ id: "sold-v", inventory: 0 }] },
      { id: "first", name: "First", variants: [{ id: "first-v", inventory: 1 }] },
      { id: "current", name: "Current", variants: [{ id: "current-v", inventory: 1 }] },
    ];

    const result = resolveFrequentlyBoughtTogether(
      "current",
      ["first", "missing", "sold-out", "current", "second", "first"],
      products,
    );

    expect(result.map((product) => product.id)).toEqual(["first", "second"]);
  });

  it("selects the first available variant", () => {
    expect(firstAvailableVariantIndex([
      { id: "sold-out", inventory: 0 },
      { id: "available", inventory: 3 },
    ])).toBe(1);
  });
});

