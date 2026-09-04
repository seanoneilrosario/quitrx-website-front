"use client";

import { useMemo, useState } from "react";
import type { QuitHeroProduct, QuitHeroVariant } from "@/lib/quithero";
import ProductCard from "./ProductCard";
import styles from "./collectionCatalog.module.css";

type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
const PAGE_SIZE = 50;

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

export default function CollectionCatalog({ products }: { products: QuitHeroProduct[] }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const priceCeiling = useMemo(() => Math.ceil(Math.max(...products.flatMap(variantPrices), 0)), [products]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const hasActiveFilters = Boolean(brands.length || sizes.length || colors.length || maxPrice !== null || availability !== "all");

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
      const inStock = product.variants?.some((variant) => (variant.inventory ?? 1) > 0) ?? true;
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
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        <div className={styles.productGrid}>
          {paginatedProducts.map((product, index) => <ProductCard product={product} key={product.id || product.slug || index} />)}
        </div>
        {!visibleProducts.length && <p className={styles.empty}>No products match these filters.</p>}
        {totalPages > 1 && <nav className={styles.pagination} aria-label="Product pages">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
        </nav>}
      </section>
    </div>
  );
}
