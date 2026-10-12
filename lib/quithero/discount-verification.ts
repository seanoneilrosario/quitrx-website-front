import "server-only";
import { createHash } from "node:crypto";
import type { DiscountPreview } from "@/lib/checkout/discounts";
import type { QuitHeroOrder } from "./orders";

function fingerprint(applications: unknown[][], lines: Array<[string, number]>) {
  const amounts = new Map<string, number>();
  for (const [variantId, amount] of lines)
    amounts.set(variantId, (amounts.get(variantId) ?? 0) + amount);
  return createHash("sha256")
    .update(
      JSON.stringify([
        applications.map((entry) => JSON.stringify(entry)).sort(),
        [...amounts].filter(([, amount]) => amount !== 0).sort(([a], [b]) => a.localeCompare(b)),
      ]),
    )
    .digest("hex");
}

export function previewDiscountFingerprint(preview: DiscountPreview) {
  return fingerprint(
    preview.appliedDiscounts.map((entry) => [
      entry.name,
      entry.code ?? null,
      entry.scope,
      Math.round(entry.discountAmount * 100),
    ]),
    preview.lineDiscounts.map((entry) => [entry.variantId, Math.round(entry.discountAmount * 100)]),
  );
}

export function orderDiscountFingerprint(order: QuitHeroOrder) {
  return fingerprint(
    (order.discountApplications ?? []).map((entry) => [
      entry.discountName,
      entry.discountCode ?? null,
      entry.scope,
      Math.round(Number(entry.amount) * 100),
    ]),
    (order.items ?? []).map((entry) => [
      entry.variantId ?? "",
      Math.round(Number(entry.discountTotal) * 100),
    ]),
  );
}
