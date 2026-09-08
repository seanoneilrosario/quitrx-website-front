export type QuitHeroBundleComponent = {
  componentVariantId: string;
  componentVariant?: {
    id?: string;
    name?: string;
    inventory?: number;
    product?: { id?: string; name?: string };
  };
  position: number;
  quantity: number;
};

export type QuitHeroBundleSlot = {
  id: string;
  label?: string;
  position: number;
  quantity: number;
  defaultVariantId?: string;
  allowedVariantIds: string[];
  allowProductVariants?: boolean;
};

export type QuitHeroBundleDropdown = {
  name: string;
  options: Array<{
    componentVariantId: string;
    componentVariant?: {
      id?: string;
      name?: string;
      inventory?: number;
      productId?: string;
      product?: { id?: string; name?: string };
    };
  }>;
};

export type BundleAwareVariant = {
  inventory?: number;
  bundleComponents?: unknown;
  bundleDropdowns?: unknown;
};

export function bundleDropdownsFrom(payload: unknown): QuitHeroBundleDropdown[] {
  if (!payload || typeof payload !== "object") return [];
  const dropdowns = (payload as Record<string, unknown>).bundleDropdowns;
  if (!Array.isArray(dropdowns)) return [];

  return dropdowns.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const dropdown = value as Record<string, unknown>;
    const name = String(dropdown.name ?? "").trim();
    const options = recordsFrom(dropdown.options).flatMap((option) => {
      const componentVariantId = String(option.componentVariantId ?? "").trim();
      const componentVariant = option.componentVariant && typeof option.componentVariant === "object"
        ? option.componentVariant as QuitHeroBundleDropdown["options"][number]["componentVariant"]
        : undefined;
      return componentVariantId ? [{ componentVariantId, ...(componentVariant ? { componentVariant } : {}) }] : [];
    });
    return name && options.length ? [{ name, options }] : [];
  });
}

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

function recordsFrom(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function variantIdFrom(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const variant = record.variant && typeof record.variant === "object"
    ? record.variant as Record<string, unknown>
    : undefined;
  return String(record.variantId ?? record.childVariantId ?? record.componentVariantId ?? record.id ?? variant?.id ?? "");
}

export function bundleSlotsFrom(payload: unknown): QuitHeroBundleSlot[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const bundle = record.bundle && typeof record.bundle === "object"
    ? record.bundle as Record<string, unknown>
    : undefined;
  const data = record.data && typeof record.data === "object" && !Array.isArray(record.data)
    ? record.data as Record<string, unknown>
    : undefined;
  const bundledComponents = recordsFrom(record.bundleComponents);
  const componentSlots = bundledComponents.filter((component) =>
    [component.allowedChildVariants, component.allowedVariants, component.variants, component.options,
      component.allowedChildVariantIds, component.allowedVariantIds, component.variantIds].some(Array.isArray),
  );
  const slots = recordsFrom(record.bundleSlots).length ? recordsFrom(record.bundleSlots)
    : recordsFrom(record.slots).length ? recordsFrom(record.slots)
    : recordsFrom(bundle?.slots).length ? recordsFrom(bundle?.slots)
    : recordsFrom(bundle?.bundleSlots).length ? recordsFrom(bundle?.bundleSlots)
    : recordsFrom(data?.slots).length ? recordsFrom(data?.slots)
    : recordsFrom(data?.bundleSlots).length ? recordsFrom(data?.bundleSlots)
    : componentSlots;

  if (slots.length) {
    return slots.map((slot, index) => {
      const allowed = slot.allowedChildVariants ?? slot.allowedVariants ?? slot.variants
        ?? slot.options ?? slot.allowedChildVariantIds ?? slot.allowedVariantIds ?? slot.variantIds;
      const allowedVariantIds = Array.from(new Set(recordsFrom(allowed).length
        ? recordsFrom(allowed).map(variantIdFrom).filter(Boolean)
        : Array.isArray(allowed) ? allowed.map(variantIdFrom).filter(Boolean) : []));
      const position = Number(slot.position ?? slot.sortOrder);
      const quantity = Number(slot.quantity);
      const defaultVariantId = variantIdFrom(slot.defaultVariantId ?? slot.defaultChildVariantId ?? slot.defaultVariant);
      return {
        id: String(slot.slotId ?? slot.id ?? `slot-${index + 1}`),
        ...(String(slot.label ?? slot.name ?? slot.title ?? "").trim()
          ? { label: String(slot.label ?? slot.name ?? slot.title).trim() }
          : {}),
        position: Number.isFinite(position) ? position : index,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        ...(defaultVariantId ? { defaultVariantId } : {}),
        allowedVariantIds,
      };
    }).sort((left, right) => left.position - right.position);
  }

  return bundleComponentsFrom(payload).flatMap((component, componentIndex) =>
    Array.from({ length: component.quantity }, (_, unitIndex) => ({
      id: `component-${component.position}-${componentIndex}-${unitIndex}`,
      position: component.position + unitIndex / Math.max(component.quantity, 1),
      quantity: 1,
      defaultVariantId: component.componentVariantId,
      allowedVariantIds: [component.componentVariantId],
      allowProductVariants: true,
    })),
  );
}

export function bundleComponentsAreAvailable(components: QuitHeroBundleComponent[]) {
  return components.length > 0 && components.every(({ componentVariant, quantity }) =>
    Number(componentVariant?.inventory ?? 0) >= quantity,
  );
}

export function variantIsAvailable(variant?: BundleAwareVariant) {
  if (!variant) return false;
  const dropdowns = bundleDropdownsFrom(variant);
  if (dropdowns.length) return dropdowns.every((dropdown) => dropdown.options.length > 0);
  const components = bundleComponentsFrom(variant);
  return components.length
    ? bundleComponentsAreAvailable(components)
    : variant.inventory === undefined || variant.inventory > 0;
}
