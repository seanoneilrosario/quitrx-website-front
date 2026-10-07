# Product summary endpoint: proposed integration contract

Status: pending access to the QuitHero Retail API source. This endpoint is not
implemented or enabled in the storefront yet.

## Backend

Add an authenticated `GET /products/summaries?page=1&limit=100` endpoint to the
Retail API. Register the static path before `/products/:identifier`. Validate
positive integer pagination and cap the limit at 100. Select active products
using a stable order with an ID tie-breaker. Apply the same predicate to the count.

Return the following shape, compatible with the existing collection cards:

```json
{
  "data": [
    {
      "id": "product-id",
      "name": "Product name",
      "slug": "product-name",
      "status": "ACTIVE",
      "brand": { "name": "Brand" },
      "images": [{ "url": "https://example.com/product.jpg", "altText": "Product name" }],
      "available": true,
      "isBundle": false,
      "variants": [
        {
          "id": "variant-id",
          "name": "Default",
          "price": "20.00",
          "inventory": 10,
          "allocatedInventory": 2,
          "size": "Small",
          "color": "Blue"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 100, "total": 250, "totalPages": 3, "hasNextPage": true }
}
```

Use database joins or bulk queries scoped to the selected product IDs. The query
count must remain bounded as the page grows from 1 to 100 products. Do not loop
over product detail, image, or variant HTTP endpoints. Select only the columns
needed for cards, filters, direct add-to-cart, and stock calculations. Return one
primary image (stable fallback when none is marked primary). Exclude descriptions,
galleries, cost/supplier data, and bundle configuration from the response.

Compute availability using the backend's purchasing rules, including allocated
stock, explicit sold-out statuses, and component quantities for configured
bundles. Bundles with no component configuration must follow the backend's
inventory rules rather than being assumed sold out. Keep `isBundle` explicit so
cards never offer direct add-to-cart for bundles. Preserve accurate price ranges
and size/color filtering through the compact variant list.

## Storefront integration after the endpoint is available

Replace All Products relation hydration with one summary request for each
100-product page. Retain authoritative `available` and `isBundle` values rather
than recalculating them from the intentionally omitted bundle configuration.
Continue displaying 15 cards at a time from the cached 100. Fetch the next batch
only when needed.

Reuse cached data during internal navigation. On a full browser reload, request
one fresh first page and replace both the server snapshot and browser collection
cache after success. Remove previously loaded pages from the browser snapshot so
old and new pagination are not mixed. Coalesce simultaneous refreshes, retain the
last successful snapshot on failure, and show a retryable error. Avoid a cold
server-render fetch followed by an identical client refresh. Do not invalidate
the whole catalog or refresh every collection on a single page reload.

Keep the existing backend concurrency limit and 429 cooldown. Never fall back to
per-product relation requests when the summary endpoint fails. Product detail
requests remain deferred until product navigation.

## Verification

- 100 stocked product cards include images, prices, and correct stock status.
- One successful summary HTTP request per cold load or refresh; no image,
  variant, bundle, or product-detail HTTP requests during collection loading.
- Database query count stays bounded at 100 products.
- Reload updates the cache; internal navigation reuses it.
- Concurrent refreshes share work; failed refreshes preserve the last good data.
- Empty collections, final pages, out-of-stock products, and bundles behave correctly.

Until the backend implementation is available, retain the current 15-product
batch size and request ceiling. Raising the batch size alone would exceed the
existing 100-request budget and fail partway through loading.
