"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

import { useQuery } from "@tanstack/react-query";

import {
  collectionAvailableFiltersQuery,
  collectionPageQuery,
  type CollectionAvailableFilter,
  type CollectionPageFilters,
  type CollectionPageResponse,
} from "@/lib/catalog/catalog-queries";

import Link from "next/link";

import { useSearchParams } from "next/navigation";

import {
  parseCollectionPage,
  collectionPageNumbers,
} from "@/lib/catalog/catalog-pagination";

import type { QuitHeroProduct } from "@/lib/quithero";

import { useAccountCustomer } from "@/hooks/useAccountCustomer";

import { hasActiveScript } from "@/lib/account/script-access";

import ProductCard from "./ProductCard";

import { CollectionProductSkeletons } from "./CollectionLoading";

import styles from "./collection-catalog.module.css";

import storeStyles from "@/app/store.module.css";

type Sort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

function variantPrices(product: QuitHeroProduct) {
  return (product.variants ?? []).flatMap((variant) => {
    if (
      variant.price === undefined ||
      variant.price === null ||
      variant.price === ""
    ) {
      return [];
    }

    const parsed =
      typeof variant.price === "number"
        ? variant.price
        : Number(
            String(variant.price).replace(
              /[^0-9.-]/g,
              "",
            ),
          );

    return Number.isFinite(parsed)
      ? [parsed]
      : [];
  });
}

function minimumVariantPrice(
  product: QuitHeroProduct,
) {
  const prices = variantPrices(product);

  return prices.length
    ? Math.min(...prices)
    : 0;
}

