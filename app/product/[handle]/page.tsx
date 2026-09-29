import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuitHeroProduct } from "@/lib/quithero";
import ProductDetail from "@/components/commerce/ProductDetail";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  const product = await getQuitHeroProduct(handle).catch(
    () => undefined,
  );

  const title = product?.name || "Product";
  const description = product?.shortDescription;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${handle}`,
    },
    openGraph: {
      title,
      description,
      url: `/product/${handle}`,
      siteName: "QuitRx",
      locale: "en_AU",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { handle } = await params;

  const product = await getQuitHeroProduct(handle);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}