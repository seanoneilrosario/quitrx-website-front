import type { QuitHeroProduct } from "../quithero-types";
import type { CollectionRule } from "./types";
import { DEFAULT_PRODUCT_IMAGE } from "../product-image";

export function productHasTag(product: Pick<QuitHeroProduct, "tags">, expectedTag: string) {
  const expected = expectedTag.trim().toLowerCase();
  if (!expected) return false;
  return (
    product.tags?.some((tag) => {
      if (typeof tag === "string") return tag.trim().toLowerCase() === expected;
      return [tag.name, tag.slug, tag.tag?.name, tag.tag?.slug].some(
        (value) => value?.trim().toLowerCase() === expected,
      );
    }) ?? false
  );
}

function textCondition(actual: string, operator: CollectionRule["operator"], expected: string) {
  const left = actual.trim().toLowerCase();
  const right = expected.trim().toLowerCase();
  if (operator === "notEquals") return left !== right;
  if (operator === "contains") return left.includes(right);
  if (operator === "notContains") return !left.includes(right);
  return left === right;
}

export function productMatchesCollectionRule(product: QuitHeroProduct, rule: CollectionRule) {
  if (rule.field === "tag") {
    const matches = productHasTag(product, rule.value);
    return rule.operator === "notEquals" || rule.operator === "notContains" ? !matches : matches;
  }
  if (rule.field === "price" || rule.field === "inventory") {
    const expected = Number(rule.value);
    if (!Number.isFinite(expected)) return false;
    if (rule.field === "price") {
      const prices = getVariantPrices(product);
      if (!prices.length) return false;
      if (rule.operator === "greaterThan") return prices.some((price) => price > expected);
      if (rule.operator === "lessThan") return prices.some((price) => price < expected);
      if (rule.operator === "notEquals") return prices.every((price) => price !== expected);
      return prices.some((price) => price === expected);
    }
    const actual = (product.variants ?? []).reduce(
      (sum, variant) => sum + Number(variant.inventory ?? 0),
      0,
    );
    if (rule.operator === "greaterThan") return actual > expected;
    if (rule.operator === "lessThan") return actual < expected;
    if (rule.operator === "notEquals") return actual !== expected;
    return actual === expected;
  }
  const productType =
    typeof product.productType === "string"
      ? product.productType
      : (product.productType?.name ?? product.productType?.slug ?? "");
  const actual =
    rule.field === "name"
      ? (product.name ?? "")
      : rule.field === "brand"
        ? (product.brand?.name ?? product.brand?.slug ?? "")
        : rule.field === "productType"
          ? productType
          : (product.status ?? "");
  return textCondition(actual, rule.operator, rule.value);
}

export function productMatchesCollectionRules(
  product: QuitHeroProduct,
  rules: CollectionRule[],
  match: "all" | "any",
) {
  if (!rules.length) return false;
  return match === "any"
    ? rules.some((rule) => productMatchesCollectionRule(product, rule))
    : rules.every((rule) => productMatchesCollectionRule(product, rule));
}

export function getPrimaryImage(product: QuitHeroProduct) {
  return (
    product.images?.find((image) => image.isPrimary)?.url ||
    product.images?.[0]?.url ||
    DEFAULT_PRODUCT_IMAGE
  );
}

export function getVariantPrices(product: Pick<QuitHeroProduct, "variants">) {
  return (product.variants ?? []).flatMap((variant) => {
    if (typeof variant.price === "number")
      return Number.isFinite(variant.price) ? [variant.price] : [];
    if (!variant.price?.trim()) return [];
    const price = Number(variant.price.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(price) ? [price] : [];
  });
}

export function getProductPrice(product: QuitHeroProduct) {
  const prices = getVariantPrices(product);
  if (!prices.length) return;
  const formatter = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return minimum === maximum
    ? formatter.format(minimum)
    : `${formatter.format(minimum)}–${formatter.format(maximum)}`;
}
