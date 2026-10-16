# Collection catalog

`../CollectionCatalog.tsx` assembles the page, product cards, mobile drawer state,
and prescription-access handling. Its public props and CSS module are unchanged.

| File | Responsibility |
| --- | --- |
| `useCollectionFilters.ts` | Read URL filters, serialize API parameters, toggle selections, update price/sort, and clear filters |
| `useCollectionData.ts` | Product and available-filter queries, initial server data, loading/error state, and derived results |
| `CollectionFilters.tsx` | Desktop/mobile sidebar, checkbox groups, and price slider |
| `CollectionPagination.tsx` | Page links, history updates, modified clicks, and scrolling to results |
| `sort-products.ts` | Sort only the current product page without modifying cached data |
| `LockedProductDialog.tsx` | Locked-product message, Escape handling, and body scroll lock |

Filter changes reset the page to 1 and use `replaceState`; pagination uses
`pushState`. Attribute selections remain separate URL parameters and are joined
for the API query. Initial server data is used only for the matching unfiltered
page. API requests and caching remain in `lib/catalog/catalog-queries.ts`.

This is a structural refactor. Debouncing, retaining previous query results,
and server caching of available-filter responses are separate changes.
