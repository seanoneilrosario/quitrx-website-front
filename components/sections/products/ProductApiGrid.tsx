"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import styles from "./ProductApiGrid.module.css";

type ApiRecord = Record<string, unknown>;

type ProductApiGridProps = {
  heading?: string;
  productLimit?: number;
  paddingTop?: number;
  paddingBottom?: number;
  desktopPaddingTop?: number;
  desktopPaddingBottom?: number;
  mobilePaddingTop?: number;
  mobilePaddingBottom?: number;
  displayMode?: "collections" | "products";
  collection?: { title?: string; slug?: string; image?: string };
  collections?: Array<{ title?: string; slug?: string; image?: string }>;
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
  desktopPaddingTop,
  desktopPaddingBottom,
  mobilePaddingTop = 40,
  mobilePaddingBottom = 40,
  displayMode = "collections",
  collection,
  collections = [],
}: ProductApiGridProps) {
  const [products, setProducts] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const availableCollections = Array.isArray(collections) ? collections : [];
  const selectedCollections = availableCollections.length ? availableCollections : collection ? [collection] : [];
  const showingSelectedCollections = selectedCollections.length > 0;
  const selectedCollectionSlugs = selectedCollections
    .flatMap((item) => item.slug ? [item.slug] : []);
  const collectionQuery = selectedCollectionSlugs.length
    ? `?${selectedCollectionSlugs.map((slug) => `collection=${encodeURIComponent(slug)}`).join("&")}`
    : "";

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/quithero-products${collectionQuery}`, { signal: controller.signal })
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
  }, [collectionQuery]);

  const sectionStyle = {
    "--desktop-padding-top": `${desktopPaddingTop ?? paddingTop}px`,
    "--desktop-padding-bottom": `${desktopPaddingBottom ?? paddingBottom}px`,
    "--mobile-padding-top": `${mobilePaddingTop}px`,
    "--mobile-padding-bottom": `${mobilePaddingBottom}px`,
  } as CSSProperties;

  return (
    <section className={styles.section} style={sectionStyle}>
      <div className="page-width">
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {!showingSelectedCollections && loading && <p className={styles.status}>Loading products…</p>}
        {!showingSelectedCollections && error && <p className={styles.error}>{error}</p>}
        {!showingSelectedCollections && !loading && !error && !products.length && (
          <p className={styles.status}>No products are currently available.</p>
        )}

        <div className={styles.grid}>
          {showingSelectedCollections &&
            selectedCollections.slice(0, productLimit).map((item) => item.slug && (
              <Link href={`/collections/${item.slug}`} className={styles.card} key={item.slug}>
                <div className={styles.imageWrap}>
                  {item.image ? <img src={item.image} alt={item.title || "Collection"} className={styles.image} /> : <span className={styles.allTile}>{(item.title || "Collection").slice(0, 1)}</span>}
                </div>
                <div className={styles.content}><h3>{item.title || "Collection"}</h3></div>
              </Link>
            ))}
          {displayMode === "collections" &&
            selectedCollections.length === 0 &&
            getCollectionEntries(products).slice(0, productLimit).map(([slug, product]) => {
              const brand = asRecord(product.brand) || {};
              const isAll = slug === "all-products";
              const name = isAll ? "All Products" : getText(brand, ["name"]) || "Collection";
              const image = isAll ?  undefined : getText(brand, ["logo"]) || getImage(product);
              const count = isAll ? products.length : products.filter(
                (item) => getText(asRecord(item.brand) || {}, ["slug"]) === slug,
              ).length;

              return (
                <Link href={`/collections/${slug}`} className={styles.card} key={slug}>
                  <div className={styles.imageWrap}>
                    {image ? <img src={image} alt={name} className={styles.image} loading="eager" /> : <span className={styles.allTile}>ALL</span>}
                  </div>
                  <div className={styles.content}>
                    <h3>{name}</h3>
                    <p className={styles.count}>{count} product{count === 1 ? "" : "s"}</p>
                  </div>
                </Link>
              );
            })}

          {displayMode === "products" && !showingSelectedCollections && products.slice(0, productLimit).map((product, index) => {
            const name = getText(product, ["name", "title", "productName"]) || "Product";
            const image = getImage(product);
            const price = getPrice(product);
            const id = getText(product, ["id", "_id", "sku"]) || `${name}-${index}`;

            const productId = getText(product, ["id", "_id"]);
            const slug = getText(product, ["slug"]);
            const card = (
              <>
                <div className={styles.imageWrap}>
                  {image ? <img src={image} alt={name} className={styles.image} loading="eager" /> : null}
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
