# QuitRX Storefront

Customer storefront built with Next.js, Sanity, and the QuitHero Retail API.

## Finding and maintaining code

Start with the [project structure and file guide](docs/project-structure.md) for
folder responsibilities, common changes, naming conventions, and validation commands.
Pages and API routes live in `app/`, reusable UI in `components/`, shared logic in
domain folders under `lib/`, and CMS schemas in `sanity/schemas/`.

## Getting Started

For collection and product fetching, see the [QuitHero file guide and examples](lib/quithero/README.md).

Create a local `.env` file with the server-only QuitHero configuration:

```env
QUITHERO_API_BASE_URL=https://retail-api.quithero.com.au
QUITHERO_API_KEY=your_quithero_api_key
AUTH_SECRET=use_a_random_value_of_at_least_32_characters
# Optional: use a different 32+ character secret for email customer sessions.
AUTH_SESSION_SECRET=use_a_different_random_value_of_at_least_32_characters
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
AUTH_FACEBOOK_ID=your_facebook_app_id
AUTH_FACEBOOK_SECRET=your_facebook_app_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=QuitRx <login@your-verified-domain.com>
EMAIL_LOGIN_ENABLED=true
EWAY_API_KEY=your_eway_api_key
EWAY_PASSWORD=your_eway_password
EWAY_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox
```

Do not prefix these variables with `NEXT_PUBLIC_`; API keys and OAuth secrets must never be included in browser code.

Use `sandbox` while testing eWAY and PayPal. Set each gateway's environment to `production` only after replacing its credentials with the corresponding live credentials.

The reusable customer synchronization service is in `lib/quithero/customers.ts`. Once the authentication provider has verified a login and returned the authenticated user, its server-side success callback should await the non-strict wrapper before redirecting:

```ts
await syncQuitHeroCustomerWithoutBlocking({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
});
```

Authentication is handled by Auth.js. Register `/api/auth/callback/google` and `/api/auth/callback/facebook` on your public site URL with the corresponding OAuth provider. Successful verified social logins automatically synchronize the customer with QuitHero.

`AUTH_SECRET` signs Auth.js, customer sessions, and email login challenges. If `AUTH_SESSION_SECRET` is configured, it is used for customer sessions and email login challenges instead.

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The storefront loads its Quicksand fonts from `public/fonts/` through `app/globals.css`.

## Data fetching and caching

The root layout resolves the signed-in account and seeds the account query for
the first render, so the header greeting is present before hydration. This makes
the storefront request-rendered and waits for the account lookup on full reloads;
the fresh seeded query avoids a duplicate browser request. Anonymous visits do
not request customer data from the upstream API.

API queries share a five-minute freshness window and a thirty-minute inactive
cache. Public catalog queries are persisted in session storage using TanStack's
`PersistQueryClientProvider`, so a reload reuses fresh responses without extending
their original fetch timestamp. Search and product grids share the same query
options; collection filters are sorted and deduplicated for consistent cache keys.

Account and order queries are shared in memory but are not persisted across
reloads. Login completion, successful edits, and external-form departure
can invalidate data before its freshness window expires. OAuth completion
always checks the current session. Server-rendered content still uses Next.js
caching, and payment/profile writes remain explicit requests to their existing
endpoints.

The storefront uses the shared TanStack Query provider for account, OAuth session,
product, collection, search, and order API reads. Account data comes from
`/api/account/me` using `useQuery`; refreshes and invalidation update that shared
cache. Session storage is not used as the source of authenticated account state.
Collection pages use `useInfiniteQuery` with a cache per collection and a server-loaded
first page. Product detail pages seed `useQuery` with server-loaded details and
refresh through `/api/quithero-products/[slug]`, including bundle choices and
related products. Product and collection grids also fetch through `useQuery`.

The provider lives in `components/providers/QueryProvider.tsx`. Shared cache policy
lives in `lib/query/query-cache.ts`, and account state is managed in
`hooks/useAccountCustomer.tsx`.
