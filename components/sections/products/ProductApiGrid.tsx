"use client";

import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/account/script-access";
import { catalogListQuery } from "@/lib/catalog/catalog-queries";
import {
  collectionCardsFrom,
  productCardsFrom,
  selectedCollectionCards,
  type GridCollection,
} from "@/lib/catalog/grid-data";
import { CollectionGridCard, ProductGridCard } from "./GridCards";
import { ProductGridAccessNotice, ProductGridSkeleton } from "./GridFeedback";
import styles from "./product-api-grid.module.css";

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
  collection?: GridCollection;
  collections?: GridCollection[];
};

function CatalogGrid({ mode, limit }: { mode: "collections" | "products"; limit: number }) {
  const { data, error, isLoading } = useQuery(catalogListQuery(mode));
  const collections = mode === "collections" ? collectionCardsFrom(data) : [];
  const products = mode === "products" ? productCardsFrom(data) : [];
  const isEmpty = collections.length === 0 && products.length === 0;

  return (
    <div aria-busy={isLoading}>
      {isLoading && <ProductGridSkeleton count={Math.max(4, Math.min(limit, 8))} />}
      {error && <p className={styles.error}>{error.message}</p>}
      {!isLoading && !error && isEmpty && (
        <p className={styles.status}>No {mode} are currently available.</p>
      )}
      <div className={styles.grid}>
        {collections.slice(0, limit).map((collection) => (
          <CollectionGridCard key={collection.slug} collection={collection} />
        ))}
        {products.slice(0, limit).map((product) => (
          <ProductGridCard key={product.id} product={product} />
        ))}
      </div>
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
  const { customer, loading } = useAccountCustomer();
  const hasAccess = Boolean(customer) && hasActiveScript(customer);
  const availableCollections = Array.isArray(collections) ? collections : [];
  const selections = availableCollections.length
    ? availableCollections
    : collection
      ? [collection]
      : [];
  const sectionStyle = {
    "--desktop-padding-top": `${desktopPaddingTop ?? paddingTop}px`,
    "--desktop-padding-bottom": `${desktopPaddingBottom ?? paddingBottom}px`,
    "--mobile-padding-top": `${mobilePaddingTop}px`,
    "--mobile-padding-bottom": `${mobilePaddingBottom}px`,
  } as CSSProperties;

  function renderContent() {
    if (loading) return <ProductGridSkeleton count={Math.max(4, Math.min(productLimit, 8))} />;
    if (!hasAccess) return <ProductGridAccessNotice signedIn={Boolean(customer)} />;

    // Explicit CMS selections override the display mode and do not fetch a catalog list.
    if (selections.length) {
      return (
        <div className={styles.grid}>
          {selectedCollectionCards(selections.slice(0, productLimit)).map((item) => (
            <CollectionGridCard key={item.slug} collection={item} />
          ))}
        </div>
      );
    }
    // Mount the query only once account access is confirmed.
    return <CatalogGrid mode={displayMode} limit={productLimit} />;
  }

  return (
    <section
      className={styles.section}
      style={sectionStyle}
      aria-busy={loading}
      aria-label={loading ? "Loading products" : undefined}
    >
      <div className="page-width">
        {(loading || hasAccess) && heading && <h2 className={styles.heading}>{heading}</h2>}
        {renderContent()}
      </div>
    </section>
  );
}
