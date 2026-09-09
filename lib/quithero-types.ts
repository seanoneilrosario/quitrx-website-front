import type { QuitHeroBundleDropdown } from "./quithero-bundle";

export type QuitHeroImage = {
  url?: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type QuitHeroVariant = {
  id?: string;
  name?: string;
  sku?: string;
  price?: number | string;
  currencyCode?: string;
  inventory?: number;
  size?: string;
  color?: string;
  options?: Record<string, string>;
  bundleComponents?: unknown;
  bundleDropdowns?: QuitHeroBundleDropdown[];
};

export type QuitHeroBrand = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
};

export type QuitHeroTag = { name?: string; slug?: string };
export type QuitHeroProductTag = QuitHeroTag & { tag?: QuitHeroTag };

export type QuitHeroProduct = {
  id?: string;
  name?: string;
  handle?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  status?: string;
  category?: string;
  productType?: string | { name?: string; slug?: string };
  brand?: QuitHeroBrand;
  tags?: Array<QuitHeroProductTag | string>;
  images?: QuitHeroImage[];
  variants?: QuitHeroVariant[];
  collectionId?: string;
  collectionIds?: string[];
  collections?: Array<string | { id?: string; slug?: string }>;
  sourceId?: string;
  sourceSystem?: string;
};
