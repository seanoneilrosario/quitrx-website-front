// @vitest-environment jsdom
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  collectionPageQuery,
  collectionAvailableFiltersQuery,
  type CollectionPageResponse,
} from "@/lib/catalog/catalog-queries";
import { useCollectionData } from "./useCollectionData";
import { useCollectionFilters } from "./useCollectionFilters";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const initialPage: CollectionPageResponse = {
  collection: { name: "All Products", slug: "all-products" },
  products: [{ id: "server", name: "Server product" }],
  pagination: { page: 1, limit: 15, total: 1, totalPages: 1, hasNextPage: false },
};
function Harness() {
  const filters = useCollectionFilters();
  const result = useCollectionData("all-products", initialPage, filters);
  return (
    <>
      <h1>{result.collection.name}</h1>
      <div>{result.productsLoading ? "Loading" : result.products.map((p) => p.name).join(",")}</div>
      <aside>{result.storefrontFilters.map((f) => f.label).join(",")}</aside>
    </>
  );
}
let root: Root | undefined;
let container: HTMLDivElement;
let clients: QueryClient[];
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
  container = document.createElement("div");
  document.body.append(container);
  clients = [];
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  clients.forEach((client) => client.clear());
  container.remove();
  vi.unstubAllGlobals();
});

it.each([false, true])(
  "hydrates with different browser cache data (filtered=%s)",
  async (filtered) => {
    window.history.replaceState(
      null,
      "",
      filtered ? "/collections/all-products?brandId=one" : "/collections/all-products",
    );
    const server = new QueryClient();
    const browser = new QueryClient();
    clients.push(server, browser);
    const filters = {
      sort: "MANUAL" as const,
      brandId: filtered ? ["one"] : [],
      productTypeId: [],
      status: [],
      sourceSystem: [],
      tags: [],
      attributeFilters: [],
      minPrice: undefined,
      maxPrice: undefined,
    };
    browser.setQueryData(collectionPageQuery("all-products", 1, filters).queryKey, {
      ...initialPage,
      products: [{ id: "browser", name: "Cached product" }],
    });
    browser.setQueryData(collectionAvailableFiltersQuery("all-products", filters).queryKey, {
      data: {
        collection: { id: "all", name: "All Products", slug: "all-products" },
        filters: [{ key: "brand", type: "BRAND", label: "Brand" }],
      },
    });
    container.innerHTML = renderToString(
      <QueryClientProvider client={server}>
        <Harness />
      </QueryClientProvider>,
    );
    expect(container.querySelector("h1")?.textContent).toBe("All Products");
    expect(container.textContent).toContain(filtered ? "Loading" : "Server product");
    expect(container.textContent).not.toContain("Cached product");
    const onRecoverableError = vi.fn();
    await act(async () => {
      root = hydrateRoot(
        container,
        <QueryClientProvider client={browser}>
          <Harness />
        </QueryClientProvider>,
        { onRecoverableError },
      );
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Cached product");
    expect(container.querySelector("aside")?.textContent).toBe("Brand");
  },
);
