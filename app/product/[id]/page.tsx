import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuitHeroProductById } from "@/lib/quithero";
import ProductDetail from "@/components/commerce/ProductDetail";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getQuitHeroProductById((await params).id).catch(() => undefined);
  return { title: product?.name || "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getQuitHeroProductById((await params).id).catch(() => undefined);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
