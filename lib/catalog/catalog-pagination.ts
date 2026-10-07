export const COLLECTION_PAGE_SIZE = 15;
export const ALL_PRODUCTS_PAGE_SIZE = COLLECTION_PAGE_SIZE;

export function parseCollectionPage(value: string | null | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function collectionPageNumbers(current: number, total: number) {
  return [...new Set([1, current - 2, current - 1, current, current + 1, current + 2, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}
