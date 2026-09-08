import { getQuitHeroBundle, getQuitHeroProducts, patchQuitHeroBundle } from "@/lib/quithero";

type BundlePayloadComponent = {
  componentVariantId: string;
  position: number;
  quantity: number;
};

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

    const bundleComponents = components.flatMap((component, componentIndex) => {
      const match = variants.get(component.componentVariantId);
      const productId = match?.product.id || component.componentVariant?.product?.id || component.componentVariantId;
      const productName = match?.product.name || component.componentVariant?.product?.name || "Bundle item";
      const choices = (match?.product.variants || []).flatMap((variant) => variant.id ? [{
        variantId: variant.id,
        productId,
        productName,
        variantName: variant.name || "Default",
        available: variant.inventory === undefined || variant.inventory > 0,
      }] : []);

      return Array.from({ length: component.quantity }, (_, unitIndex) => ({
        id: `${component.position}-${componentIndex}-${unitIndex}`,
        variantId: component.componentVariantId,
        productId,
        productName,
        variantName: match?.variant.name || component.componentVariant?.name || "Default",
        quantity: 1,
        available: (match?.variant.inventory ?? component.componentVariant?.inventory) === undefined
          || Number(match?.variant.inventory ?? component.componentVariant?.inventory) > unitIndex,
        choices: choices.length ? choices : undefined,
      }));
    });

    return Response.json(bundleComponents);
  } catch {
    return Response.json({ error: "Unable to load this bundle." }, { status: 502 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> },
) {
  try {
    const { productId, variantId } = await params;
    const payload = await request.json() as unknown;
    if (!Array.isArray(payload) || !payload.every((component): component is BundlePayloadComponent =>
      Boolean(component)
      && typeof component === "object"
      && typeof component.componentVariantId === "string"
      && Number.isInteger(component.position)
      && Number(component.quantity) > 0,
    )) {
      return Response.json({ error: "Invalid bundle payload." }, { status: 400 });
    }

    await patchQuitHeroBundle(productId, variantId, payload);
    return Response.json({ success: true, componentCount: payload.length });
  } catch (error) {
    console.error("Unable to PATCH Quit Hero bundle:", error);
    return Response.json({ error: "Unable to update this bundle." }, { status: 502 });
  }
}
