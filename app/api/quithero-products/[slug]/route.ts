import { NextResponse } from "next/server";
import { getQuitHeroProduct } from "@/lib/quithero";
import { productIsVisible } from "@/lib/catalog/bundles";
import { getProductDetailData } from "@/lib/catalog/product-detail-data";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getQuitHeroProduct(slug);
    if (!product || !productIsVisible(product))
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404, headers: { "cache-control": "no-store" } },
      );
    return NextResponse.json(await getProductDetailData(product), {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load this product." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
