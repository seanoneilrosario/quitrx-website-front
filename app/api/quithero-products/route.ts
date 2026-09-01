import { NextResponse } from "next/server";
import { getQuitHeroCollection, getQuitHeroProducts } from "@/lib/quithero";

export async function GET(request: Request) {
  try {
    const collectionSlugs = new URL(request.url).searchParams
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
