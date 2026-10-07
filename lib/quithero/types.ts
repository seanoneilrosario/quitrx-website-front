import type { QuitHeroProduct } from "../quithero-types";
export type QuitHeroCollectionProduct =
  | string
  | (QuitHeroProduct & {
      productId?: string;
      _ref?: string;
      product?: QuitHeroProduct;
    });

export type QuitHeroCollection = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  type?: string;
  match?: string;
  rules?: CollectionRule[];
  dynamicRules?: CollectionRule[];
  products?: QuitHeroCollectionProduct[];
  productIds?: string[];
};

export type CollectionRule = {
  field: "tag" | "name" | "brand" | "productType" | "status" | "price" | "inventory";
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan";
  value: string;
};

export type QuitHeroCollectionPage = {
  collection: {
    name: string;
    slug: string;
    description?: string;
  };
  products: QuitHeroProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type * from "../quithero-types";
