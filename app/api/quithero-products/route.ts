import { NextResponse } from "next/server";
import { COLLECTION_PAGE_SIZE } from "@/lib/catalog/catalog-pagination";
import {
  getFastQuitHeroCollectionPage,
  getQuitHeroCollectionPage,
  getQuitHeroCollection,
  getQuitHeroProducts,
} from "@/lib/quithero";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("prefetch") === "1") {
      await getQuitHeroProducts();

      return new NextResponse(null, {
        status: 204,
        headers: {
          "cache-control": "private, no-store",
        },
      });
    }

    const collectionSlug =
      searchParams.get("collectionPage")?.trim();

    if (collectionSlug) {
      const page = Number(
        searchParams.get("page") ?? 1,
      );

      const limit = Number(
        searchParams.get("limit") ?? COLLECTION_PAGE_SIZE,
      );

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1
      ) {
        return NextResponse.json(
          {
            error: "Invalid pagination parameters.",
          },
          { status: 400 },
        );
      }

      const fresh =
        searchParams.get("fresh") === "1";

      const loadPage = fresh
        ? getQuitHeroCollectionPage
        : getFastQuitHeroCollectionPage;

      const minPriceValue =
        searchParams.get("minPrice");

      const maxPriceValue =
        searchParams.get("maxPrice");

      const filters = {
        brandId: searchParams
          .getAll("brandId")
          .map((value) => value.trim())
          .filter(Boolean),

        productTypeId: searchParams
          .getAll("productTypeId")
          .map((value) => value.trim())
          .filter(Boolean),

        status: searchParams
          .getAll("status")
          .map((value) => value.trim())
          .filter(Boolean),

        sourceSystem: searchParams
          .getAll("sourceSystem")
          .map((value) => value.trim())
          .filter(Boolean),

        tags: searchParams
          .getAll("tags")
          .map((value) => value.trim())
          .filter(Boolean),

        minPrice:
          minPriceValue !== null &&
          Number.isFinite(Number(minPriceValue))
            ? Number(minPriceValue)
            : undefined,

        maxPrice:
          maxPriceValue !== null &&
          Number.isFinite(Number(maxPriceValue))
            ? Number(maxPriceValue)
            : undefined,

        attributeFilters: searchParams
          .getAll("attributeFilters")
          .map((value) => value.trim())
          .filter(Boolean),
      };

      return NextResponse.json(
        await loadPage(
          collectionSlug,
          page,
          limit,
          filters,
        ),
        {
          headers: {
            // Server caches own freshness. A second CDN cache
            // could serve an old snapshot after a successful refresh.
            "cache-control": "private, no-store",
          },
        },
      );
    }

    const collectionSlugs = searchParams
      .getAll("collection")
      .map((slug) => slug.trim())
      .filter(Boolean);

    if (collectionSlugs.length) {
      const collections = await Promise.all(
        collectionSlugs.map(getQuitHeroCollection),
      );

      if (
        collections.some(
          (collection) => !collection,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more collections were not found.",
          },
          { status: 404 },
        );
      }

      const products = collections.flatMap(
        (collection) =>
          collection?.products ?? [],
      );

      const uniqueProducts = Array.from(
        new Map(
          products.map((product) => [
            product.id ?? product.slug,
            product,
          ]),
        ).values(),
      );

      return NextResponse.json(
        uniqueProducts,
      );
    }

    return NextResponse.json(
      await getQuitHeroProducts(),
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to connect to the product service.",
      },
      { status: 502 },
    );
  }
}