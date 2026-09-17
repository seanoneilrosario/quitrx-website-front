import { NextResponse } from "next/server";
import { getFastQuitHeroCollectionPage, getQuitHeroCollection, getQuitHeroProducts } from "@/lib/quithero";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get("prefetch") === "1") {
      await getQuitHeroProducts();
      return new NextResponse(null, {
        status: 204,
        headers: { "cache-control": "private, no-store" },
      });
    }

    const collectionSlug = searchParams.get("collectionPage")?.trim();
    if (collectionSlug) {
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
        return NextResponse.json({ error: "Invalid pagination parameters." }, { status: 400 });
      }
      return NextResponse.json(await getFastQuitHeroCollectionPage(collectionSlug, page, limit), {
        headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    const collectionSlugs = searchParams
      .getAll("collection")
      .map((slug) => slug.trim())
      .filter(Boolean);
    if (collectionSlugs.length) {
      const collections = await Promise.all(collectionSlugs.map(getQuitHeroCollection));
      if (collections.some((collection) => !collection)) {
        return NextResponse.json({ error: "One or more collections were not found." }, { status: 404 });
      }
      const products = collections.flatMap((collection) => collection?.products ?? []);
      const uniqueProducts = Array.from(
        new Map(products.map((product) => [product.id ?? product.slug, product])).values(),
      );
      return NextResponse.json(uniqueProducts);
    }
    return NextResponse.json(await getQuitHeroProducts());
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the product service." },
      { status: 502 },
    );
  }
}