function filterQueryKey(
  filter: CollectionAvailableFilter,
) {
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

function attributeFilterValue(
  filter: CollectionAvailableFilter,
  value: string,
) {
  if (filter.type !== "ATTRIBUTE") {
    return value;
  }

  if (!filter.attributeSlug) {
    return value;
  }

  return `${filter.attributeSlug}:${value}`;
}

function selectedValuesForFilter(
  filter: CollectionAvailableFilter,
  searchParams: URLSearchParams,
) {
  if (filter.type === "ATTRIBUTE") {
    const prefix = filter.attributeSlug
      ? `${filter.attributeSlug}:`
      : "";

    return searchParams
      .getAll("attributeFilters")
      .filter((value) =>
        prefix
          ? value.startsWith(prefix)
          : true,
      )
      .map((value) =>
        prefix
          ? value.slice(prefix.length)
          : value,
      );
  }

  const queryKey = filterQueryKey(filter);

  if (!queryKey) {
    return [];
  }

  return searchParams.getAll(queryKey);
}

export default function CollectionCatalog({
  collectionSlug,
  initialPage,
}: {
  collectionSlug: string;
  initialPage?: CollectionPageResponse;
}) {
  const { customer } = useAccountCustomer();

  const productsLocked =
    !hasActiveScript(customer);

  const searchParams =
    useSearchParams();

  const page = parseCollectionPage(
    searchParams.get("page"),
  );

  /**
   * Read the current backend filter state
   * from the URL.
   */
  const pageFilters = useMemo<CollectionPageFilters>(
    () => ({
      brandId: searchParams
        .getAll("brandId")
        .filter(Boolean),

      productTypeId: searchParams
        .getAll("productTypeId")
        .filter(Boolean),

      status: searchParams
        .getAll("status")
        .filter(Boolean),

      sourceSystem: searchParams
        .getAll("sourceSystem")
        .filter(Boolean),

      tags: searchParams
        .getAll("tags")
        .filter(Boolean),

      minPrice:
        searchParams.get("minPrice") !== null &&
        Number.isFinite(
          Number(
            searchParams.get("minPrice"),
          ),
        )
          ? Number(
              searchParams.get("minPrice"),
            )
          : undefined,

      maxPrice:
        searchParams.get("maxPrice") !== null &&
        Number.isFinite(
          Number(
            searchParams.get("maxPrice"),
          ),
        )
          ? Number(
              searchParams.get("maxPrice"),
            )
          : undefined,

      attributeFilters: (() => {
        const values = searchParams
          .getAll("attributeFilters")
          .filter(Boolean);

        return values.length
          ? [values.join(",")]
          : [];
      })(),
    }),
    [searchParams],
  );

  const hasProductFilters = Boolean(
    pageFilters.brandId?.length ||
      pageFilters.productTypeId?.length ||
      pageFilters.status?.length ||
      pageFilters.sourceSystem?.length ||
      pageFilters.tags?.length ||
      pageFilters.minPrice !== undefined ||
      pageFilters.maxPrice !== undefined ||
      pageFilters.attributeFilters
        ?.length,
  );

  /**
   * Products are filtered and paginated
   * by the backend.
   */
  const {
    data,
    error,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    ...collectionPageQuery(
      collectionSlug,
      page,
      pageFilters,
    ),

    /**
     * Only use the server-provided initial
     * snapshot when there are no URL filters.
     *
     * Otherwise the initial snapshot would be
     * the unfiltered collection data.
     */
    initialData:
      !hasProductFilters &&
      initialPage?.pagination.page === page
        ? initialPage
        : undefined,
  });

  /**
   * Available filters are independent from the
   * current product page.
   *
   * The backend determines which filters actually
   * exist for this collection.
   */
  const {
    data: availableFiltersData,
  } = useQuery({
    ...collectionAvailableFiltersQuery(
      collectionSlug,
      pageFilters,
    ),
  });

  const products = useMemo(
    () => data?.products ?? [],
    [data],
  );

  const collection =
    data?.collection ?? {
      name: collectionSlug.replaceAll(
        "-",
        " ",
      ),
    };

  const productsLoading = isPending;

  const productsError =
    error?.message ?? "";

  const availableFilters =
    availableFiltersData?.data?.filters ??
    [];

  /**
   * Availability is currently not part of
   * CollectionPageFilters/backend product
   * filtering, so don't expose it as a
   * selectable frontend filter yet.
   *
   * The backend available-filters endpoint can
   * still return it, but we won't display a
   * filter that cannot affect the product query.
   */
  const storefrontFilters =
    availableFilters.filter(
      (filter) =>
        filter.type !== "AVAILABILITY",
    );

  const sortParam =
    searchParams.get("sort");

  const sort: Sort =
    sortParam === "price-asc" ||
    sortParam === "price-desc" ||
    sortParam === "name-asc" ||
    sortParam === "name-desc"
      ? sortParam
      : "featured";

  const rawMaxPrice =
    searchParams.get("maxPrice");

  const maxPrice =
    rawMaxPrice !== null &&
    Number.isFinite(Number(rawMaxPrice))
      ? Number(rawMaxPrice)
      : null;

  const priceFilter =
    storefrontFilters.find(
      (filter) =>
        filter.type === "PRICE",
    );

  const priceMinimum = priceFilter?.range
    ? Math.floor(
        Number(priceFilter.range.min),
      )
    : 0;

  const priceCeiling = priceFilter?.range
    ? Math.ceil(
        Number(priceFilter.range.max),
      )
    : 0;

  const hasActiveFilters = Boolean(
    searchParams.getAll("brandId")
      .length ||
      searchParams.getAll("productTypeId")
        .length ||
      searchParams.getAll("status")
        .length ||
      searchParams.getAll("sourceSystem")
        .length ||
      searchParams.getAll("tags")
        .length ||
      searchParams.getAll("attributeFilters")
        .length ||
      searchParams.get("minPrice") !==
        null ||
      searchParams.get("maxPrice") !==
        null,
  );

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [
    lockedProductName,
    setLockedProductName,
  ] = useState<string>();

  useEffect(() => {
    if (!lockedProductName) {
      return;
    }

    const closeOnEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setLockedProductName(
          undefined,
        );
      }
    };

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [lockedProductName]);

  /**
   * Update URL without causing a full page
   * navigation.
   */
  function updateUrl(
    params: URLSearchParams,
  ) {
    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname,
    );
  }

  /**
   * Update one filter and reset to page 1.
   */
  function setFilter(
    key: string,
    values: string[],
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

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
  function toggleFilterValue(
    filter: CollectionAvailableFilter,
    value: string,
  ) {
    if (
      filter.type === "PRICE" ||
      filter.type === "AVAILABILITY"
    ) {
      return;
    }

    const queryKey =
      filterQueryKey(filter);

    if (!queryKey) {
      return;
    }

    if (filter.type === "ATTRIBUTE") {
      const prefix =
        filter.attributeSlug
          ? `${filter.attributeSlug}:`
          : "";

      const allValues =
        searchParams.getAll(
          "attributeFilters",
        );

      const currentValues =
        allValues
          .filter((item) =>
            prefix
              ? item.startsWith(prefix)
              : true,
          )
          .map((item) =>
            prefix
              ? item.slice(prefix.length)
              : item,
          );

      const nextSelected =
        currentValues.includes(value)
          ? currentValues.filter(
              (item) => item !== value,
            )
          : [
              ...currentValues,
              value,
            ];

      const otherAttributeValues =
        allValues.filter((item) =>
          prefix
            ? !item.startsWith(prefix)
            : false,
        );

      const serializedValues =
        nextSelected.map((item) =>
          attributeFilterValue(
            filter,
            item,
          ),
        );

      setFilter(
        "attributeFilters",
        [
          ...otherAttributeValues,
          ...serializedValues,
        ],
      );

      return;
    }

    const current =
      searchParams.getAll(
        queryKey,
      );

    const next =
      current.includes(value)
        ? current.filter(
            (item) => item !== value,
          )
        : [...current, value];

    setFilter(queryKey, next);
  }

  function setMaxPrice(
    value: number,
  ) {
    if (
      priceCeiling > 0 &&
      value >= priceCeiling
    ) {
      const params =
        new URLSearchParams(
          searchParams.toString(),
        );

      params.delete("maxPrice");
      params.delete("page");
      params.set("page", "1");

      updateUrl(params);
      return;
    }

    const nextValue = Math.max(
      priceMinimum,
      Math.min(value, priceCeiling),
    );

    setFilter(
      "maxPrice",
      [String(nextValue)],
    );
  }

  function setSort(
    value: Sort,
  ) {
    setFilter(
      "sort",
      [value],
    );
  }

  function clearFilters() {
    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

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
    ].forEach((key) =>
      params.delete(key),
    );

    params.set("page", "1");

    updateUrl(params);
  }

  /**
   * Sorting is still performed only on the
   * backend-filtered current page.
   *
   * Filtering itself is NOT performed here.
   */
  const visibleProducts = useMemo(() => {
    const sorted = [...products];

    if (sort === "price-asc") {
      sorted.sort(
        (a, b) =>
          minimumVariantPrice(a) -
          minimumVariantPrice(b),
      );
    }

    if (sort === "price-desc") {
      sorted.sort(
        (a, b) =>
          minimumVariantPrice(b) -
          minimumVariantPrice(a),
      );
    }

    if (sort === "name-asc") {
      sorted.sort((a, b) =>
        (a.name || "").localeCompare(
          b.name || "",
        ),
      );
    }

    if (sort === "name-desc") {
      sorted.sort((a, b) =>
        (b.name || "").localeCompare(
          a.name || "",
        ),
      );
    }

    return sorted;
  }, [products, sort]);

  const totalPages = Math.max(
    1,
    data?.pagination.totalPages ??
      initialPage?.pagination.totalPages ??
      1,
  );

  function pageHref(
    target: number,
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

    params.set(
      "page",
      String(target),
    );

    return `?${params}`;
  }

  function navigate(
    event: MouseEvent<HTMLAnchorElement>,
    target: number,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    window.history.pushState(
      null,
      "",
      pageHref(target),
    );

    document
      .getElementById(
        "collection-results",
      )
      ?.scrollIntoView({
        block: "start",
      });
  }

  function renderFilter(
    filter: CollectionAvailableFilter,
    index: number,
  ) {
    if (
      filter.type === "PRICE"
    ) {
      if (
        !filter.range ||
        priceCeiling <= 0
      ) {
        return null;
      }

      const currentValue =
        maxPrice === null
          ? priceCeiling
          : Math.min(
              maxPrice,
              priceCeiling,
            );

      return (
        <details
          key={filter.key}
          className={styles.filterGroup}
        >
          <summary>
            {filter.label}
          </summary>

          <label
            className={
              styles.priceRange
            }
          >
            Up to{" "}
            {new Intl.NumberFormat(
              "en-AU",
              {
                style: "currency",
                currency: "AUD",
                maximumFractionDigits: 0,
              },
            ).format(currentValue)}

            <input
              type="range"
              min={priceMinimum}
              max={priceCeiling}
              value={currentValue}
              onChange={(event) =>
                setMaxPrice(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </label>
        </details>
      );
    }

    const values =
      filter.values ?? [];

    if (!values.length) {
      return null;
    }

    const selected =
      selectedValuesForFilter(
        filter,
        searchParams,
      );

    return (
      <details
        key={filter.key}
        className={styles.filterGroup}
      >
        <summary>
          {filter.label}
        </summary>

        <div className={styles.options}>
          {values.map((item) => {
            const label =
              item.label ??
              item.value;

            return (
              <label
                key={item.value}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.value)}
                  disabled={
                    item.count === 0 &&
                    !selected.includes(item.value)
                  }
                  onChange={() =>
                    toggleFilterValue(
                      filter,
                      item.value,
                    )
                  }
                />

                <span>
                  {label} (
                  {item.count})
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
      <header
        className={
          storeStyles.collectionHeader
        }
      >
        <h1>
          {collection.name}
        </h1>
      </header>

      <div className={styles.catalog}>
        <button
          type="button"
          className={`${styles.filterBackdrop} ${
            filtersOpen
              ? styles.filterBackdropOpen
              : ""
          }`}
          aria-label="Close filters"
          onClick={() =>
            setFiltersOpen(false)
          }
        />

        <aside
          className={`${styles.filters} ${
            filtersOpen
              ? styles.filtersOpen
              : ""
          }`}
          aria-label="Product filters"
        >
          <div
            className={
              styles.drawerHeader
            }
          >
            <div>
              <strong>
                Filter and sort
              </strong>

              <span>
                {" "}
                {data?.pagination
                  .total ??
                  products.length}{" "}
                products
              </span>
            </div>

            <button
              type="button"
              aria-label="Close filters"
              onClick={() =>
                setFiltersOpen(
                  false,
                )
              }
            >
              <span />
            </button>
          </div>

          <div
            className={
              styles.filtersHeader
            }
          >
            <h2>Filter:</h2>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Remove all
              </button>
            )}
          </div>

          {storefrontFilters.map(
            renderFilter,
          )}
        </aside>

        <section
          id="collection-results"
          className={styles.results}
        >
          <div
            className={
              styles.mobileFilterBar
            }
          >
            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  true,
                )
              }
            >
              <span
                className={
                  styles.filterIcon
                }
                aria-hidden="true"
              />

              Filter and sort
            </button>

            <strong>
              {data?.pagination
                .total ??
                products.length}{" "}
              products
            </strong>
          </div>

          <div
            className={styles.toolbar}
          >
            <label>
              Sort by:

              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as Sort,
                  )
                }
              >
                <option value="featured">
                  Featured
                </option>

                <option value="price-asc">
                  Price: low to high
                </option>

                <option value="price-desc">
                  Price: high to low
                </option>

                <option value="name-asc">
                  Name: A–Z
                </option>

                <option value="name-desc">
                  Name: Z–A
                </option>
              </select>
            </label>

            <span>
              {visibleProducts.length}{" "}
              product
              {visibleProducts.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          <div
            className={styles.productGrid}
            aria-busy={
              productsLoading &&
              !products.length
            }
          >
            {productsLoading &&
            !products.length ? (
              <CollectionProductSkeletons />
            ) : (
              visibleProducts.map(
                (
                  product,
                  index,
                ) => (
                  <ProductCard
                    product={
                      product
                    }
                    locked={
                      productsLocked
                    }
                    onLockedClick={() =>
                      setLockedProductName(
                        product.name ||
                          "Product",
                      )
                    }
                    key={
                      product.id ||
                      product.slug ||
                      index
                    }
                  />
                ),
              )
            )}
          </div>

          {!productsLoading &&
            !productsError &&
            !visibleProducts.length && (
              <p
                className={
                  styles.empty
                }
              >
                No products match
                these filters.
              </p>
            )}

          {productsError && (
            <div
              className={
                styles.empty
              }
              role="alert"
            >
              <p>
                {productsError}
              </p>

              <button
                type="button"
                disabled={
                  isFetching
                }
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </button>
            </div>
          )}

          <nav
            className={
              styles.pagination
            }
            aria-label="Collection pages"
          >
            {page > 1 ? (
              <a
                href={pageHref(
                  page - 1,
                )}
                onClick={(event) =>
                  navigate(
                    event,
                    page - 1,
                  )
                }
              >
                Previous
              </a>
            ) : (
              <span aria-disabled="true">
                Previous
              </span>
            )}

            {collectionPageNumbers(
              page,
              totalPages,
            ).map(
              (
                number,
                index,
                numbers,
              ) => (
                <span key={number}>
                  {index > 0 &&
                    number -
                      numbers[
                        index - 1
                      ] >
                      1 && (
                      <span
                        aria-hidden="true"
                      >
                        {" "}
                        ...{" "}
                      </span>
                    )}

                  <a
                    href={pageHref(
                      number,
                    )}
                    aria-label={`Page ${number}`}
                    aria-current={
                      number === page
                        ? "page"
                        : undefined
                    }
                    onClick={(
                      event,
                    ) =>
                      navigate(
                        event,
                        number,
                      )
                    }
                  >
                    {number}
                  </a>
                </span>
              ),
            )}

            {page <
            totalPages ? (
              <a
                href={pageHref(
                  page + 1,
                )}
                onClick={(event) =>
                  navigate(
                    event,
                    page + 1,
                  )
                }
              >
                Next
              </a>
            ) : (
              <span aria-disabled="true">
                Next
              </span>
            )}
          </nav>
        </section>

        {lockedProductName && (
          <div
            className={
              styles.lockedModal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="locked-product-title"
          >
            <button
              type="button"
              className={
                styles.lockedModalBackdrop
              }
              aria-label="Close"
              onClick={() =>
                setLockedProductName(
                  undefined,
                )
              }
            />

            <div
              className={
                styles.lockedModalCard
              }
            >
              <button
                type="button"
                className={
                  styles.lockedModalClose
                }
                aria-label="Close"
                onClick={() =>
                  setLockedProductName(
                    undefined,
                  )
                }
              />

              <h2 id="locked-product-title">
                {lockedProductName}
              </h2>

              <p
                className={
                  styles.lockedModalEyebrow
                }
              >
                This content is
                locked
              </p>

              <h3>
                Looking for
                Products?
                <br />
                A free nicotine
                vaping script
                unlocks your
                options
              </h3>

              <Link
                href="/intake-form"
                className={
                  styles.applyFreeButton
                }
              >
                Apply Free
              </Link>

              <p
                className={
                  styles.lockedModalContact
                }
              >
                Any questions?{" "}
                <Link href="/contact">
                  Contact us.
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
