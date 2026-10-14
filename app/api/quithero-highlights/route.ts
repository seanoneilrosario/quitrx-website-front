import { getQuitHeroProductById } from "@/lib/quithero/products";
import { filterShopProducts } from "@/lib/quithero/shop-visibility";
import { toCollectionProduct } from "@/lib/catalog/collection-product";
import type { QuitHeroProduct } from "@/lib/quithero/product-types";

export async function GET(request: Request) {
  const ids = [...new Set(new URL(request.url).searchParams.getAll("productId"))];
  if (!ids.length || ids.length > 15 || ids.some((id) => !id.trim() || id.length > 200))
    return Response.json({ error: "Select between 1 and 15 products." }, { status: 400 });
  try {
    const products: QuitHeroProduct[] = [];
    // Reuse cached details and load sequentially to avoid a burst of API calls.
    for (const id of ids) {
      try {
        products.push(await getQuitHeroProductById(id));
      } catch (error) {
        if (!(error instanceof Error && /\b404\b/.test(error.message))) throw error;
      }
    }
    return Response.json(
      { products: (await filterShopProducts(products)).map(toCollectionProduct) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Unable to load product highlights. Please try again." },
      { status: 502 },
    );
  }
}
