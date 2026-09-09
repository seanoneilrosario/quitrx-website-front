export type StorefrontCartItem = {
  key: string;
  productId: string;
  productName: string;
  image?: string;
  variantId?: string;
  variantName: string;
  price?: number | string;
  quantity: number;
  bundleComponents?: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    quantity: number;
  }>;
};

export function buildMultiItemCartPayload(
  mainItem: StorefrontCartItem,
  recommendations: Array<StorefrontCartItem & { checked: boolean }>,
) {
  return [mainItem, ...recommendations.filter((item) => item.checked).map(({ checked, ...item }) => {
    void checked;
    return item;
  })];
}
