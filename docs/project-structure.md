# Where to find things

The storefront uses the Next.js App Router. Find a page by its URL in `app/`, UI by
its purpose in `components/`, and shared behavior by its domain in `lib/`.
The `@/` import alias points to this application's root.

## Folder map

```text
app/                    Pages, layouts, API routes, and route-specific UI
  account/              Login, profile, prescriptions, and order history
  api/                  HTTP endpoints for accounts, catalog, orders, and payments
  cart/                 Shopping cart
  checkout/             Checkout page and its styles
  collections/[slug]/   Collection routes
  product/[handle]/     Product routes
  admin/                Embedded Sanity Studio
components/
  account/              Reusable account UI
  cms/                  Sanity preview controls
  commerce/             Product cards, product details, and collection UI
  layout/               Website shell
  navigation/           Header, footer, and site chrome
  pages/                CMS page compositions
  providers/            React Query and theme providers
  sections/             CMS section renderer, types, and section components
    contact/ forms/ hero/ images/ products/ text/
  ui/                   General UI fallbacks
hooks/                  Shared React hooks
lib/
  account/              Account queries, initial data, cache, and prescription access
  auth/                 Signed customer sessions and SMS login helpers
  catalog/              Catalog queries, stock, bundles, and product presentation
  checkout/             Checkout defaults and cart payloads
  forms/                External form URLs
  payments/             eWAY and PayPal clients and payment sessions
  query/                Shared query cache policy
  quithero/             QuitHero API clients and response types
    cache/              Bounded server cache and reusable product card snapshots
sanity/
  lib/                  Sanity client, image helpers, live queries, and GROQ
  schemas/
    documents/          Pages, products, collections, and site settings
    fields/             Reusable schema fields
    objects/            Portable text definitions
    sections/           Page-builder section definitions
    index.ts            Schema registration
  studio/               Custom Studio inputs and branding
public/                 Public images, fonts, and other static assets
docs/                   Project navigation and maintenance guides
```

## Common changes

| What you want to change                  | Start here                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Header or menu                           | `components/navigation/Header.tsx`                                                |
| Footer                                   | `components/navigation/Footer.tsx`                                                |
| Global colors, fonts, and styles         | `app/globals.css`                                                                 |
| Home page composition                    | `app/page.tsx`, `components/pages/Home.tsx`                                       |
| Product details                          | `components/commerce/ProductDetailContent.tsx`                                    |
| Product purchase controls                | `components/commerce/ProductPurchasePanel.tsx`                                    |
| Collection browsing                      | `components/commerce/CollectionCatalog.tsx`                                       |
| Cart or checkout                         | `app/cart/page.tsx`, `app/checkout/page.tsx`                                      |
| Customer account data                    | `lib/account/account-data.ts`, `lib/account/account-query.ts`                     |
| Social authentication                    | `auth.ts`                                                                         |
| Customer sessions                        | `lib/auth/customer-session.ts`                                                    |
| Payment gateway integration              | `lib/payments/`, `app/api/payments/`                                              |
| API authentication, retries, and caching | `lib/quithero/client.ts`                                                          |
| Product and collection fetching          | `lib/quithero/products.ts`, `lib/quithero/collections.ts`                         |
| Browser data caching                     | `lib/catalog/catalog-queries.ts`, `lib/query/query-cache.ts`                      |
| External intake form links               | `lib/forms/form-urls.ts`                                                          |
| A page-builder section                   | `components/sections/` and `sanity/schemas/sections/`                             |
| Section registration and data types      | `components/sections/SectionRenderer.tsx`, `components/sections/section-types.ts` |
| CMS data selection                       | `sanity/lib/queries.ts`                                                           |
| Sanity document fields                   | `sanity/schemas/documents/`                                                       |
| Studio navigation                        | `sanity/structure.ts`                                                             |

## Placement and naming conventions

- Keep route entry points, route-only components, and route-only styles together in `app/`.
- Put reusable UI in the matching `components/` folder. Component files use PascalCase;
  styles use kebab-case, such as `CollectionCatalog.tsx` and `collection-catalog.module.css`.
- Put shared behavior in its `lib/` domain. Utility and schema files use kebab-case.
- Name hooks after the exported hook, such as `hooks/useWindowWidth.ts`.
- Keep tests next to the module they exercise as `*.test.ts`.
- Use relative imports for nearby files and `@/` imports across domains. Import API
  functions from their specific module when possible; `lib/quithero/index.ts` also
  supports the existing `@/lib/quithero` entry point.
- Preserve `"use client"`, `"use server"`, and `server-only` boundaries when moving
  code. A browser component must not import a runtime server API client.
- Sanity schema filenames are independent from persisted schema names. Renaming a
  file does not require changing its `name`, `_type`, or GROQ field names.
- Keep public asset paths stable because CMS content can reference them directly.
- Keep configuration files at the application root. Do not edit generated files
  in `.next/`, dependencies in `node_modules/`, or generated `next-env.d.ts`.

## Adding a CMS section

1. Add the schema in `sanity/schemas/sections/` and register it in `sanity/schemas/index.ts`.
2. Add it to the appropriate page document's section choices.
3. Select its data in `sanity/lib/queries.ts`.
4. Add its section type and fields in `components/sections/section-types.ts`.
5. Create its UI and styles in the appropriate `components/sections/` subfolder.
6. Register its renderer in `components/sections/SectionRenderer.tsx`.

## Selecting QuitHero collections in Sanity

Open the storefront's `/admin` Studio, edit a page, and add **QuitHero Collections**
under Components (existing Product Grid sections use this same section). Set Display
to **Collection cards**, then add **QuitHero collection (API)** under Collections to
display. Select a collection from the dropdown, repeat for additional cards, and
publish the page. Drag the items to change their order.

The dropdown reads `/api/quithero-collections`, which calls QuitHero's
`GET /collections` on the server. Sanity stores the selected ID, slug, name, and
image; it does not copy the collection's products. The card opens
`/collections/{slug}`, which reads that collection and its paginated products from
QuitHero's `GET /collections/{identifier}` endpoint. Existing customer and
prescription access rules still apply.

The API key remains in the server's `QUITHERO_API_KEY` environment variable.
Use **Refresh collections** to reload the options (the server list cache lasts
60 seconds). Reselect a collection to update its saved name, image, or slug after
changing those in QuitHero. Existing Sanity collection references are still supported.

## Validation commands

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Formatting uses the storefront's own configuration, so it works when this app is
opened independently of the parent workspace. Builds need the application's
configured environment and access to the services used while generating pages.
