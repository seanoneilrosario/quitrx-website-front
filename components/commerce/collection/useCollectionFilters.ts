"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parseCollectionPage } from "@/lib/catalog/catalog-pagination";
import type {
  CollectionAvailableFilter,
  CollectionPageFilters,
} from "@/lib/catalog/catalog-queries";
import { parseCollectionSort, type Sort } from "@/lib/catalog/collection-sort";
function filterQueryKey(filter: CollectionAvailableFilter) {
  switch (filter.type) {
    case "BRAND":
      return "brandId";

    case "PRODUCT_TYPE":
      return "productTypeId";

    case "STATUS":
      return "status";

    case "SOURCE_SYSTEM":
      return "sourceSystem";

    case "TAG":
      return "tags";

    case "ATTRIBUTE":
      return "attributeFilters";

    default:
      return null;
  }
}

function attributeFilterValue(filter: CollectionAvailableFilter, value: string) {
  if (filter.type !== "ATTRIBUTE") {
    return value;
  }

  if (!filter.attributeSlug) {
    return value;
  }

  return `${filter.attributeSlug}:${value}`;
}

export function selectedValuesForFilter(
  filter: CollectionAvailableFilter,
  searchParams: URLSearchParams,
) {
  if (filter.type === "ATTRIBUTE") {
    const prefix = filter.attributeSlug ? `${filter.attributeSlug}:` : "";

    return searchParams
      .getAll("attributeFilters")
      .filter((value) => (prefix ? value.startsWith(prefix) : true))
      .map((value) => (prefix ? value.slice(prefix.length) : value));
  }

  const queryKey = filterQueryKey(filter);

  if (!queryKey) {
    return [];
  }

  return searchParams.getAll(queryKey);
}

export function useCollectionFilters() {
  const searchParams = useSearchParams();

  const sort = parseCollectionSort(searchParams.get("sort"));

  const page = parseCollectionPage(searchParams.get("page"));

  /**
   * Read the current backend filter state
   * from the URL.
   */
  const pageFilters = useMemo<CollectionPageFilters>(
    () => ({
      sort,
      brandId: searchParams.getAll("brandId").filter(Boolean),

      productTypeId: searchParams.getAll("productTypeId").filter(Boolean),

      status: searchParams.getAll("status").filter(Boolean),

      sourceSystem: searchParams.getAll("sourceSystem").filter(Boolean),

      tags: searchParams.getAll("tags").filter(Boolean),

      minPrice:
        searchParams.get("minPrice") !== null &&
        Number.isFinite(Number(searchParams.get("minPrice")))
          ? Number(searchParams.get("minPrice"))
          : undefined,

      maxPrice:
        searchParams.get("maxPrice") !== null &&
        Number.isFinite(Number(searchParams.get("maxPrice")))
          ? Number(searchParams.get("maxPrice"))
          : undefined,

      attributeFilters: (() => {
        const values = searchParams.getAll("attributeFilters").filter(Boolean);

        return values.length ? [values.join(",")] : [];
      })(),
    }),
    [searchParams, sort],
  );

  const hasProductFilters = Boolean(
    pageFilters.brandId?.length ||
    pageFilters.productTypeId?.length ||
    pageFilters.status?.length ||
    pageFilters.sourceSystem?.length ||
    pageFilters.tags?.length ||
    pageFilters.minPrice !== undefined ||
    pageFilters.maxPrice !== undefined ||
    pageFilters.attributeFilters?.length,
  );

  const rawMaxPrice = searchParams.get("maxPrice");

  const maxPrice =
    rawMaxPrice !== null && Number.isFinite(Number(rawMaxPrice)) ? Number(rawMaxPrice) : null;

  const hasActiveFilters = Boolean(
    searchParams.getAll("brandId").length ||
    searchParams.getAll("productTypeId").length ||
    searchParams.getAll("status").length ||
    searchParams.getAll("sourceSystem").length ||
    searchParams.getAll("tags").length ||
    searchParams.getAll("attributeFilters").length ||
    searchParams.get("minPrice") !== null ||
    searchParams.get("maxPrice") !== null,
  );

  /**
   * Update URL without causing a full page
   * navigation.
   */
  function updateUrl(params: URLSearchParams) {
    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }

  /**
   * Update one filter and reset to page 1.
   */
  function setFilter(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(key);

    values.forEach((value) => {
      params.append(key, value);
    });

    params.set("page", "1");

    updateUrl(params);
  }

  /**
   * Toggle a checkbox value.
   *
   * ATTRIBUTE filters need special handling
   * because multiple different attributes can
   * be selected at the same time.
   */
  function toggleFilterValue(filter: CollectionAvailableFilter, value: string) {
    if (filter.type === "PRICE" || filter.type === "AVAILABILITY") {
      return;
    }

    const queryKey = filterQueryKey(filter);

    if (!queryKey) {
      return;
    }

    if (filter.type === "ATTRIBUTE") {
      const prefix = filter.attributeSlug ? `${filter.attributeSlug}:` : "";

      const allValues = searchParams.getAll("attributeFilters");

      const currentValues = allValues
        .filter((item) => (prefix ? item.startsWith(prefix) : true))
        .map((item) => (prefix ? item.slice(prefix.length) : item));

      const nextSelected = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      const otherAttributeValues = allValues.filter((item) =>
        prefix ? !item.startsWith(prefix) : false,
      );

      const serializedValues = nextSelected.map((item) => attributeFilterValue(filter, item));

      setFilter("attributeFilters", [...otherAttributeValues, ...serializedValues]);

      return;
    }

    const current = searchParams.getAll(queryKey);

    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    setFilter(queryKey, next);
  }

  function setMaxPrice(value: number, priceMinimum: number, priceCeiling: number) {
    if (priceCeiling > 0 && value >= priceCeiling) {
      const params = new URLSearchParams(searchParams.toString());

      params.delete("maxPrice");
      params.delete("page");
      params.set("page", "1");

      updateUrl(params);
      return;
    }

    const nextValue = Math.max(priceMinimum, Math.min(value, priceCeiling));

    setFilter("maxPrice", [String(nextValue)]);
  }

  function setSort(value: Sort) {
    setFilter("sort", [value]);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());

    [
      "brand",
      "brandId",
      "size",
      "color",
      "productTypeId",
      "status",
      "sourceSystem",
      "tags",
      "attributeFilters",
      "availability",
      "minPrice",
      "maxPrice",
    ].forEach((key) => params.delete(key));

    params.set("page", "1");

    updateUrl(params);
  }

  return {
    searchParams,
    page,
    pageFilters,
    hasProductFilters,
    hasActiveFilters,
    sort,
    maxPrice,
    setSort,
    setMaxPrice,
    toggleFilterValue,
    clearFilters,
  };
}
export type CollectionFilterState = ReturnType<typeof useCollectionFilters>;
