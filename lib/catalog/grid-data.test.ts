import { describe, expect, it } from "vitest";
import { collectionCardsFrom, productCardsFrom, selectedCollectionCards } from "./grid-data";

describe("catalog grid data", () => {
  it.each(["products", "data", "items"])(
    "reads the %s product envelope and excludes archived products",
    (key) => {
      const cards = productCardsFrom({
        [key]: [
          null,
          { name: "Hidden", status: " ARCHIVED " },
          { name: "Visible", slug: "visible" },
        ],
      });
      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({ title: "Visible", handle: "visible" });
    },
  );

  it("preserves image fallbacks and formats valid variant price ranges", () => {
    const [card] = productCardsFrom([
      {
        images: [{ src: "/bottle.png" }],
        variants: [{ price: "" }, { price: "12.50" }, { price: 20 }, { price: null }],
      },
    ]);
    expect(card.image).toBe("/bottle.png");
    expect(card.price).toBe("$12.50–$20.00");
    expect(productCardsFrom([{ variants: [{ price: 0 }] }])[0].price).toBe("$0.00");
  });

  it("preserves selected collection order and omits unknown product counts", () => {
    expect(
      selectedCollectionCards([{ slug: "second", title: "Second" }, {}, { slug: "first" }]),
    ).toEqual([
      { slug: "second", title: "Second", image: undefined, placeholder: "title" },
      { slug: "first", title: "Collection", image: undefined, placeholder: "title" },
    ]);
  });

  it("reads collection cards without inventing a link for missing slugs", () => {
    const cards = collectionCardsFrom({
      data: [
        { name: "Missing" },
        { name: "Liquids", slug: "liquids", products: ["a", "b"] },
        { slug: "all-products", image: "/ignored.png" },
      ],
    });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({ title: "Liquids", slug: "liquids", count: 2 });
    expect(cards[1]).toMatchObject({ title: "All Products", image: undefined });
    expect(productCardsFrom(undefined)).toEqual([]);
    expect(collectionCardsFrom({ data: null })).toEqual([]);
  });
});
