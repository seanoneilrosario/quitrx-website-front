import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuitHeroProductWhenReady } from "@/lib/quithero";
import ProductDetail from "@/components/commerce/ProductDetail";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getQuitHeroProductWhenReady(slug).catch(() => undefined);
  const title = product?.name || "Product";
  const description = product?.shortDescription;

  return {
    title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${slug}`,
      siteName: "QuitRx",
      locale: "en_AU",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getQuitHeroProductWhenReady((await params).slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
