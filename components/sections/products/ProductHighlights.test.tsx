import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { collectionPageQuery, selectedHighlightsQuery } from "@/lib/catalog/catalog-queries";

const account = vi.hoisted(() => ({
  customer: undefined as { scriptActive: boolean } | undefined,
  loading: false,
}));
vi.mock("@/hooks/useAccountCustomer", () => ({ useAccountCustomer: () => account }));
vi.mock("@/components/commerce/ProductCard", () => ({
  default: ({ product, new_product }: { product: { name: string }; new_product?: boolean }) =>
    createElement("article", null, new_product ? "NEW " : "", product.name),
}));
import ProductHighlights from "./ProductHighlights";

afterEach(() => {
  account.customer = undefined;
});

it("renders individually selected API products without a collection", () => {
  account.customer = { scriptActive: true };
  const client = new QueryClient();
  client.setQueryData(selectedHighlightsQuery(["second", "first"]).queryKey, {
    products: [
      { id: "second", name: "Selected second" },
      { id: "first", name: "Selected first" },
    ],
  });
  try {
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProductHighlights, {
          highlightSource: "products",
          highlightProducts: [{ id: "second", new_product: true }, { id: "first" }],
        }),
      ),
    );
    expect(html).toContain("Selected second");
    expect(html).toContain("NEW Selected second");
    expect(html).not.toContain("NEW Selected first");
    expect(html.indexOf("Selected second")).toBeLessThan(html.indexOf("Selected first"));
  } finally {
    client.clear();
  }
});

function render() {
  const client = new QueryClient();
  client.setQueryData(collectionPageQuery("highlights", 1).queryKey, {
    collection: { name: "Highlights", slug: "highlights" },
    pagination: { page: 1, limit: 15, total: 5, totalPages: 1, hasNextPage: false },
    products: Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      name: `Highlight ${index}`,
    })),
  });
  try {
    return renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(ProductHighlights, {
          highlightCollection: { slug: "highlights" },
          productLimit: 3,
        }),
      ),
    );
  } finally {
    client.clear();
  }
}

it("uses the selected dashboard collection and limits displayed highlights", () => {
  account.customer = { scriptActive: true };
  const html = render();
  expect(html.match(/<article>/g)).toHaveLength(3);
  expect(html).toContain("Highlight 0");
  expect(html).not.toContain("Highlight 3");
});

it("keeps cached product highlights hidden without active script access", () => {
  const html = render();
  expect(html).toContain("This content is locked");
  expect(html).not.toContain("Highlight 0");
  account.customer = { scriptActive: false };
  expect(render()).not.toContain("Highlight 0");
});
