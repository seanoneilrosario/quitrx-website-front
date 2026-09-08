export type QuitHeroBundleComponent = {
  componentVariantId: string;
  componentVariant?: {
    id?: string;
    inventory?: number;
  };
  position: number;
  quantity: number;
};

export type BundleAwareVariant = {
  inventory?: number;
  bundleComponents?: unknown;
};

export function bundleComponentsFrom(payload: unknown): QuitHeroBundleComponent[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const bundle = record.bundle && typeof record.bundle === "object"
    ? record.bundle as Record<string, unknown>
    : undefined;
  const candidates = Array.isArray(payload) ? payload
    : Array.isArray(record.bundleComponents) ? record.bundleComponents
    : Array.isArray(record.components) ? record.components
    : Array.isArray(record.data) ? record.data
    : Array.isArray(record.items) ? record.items
    : Array.isArray(bundle?.components) ? bundle.components
    : [];

  return candidates.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const component = candidate as Record<string, unknown>;
    const nestedVariant = component.componentVariant && typeof component.componentVariant === "object"
      ? component.componentVariant as Record<string, unknown>
      : undefined;
    const componentVariantId = String(component.componentVariantId ?? nestedVariant?.id ?? "");
    if (!componentVariantId) return [];

    const position = Number(component.position);
    const quantity = Number(component.quantity);
    return [{
      componentVariantId,
      ...(nestedVariant ? { componentVariant: nestedVariant as QuitHeroBundleComponent["componentVariant"] } : {}),
      position: Number.isFinite(position) ? position : index,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    }];
  }).sort((left, right) => left.position - right.position);
}

export function bundleComponentsAreAvailable(components: QuitHeroBundleComponent[]) {
  return components.length > 0 && components.every(({ componentVariant, quantity }) =>
    Number(componentVariant?.inventory ?? 0) >= quantity,
  );
}

export function variantIsAvailable(variant?: BundleAwareVariant) {
  if (!variant) return false;
  const components = bundleComponentsFrom(variant);
  return components.length
    ? bundleComponentsAreAvailable(components)
    : variant.inventory === undefined || variant.inventory > 0;
}
