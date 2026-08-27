import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuitHeroProduct } from "@/lib/quithero";
import ProductDetail from "@/components/commerce/ProductDetail";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getQuitHeroProduct((await params).slug).catch(() => undefined);
  return { title: product?.name || "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getQuitHeroProduct((await params).slug).catch(() => undefined);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
