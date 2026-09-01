import { NextResponse } from "next/server";
import { getQuitHeroCollection, getQuitHeroProducts } from "@/lib/quithero";

export async function GET(request: Request) {
  try {
    const collectionSlug = new URL(request.url).searchParams.get("collection")?.trim();
    if (collectionSlug) {
      const collection = await getQuitHeroCollection(collectionSlug);
      if (!collection) {
        return NextResponse.json({ error: "Collection not found." }, { status: 404 });
      }
      return NextResponse.json(collection.products);
    }
    return NextResponse.json(await getQuitHeroProducts());
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the product service." },
      { status: 502 },
    );
  }
}
