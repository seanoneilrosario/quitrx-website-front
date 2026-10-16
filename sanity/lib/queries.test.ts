import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";
import { HOME_QUERY, PAGE_QUERY } from "./queries";

async function collectionTiles(query: string, selections: unknown[], documents: unknown[]) {
  const result = await evaluate(parse(query), {
    dataset: [
      {
        _id: "page",
        _type: query === HOME_QUERY ? "home" : "page",
        slug: { current: "pharmacy" },
        components: [{ _type: "product_api_grid", collections: selections }],
      },
      ...documents,
    ],
    params: { slug: "pharmacy" },
  });
  return (await result.get()).components[0].collections;
}

const selected = {
  _type: "apiCollection",
  id: "collection-1",
  slug: "old-slug",
  title: "Old title",
  image: "https://example.com/old.png",
};
const synced = {
  _id: "retailCollection.collection-1",
  _type: "productCollection",
  quitHeroCollectionId: "collection-1",
  title: "Updated title",
  slug: { current: "new-slug" },
  image: { asset: { _type: "reference", _ref: "new-image" } },
};
const asset = {
  _id: "new-image",
  _type: "sanity.imageAsset",
  url: "https://cdn.sanity.io/new.png",
};

describe("dashboard collection tiles", () => {
  it.each([HOME_QUERY, PAGE_QUERY])(
    "reads the synced image and renamed slug in the page query",
    async (query) => {
      expect(await collectionTiles(query, [selected], [synced, asset])).toEqual([
        {
          _type: "apiCollection",
          id: "collection-1",
          title: "Updated title",
          slug: "new-slug",
          image: asset.url,
        },
      ]);
    },
  );

  it("supports older selections without an API ID", async () => {
    expect(
      await collectionTiles(
        HOME_QUERY,
        [{ ...selected, id: undefined, slug: "new-slug" }],
        [synced, asset],
      ),
    ).toEqual([
      {
        _type: "apiCollection",
        id: null,
        title: "Updated title",
        slug: "new-slug",
        image: asset.url,
      },
    ]);
  });

  it("keeps saved selections when no synced collection exists", async () => {
    expect(await collectionTiles(HOME_QUERY, [selected], [])).toEqual([
      {
        _type: "apiCollection",
        id: selected.id,
        title: selected.title,
        slug: selected.slug,
        image: selected.image,
      },
    ]);
  });

  it("does not revive a deleted collection image from the saved selection", async () => {
    const [tile] = await collectionTiles(HOME_QUERY, [selected], [{ ...synced, image: undefined }]);
    expect(tile.image).toBeNull();
  });

  it("preserves custom link images and selection order", async () => {
    const tiles = await collectionTiles(
      HOME_QUERY,
      [
        {
          _type: "customLink",
          title: "Custom",
          link: "/custom",
          openInNewTab: true,
          image: synced.image,
        },
        selected,
      ],
      [synced, asset],
    );
    expect(tiles[0]).toMatchObject({
      title: "Custom",
      link: "/custom",
      image: asset.url,
      openInNewTab: true,
    });
    expect(tiles[1].title).toBe("Updated title");
  });
});
