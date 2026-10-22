"use client";
import { useCallback, useEffect, useState } from "react";
import type { CollectionPageResponse } from "@/lib/catalog/catalog-queries";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/account/script-access";
import ProductCard from "./ProductCard";
import { CollectionProductSkeletons } from "./CollectionLoading";
import { CollectionFilters } from "./collection/CollectionFilters";
import { CollectionPagination } from "./collection/CollectionPagination";
import { LockedProductDialog } from "./collection/LockedProductDialog";
import { useCollectionFilters } from "./collection/useCollectionFilters";
import { useCollectionData } from "./collection/useCollectionData";
import { COLLECTION_SORT_OPTIONS, type Sort } from "@/lib/catalog/collection-sort";
import styles from "./collection-catalog.module.css";
import storeStyles from "@/app/store.module.css";

export default function CollectionCatalog({
  collectionSlug,
  initialPage,
}: {
  collectionSlug: string;
  initialPage?: CollectionPageResponse;
}) {
  const { customer } = useAccountCustomer();

  useEffect(() => {
    // Reset on collection entry, not when filters or pagination change.
    // Instant scrolling overrides the site's smooth-scroll CSS.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collectionSlug]);

  const productsLocked = !hasActiveScript(customer);
  // const sortingUnavailable = collectionSlug === "all-products";
  // const sortOptions = COLLECTION_SORT_OPTIONS.filter((option) => option.value !== "MANUAL");
  const sortOptions = COLLECTION_SORT_OPTIONS;

  console.log(sortOptions);

  const filters = useCollectionFilters();
  const { page, sort, setSort } = filters;
  const {
    collection,
    products,
    visibleProducts,
    storefrontFilters,
    totalPages,
    totalProducts,
    productsLoading,
    productsError,
    isFetching,
    refetch,
  } = useCollectionData(collectionSlug, initialPage, filters);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [lockedProductName, setLockedProductName] = useState<string>();
  const closeLockedProduct = useCallback(() => setLockedProductName(undefined), []);

  return (
    <>
      <header className={storeStyles.collectionHeader}>
        <h1>{collection.name}</h1>
      </header>

      <div className={styles.catalog}>
        <CollectionFilters
          storefrontFilters={storefrontFilters}
          filters={filters}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          totalProducts={totalProducts}
        />

        <section id="collection-results" className={styles.results}>
          <div className={styles.mobileFilterBar}>
            <button type="button" onClick={() => setFiltersOpen(true)}>
              <span className={styles.filterIcon} aria-hidden="true" />
              Filter and sort
            </button>

            <strong>{totalProducts} products</strong>
          </div>

          <div className={styles.toolbar}>
            <label>
              Sort by:
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                {/* {sortingUnavailable && (
                  <option value="" disabled>
                    Sorting unavailable
                  </option>
                )} */}
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label == "Manual order" ? "Default" : option.label}
                  </option>
                ))}
              </select>
            </label>

            <span>
              {visibleProducts.length} product
              {visibleProducts.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className={styles.productGrid} aria-busy={productsLoading && !products.length}>
            {productsLoading && !products.length ? (
              <CollectionProductSkeletons />
            ) : (
              visibleProducts.map((product, index) => (
                <ProductCard
                  product={product}
                  locked={productsLocked}
                  onLockedClick={() => setLockedProductName(product.name || "Product")}
                  key={product.id || product.slug || index}
                />
              ))
            )}
          </div>

          {!productsLoading && !productsError && !visibleProducts.length && (
            <p className={styles.empty}>No products match these filters.</p>
          )}

          {productsError && (
            <div className={styles.empty} role="alert">
              <p>{productsError}</p>

              <button
                type="button"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </button>
            </div>
          )}

          <CollectionPagination page={page} totalPages={totalPages} />
        </section>

        {lockedProductName && (
          <LockedProductDialog lockedProductName={lockedProductName} onClose={closeLockedProduct} />
        )}
      </div>
    </>
  );
}
