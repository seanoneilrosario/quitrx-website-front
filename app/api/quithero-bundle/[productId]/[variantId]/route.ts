import { getQuitHeroBundle, getQuitHeroProducts } from "@/lib/quithero";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  try {
    const { productId, variantId } = await params;
    const [components, products] = await Promise.all([
      getQuitHeroBundle(productId, variantId),
      getQuitHeroProducts(),
    ]);
    const variants = new Map(products.flatMap((product) => (product.variants || []).flatMap((variant) =>
      variant.id ? [[variant.id, { product, variant }] as const] : [],
    )));

    return Response.json(components.map((component) => {
      const match = variants.get(component.componentVariantId);
      return {
        variantId: component.componentVariantId,
        productId: match?.product.id || component.componentVariant?.product?.id || component.componentVariantId,
        productName: match?.product.name || component.componentVariant?.product?.name || "Bundle item",
        variantName: match?.variant.name || component.componentVariant?.name || "Default",
        quantity: component.quantity,
        available: (match?.variant.inventory ?? component.componentVariant?.inventory) === undefined
          || Number(match?.variant.inventory ?? component.componentVariant?.inventory) >= component.quantity,
      };
    }));
  } catch {
    return Response.json({ error: "Unable to load this bundle." }, { status: 502 });
  }
}
