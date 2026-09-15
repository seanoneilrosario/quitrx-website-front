import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuitHeroProductWhenReady } from "@/lib/quithero";
import ProductDetail from "@/components/commerce/ProductDetail";

type ProductPageProps = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getQuitHeroProductWhenReady((await params).handle).catch(() => undefined);
  return { title: product?.name || "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getQuitHeroProductWhenReady((await params).handle);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
