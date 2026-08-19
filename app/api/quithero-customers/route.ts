import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CUSTOMERS_URL = `${(process.env.QUITHERO_API_BASE_URL ?? "https://retail-api.quithero.com.au").replace(/\/$/, "")}/customers`;

export async function GET(request: NextRequest) {
  // This diagnostic endpoint can expose customer data, so never deploy it.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "QUITHERO_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  if (!search) {
    return NextResponse.json(
      { error: "Add a search query, for example ?search=name@example.com." },
      { status: 400 },
    );
  }

  const upstreamUrl = new URL(CUSTOMERS_URL);
  upstreamUrl.searchParams.set("search", search);

  try {
    const response = await fetch(upstreamUrl, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the customer service." },
      { status: 502 },
    );
  }
}
