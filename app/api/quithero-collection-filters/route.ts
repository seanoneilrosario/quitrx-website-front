import { NextResponse } from "next/server";
import { quitHeroFetch } from "@/lib/quithero/client";

export async function GET(request: Request) {
  try {
    const searchParams =
      new URL(request.url).searchParams;

    const collectionSlug =
      searchParams.get("collection")?.trim();

    if (!collectionSlug) {
      return NextResponse.json(
        { error: "Collection is required." },
        { status: 400 },
      );
    }

    const isAllProducts =
      collectionSlug === "all-products";

    const backendParams =
      new URLSearchParams();

    searchParams.forEach((value, key) => {
      if (key === "collection") {
        return;
      }

      // The storefront URL uses brandId for both pages.
      // The Products API accepts multiple selections as brandIds.
      if (isAllProducts && key === "brandId") {
        backendParams.append("brandIds", value);
        return;
      }

      backendParams.append(key, value);
    });

    const query = backendParams.toString();

    const basePath = isAllProducts
      ? "/products/available-filters"
      : `/collections/${encodeURIComponent(
          collectionSlug,
        )}/available-filters`;

    const path = query
      ? `${basePath}?${query}`
      : basePath;

    const response = await quitHeroFetch(path);

    return NextResponse.json(response, {
      headers: {
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "[collection-available-filters] Failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load available filters.",
      },
      { status: 502 },
    );
  }
}