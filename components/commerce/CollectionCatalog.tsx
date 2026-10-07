"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collectionPageQuery, type CollectionPageResponse } from "@/lib/catalog/catalog-queries";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { parseCollectionPage, collectionPageNumbers } from "@/lib/catalog/catalog-pagination";
import type { QuitHeroProduct, QuitHeroVariant } from "@/lib/quithero";
import { productIsAvailable } from "@/lib/catalog/bundles";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/account/script-access";
import ProductCard from "./ProductCard";
import { CollectionProductSkeletons } from "./CollectionLoading";
import styles from "./collection-catalog.module.css";
import storeStyles from "@/app/store.module.css";

type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

function variantPrices(product: QuitHeroProduct) {
  return (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") return [];
    const parsed =
      typeof variant.price === "number"
        ? variant.price
        : Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? [parsed] : [];
  });
}

function minimumVariantPrice(product: QuitHeroProduct) {
  const prices = variantPrices(product);
  return prices.length ? Math.min(...prices) : 0;
}

function optionValues(variant: QuitHeroVariant, key: "size" | "color") {
  const direct = variant[key];
  const option = variant.options?.[key] ?? variant.options?.[key[0].toUpperCase() + key.slice(1)];
  return direct || option;
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

export default function CollectionCatalog({
  collectionSlug,
  initialPage,
}: {
  collectionSlug: string;
  initialPage?: CollectionPageResponse;
}) {
  const { customer } = useAccountCustomer();
  const productsLocked = !hasActiveScript(customer);
  const searchParams = useSearchParams();
  const page = parseCollectionPage(searchParams.get("page"));
  const { data, error, isPending, isFetching, refetch } = useQuery({
    ...collectionPageQuery(collectionSlug, page),
    initialData: initialPage?.pagination.page === page ? initialPage : undefined,
  });
  const products = useMemo(
    () => (data?.products ?? []).filter((product) => product.status !== "ARCHIVED"),
    [data],
  );
  const collection = data?.collection ?? { name: collectionSlug.replaceAll("-", " ") };
  const productsLoading = isPending;
  const productsError = error?.message ?? "";
  const brands = searchParams.getAll("brand");
  const sizes = searchParams.getAll("size");
  const colors = searchParams.getAll("color");
  const availability = searchParams.get("availability") || "all";
  const sort = (searchParams.get("sort") || "featured") as Sort;
  const rawPrice = searchParams.get("maxPrice");
  const maxPrice = rawPrice !== null && Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : null;
  function setFilter(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }
  const setBrands = (values: string[]) => setFilter("brand", values);
  const setSizes = (values: string[]) => setFilter("size", values);
  const setColors = (values: string[]) => setFilter("color", values);
  const setAvailability = (value: string) => setFilter("availability", [value]);
  const setSort = (value: Sort) => setFilter("sort", [value]);
  const setMaxPrice = (value: number) => setFilter("maxPrice", [String(value)]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lockedProductName, setLockedProductName] = useState<string>();
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(...products.flatMap(variantPrices), 0)),
    [products],
  );
  const hasActiveFilters = Boolean(
    brands.length || sizes.length || colors.length || maxPrice !== null || availability !== "all",
  );

  useEffect(() => {
    if (!lockedProductName) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLockedProductName(undefined);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [lockedProductName]);

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["brand", "size", "color", "availability", "maxPrice"].forEach((key) => params.delete(key));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  };

  const facets = useMemo(
    () => ({
      brands: unique(products.map((product) => product.brand?.name)),
      sizes: unique(
        products.flatMap(
          (product) => product.variants?.map((variant) => optionValues(variant, "size")) ?? [],
        ),
      ),
      colors: unique(
        products.flatMap(
          (product) => product.variants?.map((variant) => optionValues(variant, "color")) ?? [],
        ),
      ),
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const inStock = productIsAvailable(product);
      const variantSizes = product.variants?.map((variant) => optionValues(variant, "size"));
      const variantColors = product.variants?.map((variant) => optionValues(variant, "color"));
      return (
        (!brands.length || brands.includes(product.brand?.name || "")) &&
        (!sizes.length || sizes.some((size) => variantSizes?.includes(size))) &&
        (!colors.length || colors.some((color) => variantColors?.includes(color))) &&
        (maxPrice === null || variantPrices(product).some((price) => price <= maxPrice)) &&
        (availability === "all" || (availability === "in-stock" ? inStock : !inStock))
      );
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return minimumVariantPrice(a) - minimumVariantPrice(b);
      if (sort === "price-desc") return minimumVariantPrice(b) - minimumVariantPrice(a);
      if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });
  }, [availability, brands, colors, maxPrice, products, sizes, sort]);
  const visibleProducts = filteredProducts;
  const totalPages = Math.max(
    1,
    data?.pagination.totalPages ?? initialPage?.pagination.totalPages ?? 1,
  );
  function pageHref(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `?${params}`;
  }
  function navigate(event: React.MouseEvent<HTMLAnchorElement>, target: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    window.history.pushState(null, "", pageHref(target));
    document.getElementById("collection-results")?.scrollIntoView({ block: "start" });
  }

  const toggle = (value: string, values: string[], setValues: (values: string[]) => void) => {
    setValues(
      values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
    );
  };

  const facet = (
    label: string,
    values: string[],
    selected: string[],
    setSelected: (values: string[]) => void,
    count: (value: string) => number,
    open = false,
  ) =>
    values.length ? (
      <details className={styles.filterGroup} {...(open && !filtersOpen ? { open: true } : {})}>
        <summary>{label}</summary>
        <div className={styles.options}>
          {values.map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => toggle(value, selected, setSelected)}
              />
              <span>
                {value} ({count(value)})
              </span>
            </label>
          ))}
        </div>
      </details>
    ) : null;

  return (
    <>
      <header className={storeStyles.collectionHeader}>
        <h1>{collection.name}</h1>
      </header>
      <div className={styles.catalog}>
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
              <span> {data?.pagination.total ?? products.length} products</span>
            </div>
            <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
              <span />
            </button>
          </div>
          <div className={styles.filtersHeader}>
            <h2>Filter:</h2>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters}>
                Remove all
              </button>
            )}
          </div>
          {facet(
            "Brand",
            facets.brands,
            brands,
            setBrands,
            (brand) => products.filter((product) => product.brand?.name === brand).length,
            true,
          )}
          {facet(
            "Product Size",
            facets.sizes,
            sizes,
            setSizes,
            (size) =>
              products.filter((product) =>
                product.variants?.some((variant) => optionValues(variant, "size") === size),
              ).length,
          )}
          {facet(
            "Color",
            facets.colors,
            colors,
            setColors,
            (color) =>
              products.filter((product) =>
                product.variants?.some((variant) => optionValues(variant, "color") === color),
              ).length,
          )}
          {priceCeiling > 0 && (
            <details className={styles.filterGroup}>
              <summary>Price</summary>
              <label className={styles.priceRange}>
                Up to{" "}
                {new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: "AUD",
                  maximumFractionDigits: 0,
                }).format(maxPrice ?? priceCeiling)}
                <input
                  type="range"
                  min="0"
                  max={priceCeiling}
                  value={maxPrice ?? priceCeiling}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </label>
            </details>
          )}
          <details className={styles.filterGroup}>
            <summary>Availability</summary>
            <div className={styles.options}>
              <label>
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "all"}
                  onChange={() => setAvailability("all")}
                />{" "}
                All
              </label>
              <label>
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "in-stock"}
                  onChange={() => setAvailability("in-stock")}
                />{" "}
                In stock
              </label>
              <label>
                <input
                  type="radio"
                  name="availability"
                  checked={availability === "out-of-stock"}
                  onChange={() => setAvailability("out-of-stock")}
                />{" "}
                Out of stock
              </label>
            </div>
          </details>
        </aside>

        <section id="collection-results" className={styles.results}>
          <div className={styles.mobileFilterBar}>
            <button type="button" onClick={() => setFiltersOpen(true)}>
              <span className={styles.filterIcon} aria-hidden="true" />
              Filter and sort
            </button>
            <strong>{data?.pagination.total ?? products.length} products</strong>
          </div>
          <div className={styles.toolbar}>
            <label>
              Sort by:
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>
            </label>
            <span>
              {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
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
            <p className={styles.empty}>No products on this page match these filters.</p>
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
          <nav className={styles.pagination} aria-label="Collection pages">
            {page > 1 ? (
              <a href={pageHref(page - 1)} onClick={(event) => navigate(event, page - 1)}>
                Previous
              </a>
            ) : (
              <span aria-disabled="true">Previous</span>
            )}
            {collectionPageNumbers(page, totalPages).map((number, index, numbers) => (
              <span key={number}>
                {index > 0 && number - numbers[index - 1] > 1 && (
                  <span aria-hidden="true"> ? </span>
                )}
                <a
                  href={pageHref(number)}
                  aria-label={`Page ${number}`}
                  aria-current={number === page ? "page" : undefined}
                  onClick={(event) => navigate(event, number)}
                >
                  {number}
                </a>
              </span>
            ))}
            {page < totalPages ? (
              <a href={pageHref(page + 1)} onClick={(event) => navigate(event, page + 1)}>
                Next
              </a>
            ) : (
              <span aria-disabled="true">Next</span>
            )}
          </nav>
          {/* <p aria-live="polite">
            Page {page} of {totalPages}. Filters and sorting apply to this page. 
          </p> */}
        </section>

        {lockedProductName && (
          <div
            className={styles.lockedModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="locked-product-title"
          >
            <button
              type="button"
              className={styles.lockedModalBackdrop}
              aria-label="Close"
              onClick={() => setLockedProductName(undefined)}
            />
            <div className={styles.lockedModalCard}>
              <button
                type="button"
                className={styles.lockedModalClose}
                aria-label="Close"
                onClick={() => setLockedProductName(undefined)}
              />
              <h2 id="locked-product-title">{lockedProductName}</h2>
              <p className={styles.lockedModalEyebrow}>This content is locked</p>
              <h3>
                Looking for Products?
                <br />A free nicotine vaping script unlocks your options
              </h3>
              <Link href="/intake-form" className={styles.applyFreeButton}>
                Apply Free
              </Link>
              <p className={styles.lockedModalContact}>
                Any questions? <Link href="/contact">Contact us.</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
