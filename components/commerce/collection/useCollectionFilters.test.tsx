// @vitest-environment jsdom
import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  useCollectionFilters,
  selectedValuesForFilter,
  type CollectionFilterState,
} from "./useCollectionFilters";
import type { CollectionAvailableFilter } from "@/lib/catalog/catalog-queries";
import { COLLECTION_SORT_OPTIONS } from "@/lib/catalog/collection-sort";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
let root: Root;
let container: HTMLDivElement;
let filters: CollectionFilterState;
function Harness() {
  const state = useCollectionFilters();
  useEffect(() => {
    filters = state;
  }, [state]);
  return null;
}
async function render(query: string) {
  window.history.replaceState(null, "", `/collections/test?${query}`);
  await act(async () => root.render(<Harness />));
}
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
const strength: CollectionAvailableFilter = {
  label: "Strength",
  key: "strength",
  type: "ATTRIBUTE",
  attributeSlug: "strength",
};

it("toggles one attribute without dropping other attributes, brands, or sorting", async () => {
  await render(
    "page=3&brandId=one&sort=price-asc&attributeFilters=strength:10&attributeFilters=flavour:mint",
  );
  expect(selectedValuesForFilter(strength, filters.searchParams)).toEqual(["10"]);
  filters.toggleFilterValue(strength, "20");
  const next = new URLSearchParams(window.location.search);
  expect(next.getAll("attributeFilters")).toEqual(["flavour:mint", "strength:10", "strength:20"]);
  expect(next.get("page")).toBe("1");
  expect(next.get("brandId")).toBe("one");
  expect(next.get("sort")).toBe("price-asc");
  await render(next.toString());
  filters.toggleFilterValue(strength, "10");
  expect(new URLSearchParams(window.location.search).getAll("attributeFilters")).toEqual([
    "flavour:mint",
    "strength:20",
  ]);
});

it("keeps API attribute serialization and validates numeric filter values", async () => {
  await render(
    "attributeFilters=strength:10&attributeFilters=flavour:mint&minPrice=0&maxPrice=invalid&page=2",
  );
  expect(filters.page).toBe(2);
  expect(filters.pageFilters.attributeFilters).toEqual(["strength:10,flavour:mint"]);
  expect(filters.pageFilters.minPrice).toBe(0);
  expect(filters.pageFilters.maxPrice).toBeUndefined();
  expect(filters.hasProductFilters).toBe(true);
});

it("clamps price changes and removes the cap at the range maximum", async () => {
  await render("brandId=one&page=4");
  filters.setMaxPrice(5, 10, 100);
  expect(new URLSearchParams(window.location.search).get("maxPrice")).toBe("10");
  await render(window.location.search.slice(1));
  filters.setMaxPrice(100, 10, 100);
  const next = new URLSearchParams(window.location.search);
  expect(next.has("maxPrice")).toBe(false);
  expect(next.get("brandId")).toBe("one");
  expect(next.get("page")).toBe("1");
});

it("clears filters while preserving sorting and unrelated query parameters", async () => {
  await render(
    "brandId=one&attributeFilters=strength:10&maxPrice=50&sort=name-desc&page=4&utm_source=test",
  );
  filters.clearFilters();
  expect(new URLSearchParams(window.location.search).toString()).toBe(
    "sort=name-desc&page=1&utm_source=test",
  );
});

it.each(COLLECTION_SORT_OPTIONS)(
  "sends $value and resets pagination while preserving filters",
  async ({ value }) => {
    await render("page=3&brandId=one");
    filters.setSort(value);
    const next = new URLSearchParams(window.location.search);
    expect(next.get("sort")).toBe(value);
    expect(next.get("page")).toBe("1");
    expect(next.get("brandId")).toBe("one");
    await render(next.toString());
    expect(filters.pageFilters.sort).toBe(value);
  },
);

it.each([
  ["", "MANUAL"],
  ["invalid", "MANUAL"],
  ["price-asc", "PRICE_ASC"],
])("normalizes sort %s", async (value, expected) => {
  await render(`sort=${value}`);
  expect(filters.sort).toBe(expected);
});
