import { NextResponse } from "next/server";
import { getFreshQuitHeroCollections, getQuitHeroCollections } from "@/lib/quithero";

export async function GET(request: Request) {
  try {
    const fresh = new URL(request.url).searchParams.get("refresh") === "1";
    const collections = await (fresh ? getFreshQuitHeroCollections() : getQuitHeroCollections());
    return NextResponse.json(collections, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Unable to load QuitHero collections.", error);
    return NextResponse.json({ error: "Unable to load collections." }, { status: 502 });
  }
}
