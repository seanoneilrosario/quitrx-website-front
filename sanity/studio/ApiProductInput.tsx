"use client";

import { useEffect, useState } from "react";
import { set, setIfMissing, type ObjectInputProps } from "sanity";
import { SearchIcon, CheckmarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@sanity/icons";
import { ProductPicker } from "./ProductPickerStyles";

type Product = {
  id?: string;
  title?: string;
  slug?: string;
  new_product?: boolean;
  unavailableReason?: string;
};
export function ApiProductInput({
  value,
  onChange,
  readOnly,
  schemaType,
  elementProps,
}: ObjectInputProps<Product>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    products: Product[];
    hasNextPage: boolean;
    loading: boolean;
    error?: string;
  }>({ products: [], hasNextPage: false, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ products: [], hasNextPage: false, loading: true });
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search, page: String(page) });
        const response = await fetch(`/api/quithero-product-picker?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load products. Please try again.");
        const data = await response.json();
        if (!controller.signal.aborted) setResult({ ...data, loading: false });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            products: [],
            hasNextPage: false,
            loading: false,
            error: error instanceof Error ? error.message : "Unable to load products.",
          });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page, retry]);
  return (
    <ProductPicker>
      <div className="picker-header">
        <div>
          <h3>Choose a product</h3>
          <p className="picker-caption">Search the catalog and select a product to highlight.</p>
        </div>
        <span className="picker-badge">QuitHero catalog</span>
      </div>
      {value?.id && (
        <div className="picker-selected" role="status">
          <CheckmarkIcon aria-hidden />
          <div>
            <small>SELECTED PRODUCT</small>
            <strong>{value.title || value.id}</strong>
          </div>
        </div>
      )}
      {value?.id && (
        <label className="picker-toggle">
          <span>
            <strong>New product</strong>
            <small>Show a NEW badge on the top-right of this highlight.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={Boolean(value.new_product)}
            disabled={readOnly}
            onChange={(event) => onChange(set(event.target.checked, ["new_product"]))}
          />
        </label>
      )}
      <div className="picker-search">
        <SearchIcon aria-hidden />
        <input
          {...elementProps}
          type="search"
          aria-label="Search QuitHero products"
          placeholder="Search products…"
          value={search}
          disabled={readOnly}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        {search && (
          <button
            type="button"
            className="picker-clear"
            disabled={readOnly}
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="picker-meta">
        <span>{search ? "SEARCH RESULTS" : "BROWSE PRODUCTS"}</span>
        <span aria-live="polite">
          {result.loading
            ? "Searching…"
            : result.error
              ? "Unavailable"
              : `${result.products.length} on this page`}
        </span>
      </div>
      {result.loading ? (
        <div className="picker-state" role="status">
          <SearchIcon aria-hidden />
          <p>Finding products…</p>
          <p className="picker-caption">Your catalog will appear here.</p>
        </div>
      ) : result.error ? (
        <div className="picker-state" role="alert">
          <p>{result.error}</p>
          <button className="picker-button" type="button" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="picker-list" role="group" aria-label="Available products">
            {result.products.map((product) => (
              <button
                key={product.id}
                type="button"
                disabled={readOnly || Boolean(product.unavailableReason)}
                aria-pressed={value?.id === product.id}
                onClick={() =>
                  onChange([
                    setIfMissing({ _type: schemaType.name }),
                    set(product.id ?? "", ["id"]),
                    set(product.title ?? "", ["title"]),
                    set(product.slug ?? "", ["slug"]),
                  ])
                }
                className="picker-option"
              >
                <span className="picker-marker" aria-hidden>
                  {value?.id === product.id && <CheckmarkIcon />}
                </span>
                <span className="picker-product">
                  <strong>{product.title}</strong>
                  {product.slug && <small>{product.slug}</small>}
                  {product.unavailableReason && (
                    <small className="picker-unavailable">{product.unavailableReason}</small>
                  )}
                </span>
              </button>
            ))}
          </div>
          {!result.products.length && (
            <div className="picker-state">
              <SearchIcon aria-hidden />
              <p>No products found on this page</p>
              <p className="picker-caption">
                {search
                  ? "Try a different name or a shorter search."
                  : "Try the next page to see more products."}
              </p>
            </div>
          )}
        </>
      )}
      <nav className="picker-pagination" aria-label="Product search pages">
        <button
          className="picker-button"
          type="button"
          disabled={result.loading || page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeftIcon aria-hidden />
          Previous
        </button>
        <span>Page {page}</span>
        <button
          className="picker-button"
          type="button"
          disabled={result.loading || Boolean(result.error) || !result.hasNextPage}
          onClick={() => setPage(page + 1)}
        >
          Next
          <ChevronRightIcon aria-hidden />
        </button>
      </nav>
    </ProductPicker>
  );
}
