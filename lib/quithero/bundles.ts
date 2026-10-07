import "server-only";

import { API_BASE, quitHeroFetch } from "./client";
import { bundleComponentsFrom } from "@/lib/catalog/bundles";
import type { QuitHeroVariant } from "./product-types";

export async function getQuitHeroBundle(productId: string, variantId: string) {
  const payload = await getQuitHeroBundleVariant(productId, variantId);
  return bundleComponentsFrom(payload);
}

export async function getQuitHeroBundleVariant(productId: string, variantId: string) {
  return quitHeroFetch<QuitHeroVariant>(
    `/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/bundle`,
  );
}

export async function patchQuitHeroBundle(
  productId: string,
  variantId: string,
  bundlePayload: Array<{ componentVariantId: string; position: number; quantity: number }>,
) {
  const apiKey = process.env.QUITHERO_API_KEY;
  if (!apiKey) throw new Error("QuitHero API key is not configured.");

  const response = await fetch(
    `${API_BASE}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/bundle`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(bundlePayload),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const apiResponse = await response.text();
    console.error("Quit Hero bundle PATCH failed:", response.status, apiResponse);
    throw new Error(`QuitHero bundle PATCH failed with ${response.status}.`);
  }
}
