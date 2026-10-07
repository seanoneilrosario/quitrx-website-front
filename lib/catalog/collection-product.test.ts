import { expect, it } from "vitest";
import { toCollectionProduct } from "./collection-product";
import { productIsAvailable } from "./bundles";

it("keeps card/filter data while removing details and preserving bundle availability", () => {
  const summary = toCollectionProduct({
    id: "bundle",
    name: "Bundle",
    slug: "bundle",
    description: "Long description",
    tags: ["bundle"],
    brand: { name: "Brand", description: "Brand details" },
    images: [{ url: "other" }, { url: "primary", isPrimary: true }],
    variants: [
      {
        id: "variant",
        price: 20,
        options: { Size: "Small", Color: "Blue", Other: "Detail" },
        bundleComponents: [
          {
            componentVariantId: "child",
            quantity: 2,
            componentVariant: { inventory: 5, allocatedInventory: 1 },
          },
        ],
      },
    ],
  });
  expect(summary.isBundle).toBe(true);
  expect(productIsAvailable(summary)).toBe(true);
  expect(summary.images).toEqual([{ url: "primary", altText: undefined }]);
  expect(summary.variants?.[0]).toMatchObject({
    id: "variant",
    price: 20,
    size: "Small",
    color: "Blue",
  });
  expect(summary).not.toHaveProperty("description");
  expect(summary).not.toHaveProperty("tags");
  expect(summary.brand).not.toHaveProperty("description");
  expect(summary.variants?.[0]).not.toHaveProperty("bundleComponents");
  expect(summary.variants?.[0]).not.toHaveProperty("options");
});

it("preserves stock and variant identity for direct add to cart", () => {
  const summary = toCollectionProduct({
    variants: [{ id: "one", name: "Default", price: 12, inventory: 8, allocatedInventory: 3 }],
  });
  expect(summary.isBundle).toBe(false);
  expect(summary.available).toBe(true);
  expect(summary.variants?.[0]).toMatchObject({
    id: "one",
    name: "Default",
    inventory: 8,
    allocatedInventory: 3,
  });
});

it("uses listed bundle stock when the collection omits configuration", () => {
  const product = { productType: "Bundle", variants: [{ inventory: 10, allocatedInventory: 2 }] };
  expect(toCollectionProduct(product).available).toBe(true);
  expect(
    toCollectionProduct({ ...product, variants: [{ inventory: 2, allocatedInventory: 2 }] })
      .available,
  ).toBe(false);
  expect(toCollectionProduct({ ...product, status: "SOLD_OUT" }).available).toBe(false);
});
