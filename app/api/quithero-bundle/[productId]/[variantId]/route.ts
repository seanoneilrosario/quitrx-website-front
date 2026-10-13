import { getQuitHeroBundle, getQuitHeroProducts } from "@/lib/quithero";
import { getAvailableStock } from "@/lib/catalog/available-stock";

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
    const variants = new Map(
      products.flatMap((product) =>
        (product.variants || []).flatMap((variant) =>
          variant.id ? [[variant.id, { product, variant }] as const] : [],
        ),
      ),
    );

    const bundleComponents = components.flatMap((component, componentIndex) => {
      const match = variants.get(component.componentVariantId);
      const productId =
        match?.product.id ||
        component.componentVariant?.product?.id ||
        component.componentVariantId;
      const productName =
        match?.product.name || component.componentVariant?.product?.name || "Bundle item";
      const choices = (match?.product.variants || []).flatMap((variant) =>
        variant.id
          ? [
              {
                variantId: variant.id,
                productId,
                productName,
                variantName: variant.name || "Default",
                available: getAvailableStock(variant) > 0,
              },
            ]
          : [],
      );

      return Array.from({ length: component.quantity }, (_, unitIndex) => ({
        id: `${component.position}-${componentIndex}-${unitIndex}`,
        variantId: component.componentVariantId,
        productId,
        productName,
        variantName: match?.variant.name || component.componentVariant?.name || "Default",
        quantity: 1,
        available: getAvailableStock(match?.variant ?? component.componentVariant) > unitIndex,
        choices: choices.length ? choices : undefined,
      }));
    });

    return Response.json(bundleComponents);
  } catch {
    return Response.json({ error: "Unable to load this bundle." }, { status: 502 });
  }
}

export async function PATCH() {
  // Catalog edits belong in the authenticated admin application.
  return Response.json(
    { error: "Bundle editing is not available on the storefront." },
    {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    },
  );
}
