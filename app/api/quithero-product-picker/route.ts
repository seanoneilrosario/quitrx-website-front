import { quitHeroFetch } from "@/lib/quithero/client";
import type { QuitHeroProduct } from "@/lib/quithero/product-types";
import { filterShopProducts } from "@/lib/quithero/shop-visibility";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const search = (params.get("search") ?? "").trim();
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 || search.length > 200)
    return Response.json({ error: "Invalid search parameters." }, { status: 400 });
  try {
    const query = new URLSearchParams({ page: String(page), limit: "20", status: "active" });
    if (search) query.set("search", search);
    const payload = await quitHeroFetch<
      | QuitHeroProduct[]
      | {
          products?: QuitHeroProduct[];
          data?: QuitHeroProduct[];
          items?: QuitHeroProduct[];
          pagination?: { totalPages?: number };
        }
    >(`/products?${query}`);
    const products = Array.isArray(payload)
      ? payload
      : (payload.products ?? payload.data ?? payload.items);
    if (!Array.isArray(products)) throw new Error("Invalid product list.");
    const visibleIds = new Set((await filterShopProducts(products)).map((product) => product.id));
    return Response.json(
      {
        products: products
          .filter((product) => product.id)
          .map((product) => ({
            id: product.id,
            title: product.name || "Product",
            slug: product.slug ?? product.handle,
            unavailableReason: visibleIds.has(product.id)
              ? undefined
              : product.status?.toLowerCase() === "archived"
                ? "Archived product"
                : "Hidden from shop (NOTOSHOP). Remove this tag in the dashboard to feature this product.",
          })),
        hasNextPage: !Array.isArray(payload) && page < Number(payload.pagination?.totalPages ?? 1),
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "Unable to load products. Please try again." }, { status: 502 });
  }
}
