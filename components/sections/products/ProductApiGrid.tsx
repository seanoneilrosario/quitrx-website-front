"use client";

import { useEffect, useState } from "react";
import styles from "./ProductApiGrid.module.css";

type ApiRecord = Record<string, unknown>;

type ProductApiGridProps = {
  heading?: string;
  productLimit?: number;
  paddingTop?: number;
  paddingBottom?: number;
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

export default function ProductApiGrid({
  heading = "Products",
  productLimit = 12,
  paddingTop = 60,
  paddingBottom = 60,
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
        setProducts(getProducts(payload).slice(0, productLimit));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load products.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [productLimit]);

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
          {products.map((product, index) => {
            const name = getText(product, ["name", "title", "productName"]) || "Product";
            const image = getImage(product);
            const price = getPrice(product);
            const id = getText(product, ["id", "_id", "sku"]) || `${name}-${index}`;

            return (
              <article className={styles.card} key={id}>
                <div className={styles.imageWrap}>
                  {image ? <img src={image} alt={name} className={styles.image} /> : null}
                </div>
                <div className={styles.content}>
                  <h3>{name}</h3>
                  {price && <p className={styles.price}>{price}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
