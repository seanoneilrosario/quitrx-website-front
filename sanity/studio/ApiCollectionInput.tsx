"use client";

import { useEffect, useState } from "react";
import { set, type ObjectInputProps } from "sanity";
import styled from "styled-components";
import type { QuitHeroCollection } from "@/lib/quithero/types";

type CollectionValue = {
  _type?: string;
  _key?: string;
  id?: string;
  title?: string;
  slug?: string;
  image?: string;
};

const Picker = styled.div`
  color: var(--card-fg-color);
  font: inherit;
  .collection-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .collection-caption {
    color: var(--card-muted-fg-color);
    font-size: 12px;
  }
  .collection-refresh {
    border: 1px solid var(--card-border-color);
    border-radius: 6px;
    padding: 7px 10px;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .collection-refresh:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .collection-search {
    box-sizing: border-box;
    width: 100%;
    padding: 13px 14px;
    border: 1px solid var(--card-border-color);
    border-radius: 8px;
    background: var(--card-bg-color);
    color: inherit;
    font: inherit;
  }
  .collection-search::placeholder {
    color: var(--card-muted-fg-color);
  }
  :is(input, button, a):focus-visible {
    outline: 2px solid var(--card-focus-ring-color, #748bff);
    outline-offset: 3px;
  }
  .collection-list {
    display: grid;
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
    margin: 12px 0;
    padding: 4px;
  }
  .collection-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border: 1px solid var(--card-border-color);
    border-radius: 8px;
    cursor: pointer;
    background: var(--card-bg-color);
  }
  .collection-option:hover {
    border-color: var(--card-muted-fg-color);
  }
  .collection-option[data-selected="true"] {
    border-color: var(--card-focus-ring-color, #748bff);
    background: color-mix(in srgb, var(--card-focus-ring-color, #748bff) 12%, var(--card-bg-color));
  }
  .collection-option:has(input:disabled) {
    cursor: default;
    opacity: 0.65;
  }
  .collection-option input {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: var(--card-focus-ring-color, #748bff);
  }
  .collection-details {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .collection-name {
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .collection-path {
    color: var(--card-muted-fg-color);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  .collection-status {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--card-muted-fg-color);
  }
  .collection-preview {
    display: block;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--card-border-color);
    color: inherit;
    font-size: 13px;
    text-underline-offset: 4px;
  }
`;

export function ApiCollectionInput(props: ObjectInputProps<CollectionValue>) {
  const { value, onChange, readOnly, elementProps } = props;
  const [request, setRequest] = useState(0);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<{
    collections: QuitHeroCollection[];
    error?: string;
    loading: boolean;
  }>({ collections: [], loading: true });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/quithero-collections", { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load collections. Please try again.");
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error("The collection list could not be read.");
        const collections = payload.filter(
          (item): item is QuitHeroCollection =>
            item !== null &&
            typeof item === "object" &&
            typeof item.slug === "string" &&
            item.slug.trim().length > 0,
        );
        if (!controller.signal.aborted) setResult({ collections, loading: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            collections: [],
            loading: false,
            error: error instanceof Error ? error.message : "Unable to load collections.",
          });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [request]);

  const selectedSlug = value?.slug ?? "";
  const missingSelection =
    selectedSlug && !result.collections.some((item) => item.slug === selectedSlug);
  const searchTerm = search.trim().toLowerCase();
  const filteredCollections = result.collections.filter((item) =>
    `${item.name ?? ""} ${item.slug ?? ""}`.toLowerCase().includes(searchTerm),
  );

  return (
    <Picker>
      <div className="collection-toolbar">
        <span className="collection-caption">
          {result.loading
            ? "Loading collections…"
            : `${result.collections.length} collections available`}
        </span>
        <button
          type="button"
          className="collection-refresh"
          disabled={result.loading}
          onClick={() => {
            setResult((previous) => ({ ...previous, loading: true, error: undefined }));
            setRequest((previous) => previous + 1);
          }}
        >
          {result.error ? "Try again" : "Refresh"}
        </button>
      </div>
      <input
        id={elementProps.id}
        className="collection-search"
        type="search"
        aria-label="Search collections"
        aria-describedby={`${elementProps.id}-status`}
        onFocus={elementProps.onFocus}
        onBlur={elementProps.onBlur}
        value={search}
        placeholder="Search collections by name…"
        onChange={(event) => setSearch(event.target.value)}
      />
      <div
        className="collection-list"
        role="group"
        aria-label="Choose a collection"
        aria-busy={result.loading}
      >
        {filteredCollections.map((item) => (
          <label
            className="collection-option"
            key={item.id || item.slug}
            data-selected={selectedSlug === item.slug}
          >
            <input
              type="radio"
              name={`${elementProps.id}-collection`}
              checked={selectedSlug === item.slug}
              disabled={readOnly || result.loading || Boolean(result.error)}
              onFocus={elementProps.onFocus}
              onBlur={elementProps.onBlur}
              onChange={() =>
                onChange(
                  set({
                    ...value,
                    _type: "apiCollection",
                    id: item.id ?? "",
                    slug: item.slug,
                    title: item.name || item.slug,
                    image: typeof item.image === "string" ? item.image : "",
                  }),
                )
              }
            />
            <span className="collection-details">
              <span className="collection-name">{item.name || item.slug}</span>
              <span className="collection-path">/collections/{item.slug}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="collection-status" id={`${elementProps.id}-status`} role="status">
        {result.loading
          ? "Loading collections…"
          : result.error
            ? result.error
            : !result.collections.length
              ? "No collections with a URL slug are available."
              : missingSelection
                ? "This saved collection is no longer in the API list. Choose another collection."
                : !filteredCollections.length
                  ? "No collections match your search. Try another name."
                  : selectedSlug
                    ? `${value?.title || selectedSlug} selected. Publish the page to show this collection card.`
                    : "Select a collection to add its card to the page."}
      </p>
      {selectedSlug && (
        <a
          className="collection-preview"
          href={`/collections/${encodeURIComponent(selectedSlug)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open collection page ↗
        </a>
      )}
    </Picker>
  );
}
