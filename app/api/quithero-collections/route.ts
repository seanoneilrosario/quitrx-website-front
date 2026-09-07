import { NextResponse } from "next/server";
import { getQuitHeroCollections } from "@/lib/quithero";

export async function GET() {
  try {
    return NextResponse.json(await getQuitHeroCollections());
  } catch (error) {
    console.error("Unable to load QuitHero collections.", error);
    return NextResponse.json({ error: "Unable to load collections." }, { status: 502 });
  }
}
