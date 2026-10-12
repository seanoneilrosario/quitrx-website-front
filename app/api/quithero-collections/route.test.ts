import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/quithero", () => ({
  getQuitHeroCollections: vi.fn(),
  getFreshQuitHeroCollections: vi.fn(),
}));
import { getQuitHeroCollections, getFreshQuitHeroCollections } from "@/lib/quithero";
import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());

it("bypasses cached collections for the Studio picker", async () => {
  vi.mocked(getFreshQuitHeroCollections).mockResolvedValue([{ slug: "new-collection" }]);
  const response = await GET(new Request("https://shop.test/api/quithero-collections?refresh=1"));
  expect(await response.json()).toEqual([{ slug: "new-collection" }]);
  expect(getFreshQuitHeroCollections).toHaveBeenCalledOnce();
  expect(getQuitHeroCollections).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toContain("no-store");
});

it("retains server caching for ordinary storefront reads", async () => {
  vi.mocked(getQuitHeroCollections).mockResolvedValue([{ slug: "collection" }]);
  await GET(new Request("https://shop.test/api/quithero-collections"));
  expect(getQuitHeroCollections).toHaveBeenCalledOnce();
  expect(getFreshQuitHeroCollections).not.toHaveBeenCalled();
});
