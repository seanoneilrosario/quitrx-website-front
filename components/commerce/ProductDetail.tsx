import type { QuitHeroProduct } from "@/lib/quithero";
import { getProductDetailData } from "@/lib/product-detail-data";
import ProductDetailContent from "./ProductDetailContent";

export default async function ProductDetail({ product }: { product: QuitHeroProduct }) {
  const initialData = await getProductDetailData(product);
  return <ProductDetailContent key={initialData.productId} initialData={initialData} />;
}
