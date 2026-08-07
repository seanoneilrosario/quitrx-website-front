import { NextResponse } from "next/server";

const PRODUCTS_ENDPOINT = "https://retail-api.quithero.com.au/products";

export async function GET() {
  const apiKey = process.env.QUITHERO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "QuitHero API key is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(PRODUCTS_ENDPOINT, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load products." },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the product service." },
      { status: 502 },
    );
  }
}
