"use client";

import { useMemo, useState } from "react";
import type { QuitHeroProduct, QuitHeroVariant } from "@/lib/quithero";
import ProductCard from "./ProductCard";
import styles from "./collectionCatalog.module.css";

type Sort = "featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

function variantPrice(product: QuitHeroProduct) {
  const value = product.variants?.[0]?.price;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
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
  const priceCeiling = useMemo(() => Math.ceil(Math.max(...products.map(variantPrice), 0)), [products]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

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
        && (maxPrice === null || variantPrice(product) <= maxPrice)
        && (availability === "all" || (availability === "in-stock" ? inStock : !inStock));
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return variantPrice(a) - variantPrice(b);
      if (sort === "price-desc") return variantPrice(b) - variantPrice(a);
      if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });
  }, [availability, brands, colors, maxPrice, products, sizes, sort]);

  const toggle = (value: string, values: string[], setValues: (values: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const facet = (label: string, values: string[], selected: string[], setSelected: (values: string[]) => void) => values.length ? (
    <details className={styles.filterGroup} open>
      <summary>{label}</summary>
      <div className={styles.options}>
        {values.map((value) => (
          <label key={value}>
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value, selected, setSelected)} />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </details>
  ) : null;

  return (
    <div className={styles.catalog}>
      <aside className={styles.filters} aria-label="Product filters">
        <h2>Filter:</h2>
        {facet("Brand", facets.brands, brands, setBrands)}
        {facet("Product Size", facets.sizes, sizes, setSizes)}
        {facet("Color", facets.colors, colors, setColors)}
        {priceCeiling > 0 && (
          <details className={styles.filterGroup} open>
            <summary>Price</summary>
            <label className={styles.priceRange}>
              Up to {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(maxPrice ?? priceCeiling)}
              <input type="range" min="0" max={priceCeiling} value={maxPrice ?? priceCeiling} onChange={(event) => setMaxPrice(Number(event.target.value))} />
            </label>
          </details>
        )}
        <details className={styles.filterGroup} open>
          <summary>Availability</summary>
          <div className={styles.options}>
            <label><input type="radio" name="availability" checked={availability === "all"} onChange={() => setAvailability("all")} /> All</label>
            <label><input type="radio" name="availability" checked={availability === "in-stock"} onChange={() => setAvailability("in-stock")} /> In stock</label>
            <label><input type="radio" name="availability" checked={availability === "out-of-stock"} onChange={() => setAvailability("out-of-stock")} /> Out of stock</label>
          </div>
        </details>
      </aside>

      <section className={styles.results}>
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
          {visibleProducts.map((product, index) => <ProductCard product={product} key={product.id || product.slug || index} />)}
        </div>
        {!visibleProducts.length && <p className={styles.empty}>No products match these filters.</p>}
      </section>
    </div>
  );
}
