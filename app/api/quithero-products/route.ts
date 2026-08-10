import { NextResponse } from "next/server";
import { getQuitHeroProducts } from "@/lib/quithero";

export async function GET() {
  try {
    return NextResponse.json(await getQuitHeroProducts());
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the product service." },
      { status: 502 },
    );
  }
}
