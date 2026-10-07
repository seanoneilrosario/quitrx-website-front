import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/catalog/catalog-pagination", () => import("@/lib/catalog/catalog-pagination"));
vi.mock("@/lib/quithero", () => ({
  getFastQuitHeroCollectionPage: vi.fn(),
  getQuitHeroCollectionPage: vi.fn(),
  getQuitHeroCollection: vi.fn(),
  getQuitHeroProducts: vi.fn(),
}));
import { getFastQuitHeroCollectionPage, getQuitHeroCollectionPage } from "@/lib/quithero";
import { GET } from "./route";

beforeEach(() => vi.resetAllMocks());
describe("collection refresh endpoint", () => {
  it("refreshes all-products cards when explicitly requested", async () => {
    vi.mocked(getQuitHeroCollectionPage).mockResolvedValue({
      products: [{ id: "new" }],
    } as never);
    const response = await GET(
      new Request(
        "https://example.com/api/quithero-products?collectionPage=all-products&page=1&limit=100&fresh=1",
      ),
    );
    expect(getQuitHeroCollectionPage).toHaveBeenCalledWith("all-products", 1, 100);
    expect(getFastQuitHeroCollectionPage).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ products: [{ id: "new" }] });
  });
  it("retains server caching for regular collection reads", async () => {
    vi.mocked(getFastQuitHeroCollectionPage).mockResolvedValue({ products: [] } as never);
    const response = await GET(
      new Request("https://example.com/api/quithero-products?collectionPage=brand-a"),
    );
    expect(getFastQuitHeroCollectionPage).toHaveBeenCalledWith("brand-a", 1, 100);
    expect(getQuitHeroCollectionPage).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("reports fresh-read failures instead of silently returning stale products", async () => {
    vi.mocked(getQuitHeroCollectionPage).mockRejectedValue(new Error("Offline"));
    const response = await GET(
      new Request("https://example.com/api/quithero-products?collectionPage=brand-a&fresh=1"),
    );
    expect(response.status).toBe(502);
    expect(getFastQuitHeroCollectionPage).not.toHaveBeenCalled();
  });
});
