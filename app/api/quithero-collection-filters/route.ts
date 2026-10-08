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
        {
          error:
            "Collection is required.",
        },
        { status: 400 },
      );
    }

    const backendParams =
      new URLSearchParams();

    searchParams.forEach(
      (value, key) => {
        if (key === "collection") {
          return;
        }

        backendParams.append(
          key,
          value,
        );
      },
    );

    const query =
      backendParams.toString();

    const path =
      `/collections/${encodeURIComponent(
        collectionSlug,
      )}/available-filters` +
      (query ? `?${query}` : "");

    const response =
      await quitHeroFetch(path);

    return NextResponse.json(
      response,
      {
        headers: {
          "cache-control":
            "private, no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to load collection filters.",
      },
      { status: 502 },
    );
  }
}