# QuitHero data: where to find things

| Task                                                    | File                                       |
| ------------------------------------------------------- | ------------------------------------------ |
| Fetch products, a single product, or a page of products | [products.ts](./products.ts)               |
| Fetch collections and their products                    | [collections.ts](./collections.ts)         |
| API URL, authentication, retries, cache durations       | [client.ts](./client.ts)                   |
| Collection types and shared product type exports        | [types.ts](./types.ts)                     |
| Product images, prices, tags, collection rules          | [helpers.ts](./helpers.ts)                 |
| Fetch or update bundles                                 | [bundles.ts](./bundles.ts)                 |
| Fetch recommendation IDs from Sanity                    | [recommendations.ts](./recommendations.ts) |
| Fetch or create orders                                  | [orders.ts](./orders.ts)                   |
| Find, synchronize, or update customers                  | [customers.ts](./customers.ts)             |
| Product and variant response types                      | [product-types.ts](./product-types.ts)     |

## Server fetching examples

Use these in server components or API route handlers. The API key stays on the server.

```ts
import { getQuitHeroProduct, getQuitHeroProducts } from "@/lib/quithero/products";
import {
  getQuitHeroCollections,
  getFastQuitHeroCollectionPage,
  getQuitHeroCollectionPage,
} from "@/lib/quithero/collections";

const product = await getQuitHeroProduct("product-slug"); // Can be undefined.
const products = await getQuitHeroProducts(); // Entire catalog, cached.
const collections = await getQuitHeroCollections();
const page = await getFastQuitHeroCollectionPage("collection-slug", 1, 24);
const freshPage = await getQuitHeroCollectionPage("collection-slug", 1, 24);
const allProductsPage = await getFastQuitHeroCollectionPage("all-products", 1, 24);
```

Product lists and cached collection pages use a 300-second server cache. Single
products and collection lists use 60 seconds. The fresh collection-page function
bypasses that server cache. `getQuitHeroCollection` is the older full-catalog
resolver with Sanity assignment and dynamic-rule fallbacks.

Collection card caching uses `card-cache.ts` and `summary-cache.ts`. Each server
process retains up to 1,000 compact product cards and 100 collection pages for
five minutes. Concurrent requests share in-flight work. Named collection reads
seed product cards; All Products reuses those cards instead of fetching their
images and variants again. Failed refreshes leave successful entries intact.
These caches are process-local and reset on restart; replicas do not share them.

All Products remains limited to 15 products per batch, with the existing
100-attempt ceiling and two concurrent backend requests. Reloads and navigation
reuse valid cached snapshots. The explicit Refresh products button replaces the
first batch after success and discards old subsequent pages; failure preserves
the existing display. Later batches reuse caches. Collection API responses
disable HTTP caching so a CDN cannot hide an explicit refresh. Full product
details use their separate cache and are not fetched to populate these cards.

## Browser fetching examples

Browser query definitions live in [catalog-queries.ts](../catalog/catalog-queries.ts).
Use them inside client components under the app's query provider:

```tsx
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { productDetailQuery, collectionProductsQuery } from "@/lib/catalog/catalog-queries";

export function CatalogExample() {
  const product = useQuery(productDetailQuery("product-slug"));
  const collection = useInfiniteQuery(collectionProductsQuery("collection-slug"));
  return (
    <button
      onClick={() => collection.fetchNextPage()}
      disabled={!collection.hasNextPage || collection.isFetchingNextPage}
    >
      {product.data?.product.name ?? "Load more products"}
    </button>
  );
}
```

These queries call `app/api/quithero-products/` and
`app/api/quithero-collections/`. Collection pagination reuses cached server data;
browser cache settings are in `lib/query/query-cache.ts`.

## Pages and display components

- `app/collections/[slug]/page.tsx`: collection page entry point.
- `app/product/[handle]/page.tsx`: product page entry point.
- `components/commerce/CollectionCatalog.tsx`: collection display and pagination.
- `components/commerce/ProductDetail.tsx`: product display.
- `lib/catalog/product-detail-data.ts`: prepares product details, bundles, and recommendations.

Existing imports from `@/lib/quithero` still work through compatibility exports.
For new server code, import from the specific file above so the data source is clear.
