"use client";

import { type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogListQuery } from "@/lib/catalog-queries";
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductApiGrid.module.css";
import ProductImage from "@/components/commerce/ProductImage";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/script-access";

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

function getCollections(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) return payload.filter(asRecord) as ApiRecord[];
  const record = asRecord(payload);
  const collections = record?.collections || record?.data || record?.items;
  return Array.isArray(collections) ? (collections.filter(asRecord) as ApiRecord[]) : [];
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
  if (!Array.isArray(variants)) return;
  const prices = variants.flatMap((variant) => {
    const value = asRecord(variant)?.price;
    if (typeof value !== "number" && typeof value !== "string") return [];
    if (typeof value === "string" && !value.trim()) return [];
    const price = typeof value === "number" ? value : Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(price) ? [price] : [];
  });
  if (!prices.length) return;
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return minimum === maximum ? formatter.format(minimum) : `${formatter.format(minimum)}–${formatter.format(maximum)}`;
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

function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonLine} />
        </div>
      ))}
    </div>
  );
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
  const { customer, loading: customerLoading } = useAccountCustomer();
  const authStatus = customerLoading
    ? "loading"
    : customer
      ? hasActiveScript(customer) ? "authenticated" : "missing-script"
      : "anonymous";
  const availableCollections = Array.isArray(collections) ? collections : [];
  const selectedCollections = availableCollections.length ? availableCollections : collection ? [collection] : [];
  // Explicit CMS selections are collection cards, regardless of legacy displayMode.
  const showingSelectedCollections = selectedCollections.length > 0;
  const selectedCollectionSlugs = selectedCollections
    .flatMap((item) => item.slug ? [item.slug] : []);
  const skeletonCount = Math.max(4, Math.min(productLimit, 8));

  const { data: payload, error: queryError, isLoading: loading } = useQuery({
    ...catalogListQuery(displayMode, selectedCollectionSlugs),
    enabled: authStatus === "authenticated" && !showingSelectedCollections,
  });
  const products = displayMode === "products" ? getProducts(payload) : [];
  const apiCollections = displayMode === "collections" ? getCollections(payload) : [];
  const error = queryError instanceof Error ? queryError.message : "";

  const sectionStyle = {
    "--desktop-padding-top": `${desktopPaddingTop ?? paddingTop}px`,
    "--desktop-padding-bottom": `${desktopPaddingBottom ?? paddingBottom}px`,
    "--mobile-padding-top": `${mobilePaddingTop}px`,
    "--mobile-padding-bottom": `${mobilePaddingBottom}px`,
  } as CSSProperties;

  if (authStatus === "loading") {
    return (
      <section className={styles.section} style={sectionStyle} aria-busy="true" aria-label="Loading products">
        <div className="page-width">
          {heading && <h2 className={styles.heading}>{heading}</h2>}
          <ProductGridSkeleton count={skeletonCount} />
        </div>
      </section>
    );
  }

  if (authStatus === "anonymous") {
    return (
      <section className={styles.section} style={sectionStyle}>
        <div className="page-width">
          <div className={styles.lockedCard}>
            <p className={styles.lockedEyebrow}>This content is locked</p>
            <h2>Looking for Products?<br />A free nicotine vaping script unlocks your options</h2>
            <Link href="/account/login" className={styles.loginButton}>Login</Link>
            <p className={styles.contact}>Any questions? <Link href="/contact">Contact us.</Link></p>
          </div>
        </div>
      </section>
    );
  }

  if (authStatus === "missing-script") {
    return (
      <section className={styles.section} style={sectionStyle}>
        <div className="page-width">
          <div className={styles.lockedCard}>
            <p className={styles.lockedEyebrow}>This content is locked</p>
            <h2>Looking for Products?<br />A free nicotine vaping script unlocks your options</h2>
            <Link href="https://quitrx-website-front-ecru.vercel.app/intake-form" className={styles.loginButton}>Apply Free</Link>
            <p className={styles.contact}>Any questions? <Link href="/contact">Contact us.</Link></p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} style={sectionStyle} aria-busy={!showingSelectedCollections && loading}>
      <div className="page-width">
        {heading && <h2 className={styles.heading}>{heading}</h2>}
        {!showingSelectedCollections && loading && <ProductGridSkeleton count={skeletonCount} />}
        {!showingSelectedCollections && error && <p className={styles.error}>{error}</p>}
        {!showingSelectedCollections && !loading && !error &&
          (displayMode === "collections" ? !apiCollections.length : !products.length) && (
          <p className={styles.status}>No {displayMode} are currently available.</p>
        )}

        <div className={styles.grid}>
          {showingSelectedCollections &&
            selectedCollections.slice(0, productLimit).map((item) => item.slug && (
              <Link href={`/collections/${item.slug}`} className={styles.card} key={item.slug}>
                <div className={styles.imageWrap}>
                  {item.image ? <Image src={item.image} width={600} height={600} sizes="(max-width: 767px) 50vw, 25vw" alt={item.title || "Collection"} className={styles.image} /> : <span className={styles.missingImageTitle}>{item.title || "Collection"}</span>}
                </div>
                <div className={styles.content}><h3>{item.title || "Collection"}</h3></div>
              </Link>
            ))}
          {displayMode === "collections" &&
            selectedCollections.length === 0 &&
            (apiCollections.length
              ? apiCollections.map((item) => [getText(item, ["slug"]) || "", item] as [string, ApiRecord])
              : getCollectionEntries(products)
            ).filter(([slug]) => slug).slice(0, productLimit).map(([slug, product]) => {
              const brand = asRecord(product.brand) || {};
              const isAll = slug === "all-products";
              const name = isAll ? "All Products" : getText(product, ["name", "title"]) || getText(brand, ["name"]) || "Collection";
              const image = isAll ? undefined : getText(product, ["image"]) || getText(brand, ["logo"]) || getImage(product);
              const embeddedProducts = product.products;
              const count = Array.isArray(embeddedProducts) ? embeddedProducts.length : isAll ? products.length : products.filter(
                (item) => getText(asRecord(item.brand) || {}, ["slug"]) === slug,
              ).length;

              return (
                <Link href={`/collections/${slug}`} className={styles.card} key={slug}>
                  <div className={styles.imageWrap}>
                    {image ? <Image src={image} width={600} height={600} sizes="(max-width: 767px) 50vw, 25vw" alt={name} className={styles.image} /> : <span className={styles.allTile}>ALL</span>}
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

            const productHandle = getText(product, ["handle", "slug"]);
            const card = (
              <>
                <div className={styles.imageWrap}>
                  <ProductImage src={image} width={600} height={600} sizes="(max-width: 767px) 50vw, 25vw" alt={name} className={styles.image} />
                </div>
                <div className={styles.content}>
                  <h3>{name}</h3>
                  {price && <p className={styles.price}>{price}</p>}
                </div>
              </>
            );

            return productHandle ? (
              <Link href={`/product/${encodeURIComponent(productHandle)}`} className={styles.card} key={id}>{card}</Link>
            ) : (
              <article className={styles.card} key={id}>{card}</article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
