"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./ProductApiGrid.module.css";

type ApiRecord = Record<string, unknown>;

type ProductApiGridProps = {
  heading?: string;
  productLimit?: number;
  paddingTop?: number;
  paddingBottom?: number;
  displayMode?: "collections" | "products";
};

function asRecord(value: unknown): ApiRecord | undefined {
  return value && typeof value === "object" ? (value as ApiRecord) : undefined;
}

function getProducts(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) return payload.filter(asRecord) as ApiRecord[];

  const record = asRecord(payload);
  const collection = record?.products || record?.data || record?.items;
  return Array.isArray(collection) ? (collection.filter(asRecord) as ApiRecord[]) : [];
}

function getText(product: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === "string" && value) return value;
  }
}

function getImage(product: ApiRecord) {
  const direct = getText(product, ["imageUrl", "image_url", "thumbnail", "image"]);
  if (direct) return direct;

  const images = product.images;
  if (!Array.isArray(images) || !images.length) return;
  if (typeof images[0] === "string") return images[0];
  return getText(asRecord(images[0]) || {}, ["url", "src", "imageUrl"]);
}

function getPrice(product: ApiRecord) {
  const variants = product.variants;
  const firstVariant = Array.isArray(variants) ? asRecord(variants[0]) : undefined;
  const value = product.price ?? product.retailPrice ?? product.retail_price ?? firstVariant?.price;
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
  }
  return typeof value === "string" ? value : undefined;
}

function getCollectionEntries(products: ApiRecord[]): Array<[string, ApiRecord]> {
  const entries = Array.from(
    products.reduce((collections, product) => {
      const brand = asRecord(product.brand);
      const slug = getText(brand || {}, ["slug"]);
      if (slug && !collections.has(slug)) collections.set(slug, product);
      return collections;
    }, new Map<string, ApiRecord>()),
  );

  return products.length ? [["all-products", products[0]], ...entries] : entries;
}

export default function ProductApiGrid({
  heading = "Products",
  productLimit = 12,
  paddingTop = 60,
  paddingBottom = 60,
  displayMode = "collections",
}: ProductApiGridProps) {
  const [products, setProducts] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/quithero-products", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message = getText(asRecord(payload) || {}, ["error"]);
          throw new Error(message || "Unable to load products.");
        }
        setProducts(getProducts(payload));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load products.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <section className={styles.section} style={{ paddingTop, paddingBottom }}>
      <div className="page-width">
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {loading && <p className={styles.status}>Loading products…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !error && !products.length && (
          <p className={styles.status}>No products are currently available.</p>
        )}

        <div className={styles.grid}>
          {displayMode === "collections" &&
            getCollectionEntries(products).slice(0, productLimit).map(([slug, product]) => {
              const brand = asRecord(product.brand) || {};
              const isAll = slug === "all-products";
              const name = isAll ? "All Products" : getText(brand, ["name"]) || "Collection";
              const image = isAll ? undefined : getText(brand, ["logo"]) || getImage(product);
              const count = isAll ? products.length : products.filter(
                (item) => getText(asRecord(item.brand) || {}, ["slug"]) === slug,
              ).length;

              return (
                <Link href={`/collections/${slug}`} className={styles.card} key={slug}>
                  <div className={styles.imageWrap}>
                    {image ? <img src={image} alt={name} className={styles.image} /> : <span className={styles.allTile}>ALL</span>}
                  </div>
                  <div className={styles.content}>
                    <h3>{name}</h3>
                    <p className={styles.count}>{count} product{count === 1 ? "" : "s"}</p>
                  </div>
                </Link>
              );
            })}

          {displayMode === "products" && products.slice(0, productLimit).map((product, index) => {
            const name = getText(product, ["name", "title", "productName"]) || "Product";
            const image = getImage(product);
            const price = getPrice(product);
            const id = getText(product, ["id", "_id", "sku"]) || `${name}-${index}`;

            const productId = getText(product, ["id", "_id"]);
            const slug = getText(product, ["slug"]);
            const card = (
              <>
                <div className={styles.imageWrap}>
                  {image ? <img src={image} alt={name} className={styles.image} /> : null}
                </div>
                <div className={styles.content}>
                  <h3>{name}</h3>
                  {price && <p className={styles.price}>{price}</p>}
                </div>
              </>
            );

            return productId || slug ? (
              <Link href={productId ? `/product/${encodeURIComponent(productId)}` : `/products/${slug}`} className={styles.card} key={id}>{card}</Link>
            ) : (
              <article className={styles.card} key={id}>{card}</article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
