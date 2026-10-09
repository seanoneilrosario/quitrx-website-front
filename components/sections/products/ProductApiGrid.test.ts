import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductApiGrid from "./ProductApiGrid";

const state = vi.hoisted(() => ({
  account: { customer: null as null | { id: string }, loading: false },
  activeScript: false,
  query: vi.fn(),
}));
vi.mock("@/hooks/useAccountCustomer", () => ({ useAccountCustomer: () => state.account }));
vi.mock("@/lib/account/script-access", () => ({ hasActiveScript: () => state.activeScript }));
vi.mock("@tanstack/react-query", async (original) => ({
  ...(await original<object>()),
  useQuery: (...args: unknown[]) => state.query(...args),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/commerce/ProductImage", () => ({ default: () => null }));

beforeEach(() => {
  state.account = { customer: null, loading: false };
  state.activeScript = false;
  state.query.mockReset().mockReturnValue({ data: [], error: null, isLoading: false });
});

describe("product grid access and selection", () => {
  it("does not mount catalog queries while the account loads or access is locked", () => {
    state.account.loading = true;
    expect(renderToStaticMarkup(createElement(ProductApiGrid))).toContain("Loading products");
    state.account.loading = false;
    expect(renderToStaticMarkup(createElement(ProductApiGrid))).toContain("/account/login");
    state.account.customer = { id: "customer" };
    expect(renderToStaticMarkup(createElement(ProductApiGrid))).toContain("Apply Free");
    expect(state.query).not.toHaveBeenCalled();
  });

  it("shows selected collection cards even in product mode without querying the catalog", () => {
    state.account.customer = { id: "customer" };
    state.activeScript = true;
    const html = renderToStaticMarkup(
      createElement(ProductApiGrid, {
        displayMode: "products",
        productLimit: 1,
        collections: [
          { slug: "e-liquids", title: "E-liquids" },
          { slug: "pods", title: "Pods" },
        ],
      }),
    );
    expect(html).toContain("/collections/e-liquids");
    expect(html).not.toContain("/collections/pods");
    expect(state.query).not.toHaveBeenCalled();
  });

  it("supports the legacy single collection field", () => {
    state.account.customer = { id: "customer" };
    state.activeScript = true;
    expect(
      renderToStaticMarkup(createElement(ProductApiGrid, { collection: { slug: "legacy" } })),
    ).toContain("/collections/legacy");
    expect(state.query).not.toHaveBeenCalled();
  });

  it("supports custom internal and external collection-card links", () => {
    state.account.customer = { id: "customer" };
    state.activeScript = true;
    const html = renderToStaticMarkup(
      createElement(ProductApiGrid, {
        collections: [
          { title: "Starter Packs", link: "starter-packs" },
          { title: "Partner", link: "https://example.com", openInNewTab: true },
        ],
      }),
    );
    expect(html).toContain('href="/starter-packs"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it("renders API products and encodes their links when access is available", () => {
    state.account.customer = { id: "customer" };
    state.activeScript = true;
    state.query.mockReturnValue({
      data: [{ slug: "a b", name: "Bottle" }],
      isLoading: false,
      error: null,
    });
    expect(
      renderToStaticMarkup(createElement(ProductApiGrid, { displayMode: "products" })),
    ).toContain("/product/a%20b");
    expect(state.query.mock.calls[0][0].queryKey).toEqual(["api", "/api/quithero-products"]);
  });
});
