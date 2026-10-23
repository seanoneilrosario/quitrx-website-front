import type { CollectionAvailableFilter } from "@/lib/catalog/catalog-queries";
import { COLLECTION_SORT_OPTIONS, type Sort } from "@/lib/catalog/collection-sort";
import { selectedValuesForFilter, type CollectionFilterState } from "./useCollectionFilters";
import styles from "../collection-catalog.module.css";

export function CollectionFilters({
  storefrontFilters,
  filters,
  filtersOpen,
  setFiltersOpen,
  totalProducts,
}: {
  storefrontFilters: CollectionAvailableFilter[];
  filters: CollectionFilterState;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  totalProducts: number;
}) {
  const { searchParams, maxPrice, hasActiveFilters, clearFilters, toggleFilterValue } = filters;
  const priceFilter = storefrontFilters.find((filter) => filter.type === "PRICE");

  const priceMinimum = priceFilter?.range ? Math.floor(Number(priceFilter.range.min)) : 0;

  const priceCeiling = priceFilter?.range ? Math.ceil(Number(priceFilter.range.max)) : 0;

  const setMaxPrice = (value: number) => filters.setMaxPrice(value, priceMinimum, priceCeiling);
  function renderFilter(filter: CollectionAvailableFilter) {
    if (filter.type === "PRICE") {
      if (!filter.range || priceCeiling <= 0) {
        return null;
      }

      const currentValue = maxPrice === null ? priceCeiling : Math.min(maxPrice, priceCeiling);

      return (
        <details key={filter.key} className={styles.filterGroup}>
          <summary>{filter.label}</summary>

          <label className={styles.priceRange}>
            Up to{" "}
            {new Intl.NumberFormat("en-AU", {
              style: "currency",
              currency: "AUD",
              maximumFractionDigits: 0,
            }).format(currentValue)}
            <input
              type="range"
              min={priceMinimum}
              max={priceCeiling}
              value={currentValue}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </label>
        </details>
      );
    }

    const values = filter.values ?? [];

    if (!values.length) {
      return null;
    }

    const selected = selectedValuesForFilter(filter, searchParams);

    return (
      <details key={filter.key} className={styles.filterGroup}>
        <summary>{filter.label}</summary>

        <div className={styles.options}>
          {values.map((item) => {
            const label = item.label ?? item.value;

            return (
              <label key={item.value}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.value)}
                  disabled={item.count === 0 && !selected.includes(item.value)}
                  onChange={() => toggleFilterValue(filter, item.value)}
                />

                <span>
                  {label} ({item.count})
                </span>
              </label>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.filterBackdrop} ${filtersOpen ? styles.filterBackdropOpen : ""}`}
        aria-label="Close filters"
        onClick={() => setFiltersOpen(false)}
      />

      <aside
        className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`}
        aria-label="Product filters"
      >
        <div className={styles.drawerHeader}>
          <div>
            <strong>Filter and sort</strong>

            <span> {totalProducts} products</span>
          </div>

          <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
            <span />
          </button>
        </div>

        <label className={styles.mobileSort}>
          Sort by:
          <select
            value={filters.sort}
            onChange={(event) => {
              filters.setSort(event.target.value as Sort);
              setFiltersOpen(false);
            }}
          >
            {COLLECTION_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.filtersHeader}>
          <h2>Filter:</h2>

          {hasActiveFilters && (
            <button type="button" onClick={clearFilters}>
              Remove all
            </button>
          )}
        </div>

        {storefrontFilters.map(renderFilter)}
      </aside>
    </>
  );
}
