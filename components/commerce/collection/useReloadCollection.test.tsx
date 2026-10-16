// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, IsRestoringProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { collectionPageQuery } from "@/lib/catalog/catalog-queries";
import { useReloadCollection } from "./useReloadCollection";

let root: Root;
let client: QueryClient;
let container: HTMLDivElement;
const filters = { brandId: ["one"] };
function Harness() {
  useReloadCollection(true, "e-liquids", 2, filters);
  return null;
}
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/collections/e-liquids?page=2&brandId=one");
  vi.stubGlobal("performance", {
    getEntriesByType: () => [{ type: "reload", name: window.location.href }],
  });
  client = new QueryClient();
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  vi.unstubAllGlobals();
});
async function render(restoring = false) {
  await act(async () => {
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={client}>
          <IsRestoringProvider value={restoring}>
            <Harness />
          </IsRestoringProvider>
        </QueryClientProvider>
      </React.StrictMode>,
    );
  });
}

it("waits for restored cache, then refreshes once and replaces old images", async () => {
  const fresh = {
    collection: { name: "E-liquids", slug: "e-liquids" },
    pagination: { page: 2, limit: 15, total: 16, totalPages: 2, hasNextPage: false },
    products: [{ id: "one", images: [{ url: "/new.png" }] }],
  };
  const fetch = vi.fn().mockResolvedValue(Response.json(fresh));
  vi.stubGlobal("fetch", fetch);
  const key = collectionPageQuery("e-liquids", 2, filters).queryKey;
  client.setQueryData(key, { ...fresh, products: [{ id: "one", images: [{ url: "/old.png" }] }] });
  await render(true);
  expect(fetch).not.toHaveBeenCalled();
  await render(false);
  await vi.waitFor(() => expect(client.getQueryData(key)).toEqual(fresh));
  await render(false);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toContain("fresh=1");
});

it.each(["navigate", "back_forward"])("keeps normal caching for %s navigation", async (type) => {
  vi.stubGlobal("performance", { getEntriesByType: () => [{ type, name: window.location.href }] });
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await render();
  expect(fetch).not.toHaveBeenCalled();
});

it("does not refresh a different collection visited after the document reload", async () => {
  vi.stubGlobal("performance", {
    getEntriesByType: () => [{ type: "reload", name: "http://localhost/collections/other" }],
  });
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await render();
  expect(fetch).not.toHaveBeenCalled();
});
