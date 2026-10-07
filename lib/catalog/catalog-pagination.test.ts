import { expect, it } from "vitest";
import { collectionPageNumbers, parseCollectionPage } from "./catalog-pagination";

it("normalizes invalid URL pages", () => {
  for (const value of [null, undefined, "", "0", "-1", "2.5", "abc", "Infinity"]) {
    expect(parseCollectionPage(value)).toBe(1);
  }
  expect(parseCollectionPage("3")).toBe(3);
});

it("keeps page links bounded with first and last navigation", () => {
  expect(collectionPageNumbers(1, 1)).toEqual([1]);
  expect(collectionPageNumbers(1, 10)).toEqual([1, 2, 3, 10]);
  expect(collectionPageNumbers(50, 100)).toEqual([1, 48, 49, 50, 51, 52, 100]);
  expect(collectionPageNumbers(10, 10)).toEqual([1, 8, 9, 10]);
});
