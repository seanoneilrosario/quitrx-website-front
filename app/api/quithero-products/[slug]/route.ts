import { NextResponse } from "next/server";
import { getQuitHeroProductWhenReady } from "@/lib/quithero";
import { getProductDetailData } from "@/lib/product-detail-data";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getQuitHeroProductWhenReady(slug);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json(await getProductDetailData(product));
  } catch {
    return NextResponse.json({ error: "Unable to load this product." }, { status: 502 });
  }
}
