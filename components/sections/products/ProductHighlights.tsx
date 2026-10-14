"use client";

import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { hasActiveScript } from "@/lib/account/script-access";
import { collectionPageQuery, selectedHighlightsQuery } from "@/lib/catalog/catalog-queries";
import ProductCard from "@/components/commerce/ProductCard";
import { ProductGridAccessNotice, ProductGridSkeleton } from "./GridFeedback";
import type { GridCollection } from "@/lib/catalog/grid-data";
import styles from "./product-highlights.module.css";

type Props = {
  highlightSource?: "products" | "collection";
  highlightProducts?: { id?: string; title?: string; slug?: string; new_product?: boolean }[];
  heading?: string;
  highlightCollection?: GridCollection;
  productLimit?: number;
  showBottomBorder?: boolean;
  desktopPaddingTop?: number;
  desktopPaddingBottom?: number;
  mobilePaddingTop?: number;
  mobilePaddingBottom?: number;
};

export default function ProductHighlights({
  highlightSource = "collection",
  highlightProducts = [],
  heading = "Product highlights",
  highlightCollection,
  productLimit = 3,
  showBottomBorder = true,
  desktopPaddingTop = 32,
  desktopPaddingBottom = 32,
  mobilePaddingTop = 24,
  mobilePaddingBottom = 24,
}: Props) {
  const { customer, loading } = useAccountCustomer();
  const hasAccess = Boolean(customer) && hasActiveScript(customer);
  const slug = highlightCollection?.slug;
  const individual = highlightSource === "products";
  const ids = highlightProducts.flatMap((product) => (product.id ? [product.id] : []));
  const collectionQuery = useQuery({
    ...collectionPageQuery(slug ?? "", 1),
    enabled: !loading && hasAccess && !individual && Boolean(slug),
  });
  const selectedQuery = useQuery({
    ...selectedHighlightsQuery(ids),
    enabled: !loading && hasAccess && individual && ids.length > 0,
  });
  const { data, error, isPending, refetch } = individual ? selectedQuery : collectionQuery;
  const limit = Math.max(1, Math.min(15, productLimit));
  const style = {
    "--desktop-padding-top": `${desktopPaddingTop}px`,
    "--desktop-padding-bottom": `${desktopPaddingBottom}px`,
    "--mobile-padding-top": `${mobilePaddingTop}px`,
    "--mobile-padding-bottom": `${mobilePaddingBottom}px`,
  } as CSSProperties;

  if (individual ? !ids.length : !slug) return null;

  return (
    <section className={styles.section} style={style}>
      <div className="page-width">
        <div className={showBottomBorder ? styles.divider : undefined}>
          {(loading || hasAccess) && heading && <h2 className={styles.heading}>{heading}</h2>}
          {loading ? (
            <ProductGridSkeleton count={limit} />
          ) : !hasAccess ? (
            <ProductGridAccessNotice signedIn={Boolean(customer)} />
          ) : isPending ? (
            <ProductGridSkeleton count={limit} />
          ) : error ? (
            <div role="alert">
              <p>Unable to load product highlights.</p>
              <button type="button" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {data?.products.slice(0, limit).map((product) => (
                  <ProductCard
                    compact
                    key={product.id ?? product.slug}
                    product={product}
                    new_product={
                      individual &&
                      highlightProducts.some(
                        (selection) => selection.id === product.id && selection.new_product,
                      )
                    }
                  />
                ))}
              </div>
              {!data?.products.length && <p>No highlights are currently available.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
