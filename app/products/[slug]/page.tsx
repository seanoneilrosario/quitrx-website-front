import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrimaryImage, getProductPrice, getQuitHeroProduct } from "@/lib/quithero";
import styles from "../../store.module.css";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getQuitHeroProduct((await params).slug).catch(() => undefined);
  return { title: product?.name || "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getQuitHeroProduct((await params).slug).catch(() => undefined);
  if (!product) notFound();

  const image = getPrimaryImage(product);
  const price = getProductPrice(product);
  const description = (product.description || product.shortDescription || "").replace(/<[^>]*>/g, "");

  return (
    <main className={styles.page}>
      <div className={`${styles.productDetail} page-width`}>
        <div className={styles.productImageWrap}>
          {image && <img src={image} alt={product.name || "Product"} className={styles.productImage} />}
        </div>
        <div className={styles.productContent}>
          {product.brand?.slug && (
            <Link href={`/collections/${product.brand.slug}`} className={styles.eyebrow}>
              {product.brand.name}
            </Link>
          )}
          <h1>{product.name}</h1>
          {price && <p className={styles.detailPrice}>{price}</p>}
          {description && <p className={styles.description}>{description}</p>}
          {product.variants?.[0]?.sku && <p className={styles.sku}>SKU: {product.variants[0].sku}</p>}
        </div>
      </div>
    </main>
  );
}
