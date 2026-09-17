"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { QuitHeroProduct, QuitHeroVariant } from "@/lib/quithero";
import { variantIsAvailable } from "@/lib/quithero-bundle";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";
import ProductCard from "./ProductCard";
import { CollectionProductSkeletons } from "./CollectionLoading";
import styles from "./collectionCatalog.module.css";
import storeStyles from "@/app/store.module.css";

type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
const PAGE_SIZE = 10;

type CollectionPageResponse = {
  collection: { name: string; slug: string; description?: string };
  products: QuitHeroProduct[];
  pagination: { page: number; limit: number; totalPages: number; hasNextPage: boolean };
};

function variantPrices(product: QuitHeroProduct) {
  return (product.variants ?? []).flatMap((variant) => {
    if (variant.price === undefined || variant.price === null || variant.price === "") return [];
    const parsed = typeof variant.price === "number" ? variant.price : Number(variant.price.replace(/[^0-9.-]/g, ""));
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

export default function CollectionCatalog({ collectionSlug }: { collectionSlug: string }) {
  const { customer } = useAccountCustomer();
  const productsLocked = !hasActiveScript(customer);
  const [products, setProducts] = useState<QuitHeroProduct[]>([]);
  const [collection, setCollection] = useState({ name: collectionSlug.replaceAll("-", " "), description: "" });
  const [currentApiPage, setCurrentApiPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lockedProductName, setLockedProductName] = useState<string>();
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const requestInFlightRef = useRef(true);
  const priceCeiling = useMemo(() => Math.ceil(Math.max(...products.flatMap(variantPrices), 0)), [products]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const hasActiveFilters = Boolean(brands.length || sizes.length || colors.length || maxPrice !== null || availability !== "all");

  const loadProductsPage = useCallback(async (page: number, append: boolean, signal?: AbortSignal) => {
    const query = new URLSearchParams({ collectionPage: collectionSlug, page: String(page), limit: String(PAGE_SIZE) });
    const requestUrl = `/api/quithero-products?${query}`;
    console.groupCollapsed(`[Collection] Request page ${page}: ${collectionSlug}`);
    console.log("Collection being loaded:", collectionSlug);
    console.log("API request URL:", requestUrl);
    console.log("Query params being sent:", Object.fromEntries(query.entries()));
    console.log("Current page:", page);
    console.log("Pagination limit:", PAGE_SIZE);
    console.groupEnd();

    const response = await fetch(requestUrl, { cache: "no-store", signal });
    const payload = await response.json() as CollectionPageResponse & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Unable to load products.");
    console.groupCollapsed(`[Collection] Response page ${page}: ${collectionSlug}`);
    console.log("Raw products returned by the API:", payload.products);
    console.log("Number of products returned per request:", payload.products.length);
    console.log("Pagination response:", payload.pagination);
    console.groupEnd();

    setCollection({ name: payload.collection.name, description: payload.collection.description ?? "" });
    setProducts((existing) => {
      const combined = append ? [...existing, ...payload.products] : payload.products;
      const uniqueProducts = Array.from(new Map(combined.map((product) => [product.id ?? product.slug, product])).values());
      console.log("Final products loaded in the collection:", uniqueProducts);
      return uniqueProducts;
    });
    setCurrentApiPage(payload.pagination.page);
    const hasMoreMatchingProducts = payload.pagination.hasNextPage && payload.products.length > 0;
    setHasNextPage(hasMoreMatchingProducts);
    if (append && !payload.products.length) {
      console.log(`[Collection] No more matching products for ${collectionSlug}; hiding Load more.`);
    }
  }, [collectionSlug]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      loadProductsPage(1, false, controller.signal)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            console.error(`[Collection] Failed to load ${collectionSlug}:`, error);
            setProductsError(error instanceof Error ? error.message : "Unable to load products.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            requestInFlightRef.current = false;
            setProductsLoading(false);
          }
        });
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [collectionSlug, loadProductsPage]);

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
    setBrands([]);
    setSizes([]);
    setColors([]);
    setMaxPrice(null);
    setAvailability("all");
  };

  const facets = useMemo(() => ({
    brands: unique(products.map((product) => product.brand?.name)),
    sizes: unique(products.flatMap((product) => product.variants?.map((variant) => optionValues(variant, "size")) ?? [])),
    colors: unique(products.flatMap((product) => product.variants?.map((variant) => optionValues(variant, "color")) ?? [])),
  }), [products]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const inStock = product.variants?.some(variantIsAvailable) ?? true;
      const variantSizes = product.variants?.map((variant) => optionValues(variant, "size"));
      const variantColors = product.variants?.map((variant) => optionValues(variant, "color"));
      return (!brands.length || brands.includes(product.brand?.name || ""))
        && (!sizes.length || sizes.some((size) => variantSizes?.includes(size)))
        && (!colors.length || colors.some((color) => variantColors?.includes(color)))
        && (maxPrice === null || variantPrices(product).some((price) => price <= maxPrice))
        && (availability === "all" || (availability === "in-stock" ? inStock : !inStock));
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return minimumVariantPrice(a) - minimumVariantPrice(b);
      if (sort === "price-desc") return minimumVariantPrice(b) - minimumVariantPrice(a);
      if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });
  }, [availability, brands, colors, maxPrice, products, sizes, sort]);
  useEffect(() => {
    console.log(`[Collection] Final products displayed for ${collectionSlug}:`, visibleProducts);
  }, [collectionSlug, visibleProducts]);

  const loadMore = useCallback(async () => {
    if (requestInFlightRef.current || productsLoading || !hasNextPage) return;
    requestInFlightRef.current = true;
    setProductsLoading(true);
    setProductsError("");
    try {
      await loadProductsPage(currentApiPage + 1, true);
    } catch (error) {
      console.error(`[Collection] Failed to load page ${currentApiPage + 1}:`, error);
      setProductsError(error instanceof Error ? error.message : "Unable to load products.");
    } finally {
      requestInFlightRef.current = false;
      setProductsLoading(false);
    }
  }, [currentApiPage, hasNextPage, loadProductsPage, productsLoading]);

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || productsLoading || !hasNextPage) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "400px 0px" });

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasNextPage, loadMore, productsLoading]);

  const toggle = (value: string, values: string[], setValues: (values: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const facet = (
    label: string,
    values: string[],
    selected: string[],
    setSelected: (values: string[]) => void,
    count: (value: string) => number,
    open = false,
  ) => values.length ? (
    <details className={styles.filterGroup} {...(open && !filtersOpen ? { open: true } : {})}>
      <summary>{label}</summary>
      <div className={styles.options}>
        {values.map((value) => (
          <label key={value}>
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value, selected, setSelected)} />
            <span>{value} ({count(value)})</span>
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
      <aside className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`} aria-label="Product filters">
        <div className={styles.drawerHeader}>
          <div><strong>Filter and sort</strong><span>{products.length} products</span></div>
          <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><span /></button>
        </div>
        <div className={styles.filtersHeader}>
          <h2>Filter:</h2>
          {hasActiveFilters && <button type="button" onClick={clearFilters}>Remove all</button>}
        </div>
        {facet("Brand", facets.brands, brands, setBrands, (brand) => products.filter((product) => product.brand?.name === brand).length, true)}
        {facet("Product Size", facets.sizes, sizes, setSizes, (size) => products.filter((product) => product.variants?.some((variant) => optionValues(variant, "size") === size)).length)}
        {facet("Color", facets.colors, colors, setColors, (color) => products.filter((product) => product.variants?.some((variant) => optionValues(variant, "color") === color)).length)}
        {priceCeiling > 0 && (
          <details className={styles.filterGroup}>
            <summary>Price</summary>
            <label className={styles.priceRange}>
              Up to {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(maxPrice ?? priceCeiling)}
              <input type="range" min="0" max={priceCeiling} value={maxPrice ?? priceCeiling} onChange={(event) => setMaxPrice(Number(event.target.value))} />
            </label>
          </details>
        )}
        <details className={styles.filterGroup}>
          <summary>Availability</summary>
          <div className={styles.options}>
            <label><input type="radio" name="availability" checked={availability === "all"} onChange={() => setAvailability("all")} /> All</label>
            <label><input type="radio" name="availability" checked={availability === "in-stock"} onChange={() => setAvailability("in-stock")} /> In stock</label>
            <label><input type="radio" name="availability" checked={availability === "out-of-stock"} onChange={() => setAvailability("out-of-stock")} /> Out of stock</label>
          </div>
        </details>
      </aside>

      <section className={styles.results}>
        <div className={styles.mobileFilterBar}>
          <button type="button" onClick={() => setFiltersOpen(true)}>
            <span className={styles.filterIcon} aria-hidden="true" />
            Filter and sort
          </button>
          <strong>{products.length} products</strong>
        </div>
        <div className={styles.toolbar}>
          <label>Sort by:
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
            </select>
          </label>
          <span>{visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}</span>
        </div>
        <div className={styles.productGrid} aria-busy={productsLoading && !products.length}>
          {productsLoading && !products.length ? <CollectionProductSkeletons /> : visibleProducts.map((product, index) => (
            <ProductCard
              product={product}
              locked={productsLocked}
              onLockedClick={() => setLockedProductName(product.name || "Product")}
              key={product.id || product.slug || index}
            />
          ))}
        </div>
        {!productsLoading && !visibleProducts.length && <p className={styles.empty}>No products match these filters.</p>}
        {productsError && <p className={styles.empty} role="alert">{productsError}</p>}
        {(hasNextPage || productsLoading) && <div ref={loadMoreTriggerRef} className={styles.pagination} aria-live="polite">
          {productsLoading && <span>Loading...</span>}
          <span>{products.length} product{products.length === 1 ? "" : "s"} loaded</span>
        </div>}
      </section>

      {lockedProductName && (
        <div className={styles.lockedModal} role="dialog" aria-modal="true" aria-labelledby="locked-product-title">
          <button type="button" className={styles.lockedModalBackdrop} aria-label="Close" onClick={() => setLockedProductName(undefined)} />
          <div className={styles.lockedModalCard}>
            <button type="button" className={styles.lockedModalClose} aria-label="Close" onClick={() => setLockedProductName(undefined)} />
            <h2 id="locked-product-title">{lockedProductName}</h2>
            <p className={styles.lockedModalEyebrow}>This content is locked</p>
            <h3>Looking for Products?<br />A free nicotine vaping script unlocks your options</h3>
            <Link href="/intake-form" className={styles.applyFreeButton}>Apply Free</Link>
            <p className={styles.lockedModalContact}>Any questions? <Link href="/contact">Contact us.</Link></p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
