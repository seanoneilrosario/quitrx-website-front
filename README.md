This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create a local `.env` file with the server-only QuitHero configuration:

```env
QUITHERO_API_BASE_URL=https://retail-api.quithero.com.au
QUITHERO_API_KEY=your_quithero_api_key
AUTH_SECRET=use_a_random_value_of_at_least_32_characters
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
AUTH_FACEBOOK_ID=your_facebook_app_id
AUTH_FACEBOOK_SECRET=your_facebook_app_secret
```

Do not prefix these variables with `NEXT_PUBLIC_`; API keys and OAuth secrets must never be included in browser code.

The reusable customer synchronization service is in `lib/quithero-customers.ts`. Once the authentication provider has verified a login and returned the authenticated user, its server-side success callback should await the non-strict wrapper before redirecting:

```ts
await syncQuitHeroCustomerWithoutBlocking({
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
});
```

Authentication is handled by Auth.js. Register `/api/auth/callback/google` and `/api/auth/callback/facebook` on your public site URL with the corresponding OAuth provider. Successful verified social logins automatically synchronize the customer with QuitHero.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
