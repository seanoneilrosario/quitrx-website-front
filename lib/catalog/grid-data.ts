export type GridCollection = {
  title?: string;
  slug?: string;
  image?: string;
  link?: string;
  openInNewTab?: boolean;
};
export type CollectionCardData = {
  slug?: string;
  href: string;
  title: string;
  image?: string;
  count?: number;
  openInNewTab?: boolean;
  placeholder: "title" | "all";
};
export type ProductCardData = {
  id: string;
  title: string;
  handle?: string;
  image?: string;
  price?: string;
};
type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord | undefined {
  return value && typeof value === "object" ? (value as ApiRecord) : undefined;
}
function text(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
}
function records(payload: unknown, keys: string[]): ApiRecord[] {
  let items = payload;
  if (!Array.isArray(items)) {
    const record = asRecord(payload);
    items = record && keys.map((key) => record[key]).find(Boolean);
  }
  return Array.isArray(items) ? (items.filter(asRecord) as ApiRecord[]) : [];
}
function image(record: ApiRecord) {
  const direct = text(record, ["imageUrl", "image_url", "thumbnail", "image"]);
  if (direct) return direct;
  const images = record.images;
  if (!Array.isArray(images) || !images.length) return;
  if (typeof images[0] === "string") return images[0];
  return text(asRecord(images[0]) || {}, ["url", "src", "imageUrl"]);
}
const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
function price(record: ApiRecord) {
  if (!Array.isArray(record.variants)) return;
  const prices = record.variants.flatMap((variant) => {
    const value = asRecord(variant)?.price;
    if (typeof value !== "number" && typeof value !== "string") return [];
    if (typeof value === "string" && !value.trim()) return [];
    const amount = typeof value === "number" ? value : Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(amount) ? [amount] : [];
  });
  if (!prices.length) return;
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return minimum === maximum
    ? currency.format(minimum)
    : `${currency.format(minimum)}–${currency.format(maximum)}`;
}
export function productCardsFrom(payload: unknown): ProductCardData[] {
  return records(payload, ["products", "data", "items"])
    .filter((product) => text(product, ["status"])?.trim().toLowerCase() !== "archived")
    .map((product, index) => {
      const title = text(product, ["name", "title", "productName"]) || "Product";
      return {
        id: text(product, ["id", "_id", "sku"]) || `${title}-${index}`,
        title,
        handle: text(product, ["handle", "slug"]),
        image: image(product),
        price: price(product),
      };
    });
}
export function collectionCardsFrom(payload: unknown): CollectionCardData[] {
  return records(payload, ["collections", "data", "items"]).flatMap((collection) => {
    const slug = text(collection, ["slug"]);
    if (!slug) return [];
    const brand = asRecord(collection.brand) || {};
    const isAll = slug === "all-products";
    return [
      {
        slug,
        href: `/collections/${slug}`,
        title: isAll
          ? "All Products"
          : text(collection, ["name", "title"]) || text(brand, ["name"]) || "Collection",
        image: isAll
          ? undefined
          : text(collection, ["image"]) || text(brand, ["logo"]) || image(collection),
        count: Array.isArray(collection.products) ? collection.products.length : 0,
        placeholder: "all" as const,
      },
    ];
  });
}

function normalizeCardLink(link?: string) {
  const value = link?.trim();
  if (!value) return;
  if (/^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(value)) return value;
  return `/${value}`;
}

export function selectedCollectionCards(collections: GridCollection[]): CollectionCardData[] {
  return collections.flatMap((collection) => {
    const href =
      normalizeCardLink(collection.link) ||
      (collection.slug ? `/collections/${collection.slug}` : undefined);
    return href
      ? [
          {
            slug: collection.slug,
            href,
            title: collection.title || "Collection",
            image: collection.image,
            openInNewTab: collection.openInNewTab,
            placeholder: "title" as const,
          },
        ]
      : [];
  });
}
