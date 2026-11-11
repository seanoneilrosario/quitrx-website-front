export const COLLECTION_SORT_OPTIONS = [
  { value: "MANUAL", label: "Default" },
  { value: "PRICE_ASC", label: "Price: low to high" },
  { value: "PRICE_DESC", label: "Price: high to low" },
  { value: "BEST_SELLING", label: "Best selling" },
  { value: "TITLE_ASC", label: "Title: A to Z" },
  { value: "TITLE_DESC", label: "Title: Z to A" },
  { value: "NEWEST", label: "Newest first" },
  { value: "OLDEST", label: "Oldest first" },
] as const;

export type Sort = (typeof COLLECTION_SORT_OPTIONS)[number]["value"];

export function parseCollectionSort(value: string | null | undefined): Sort {
  const legacy: Record<string, Sort> = {
    default: "MANUAL",
    "price-asc": "PRICE_ASC",
    "price-desc": "PRICE_DESC",
    "name-asc": "TITLE_ASC",
    "name-desc": "TITLE_DESC",
  };
  return (
    COLLECTION_SORT_OPTIONS.find((option) => option.value === value)?.value ??
    (value && Object.hasOwn(legacy, value) ? legacy[value] : "MANUAL")
  );
}
