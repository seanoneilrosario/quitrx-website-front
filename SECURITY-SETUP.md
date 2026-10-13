# Storefront security setup

The storefront rejects bundle PATCH requests. Catalog edits must use the admin application.
Facebook email linking now requires a matching verified email-code session.

## Required before deploying email login

Create/connect an Upstash Redis database, then set these **server-only** environment variables in Vercel for each deployment environment:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN` (read/write token)
- `AUTH_SECRET` or `AUTH_SESSION_SECRET` (at least 32 random characters; retain the existing secret)

Existing `RESEND_API_KEY` and `EMAIL_FROM` settings are still needed. Never use a `NEXT_PUBLIC_` prefix for secrets.
Redeploy after setting variables. Email login fails closed if Redis is missing or unavailable; social login is independent.
Existing email codes issued before this change expire; request a new code.

Limits: one code request per email per minute, five per email per hour, twenty per IP per hour.
Codes expire in ten minutes, allow five incorrect guesses and can succeed only once.
Counters and consumption use atomic Redis scripts; deleting or replaying browser cookies cannot reset them.
Vercel's overwritten `x-vercel-forwarded-for` header supplies the IP. Non-Vercel deployments share one IP bucket until trusted-proxy handling is configured.
Local passwordless bypass requires `ENABLE_LOCAL_LOGIN=true` and never works in production.

References: [Upstash REST API](https://upstash.com/docs/redis/features/restapi), [Vercel request headers](https://vercel.com/docs/headers/request-headers).

## Account settings still required

- In Vercel, review Firewall traffic and configure rate limits for login and expensive API requests. Server Actions post to page URLs, so include `/account/login`, not just `/api/auth`. Test checkout before broad API limits.
- Enable CAPTCHA/spam protection in each Zoho form's settings (support, intake, renewal, prescription upload and e-script). These submissions go directly to Zoho, outside this application's API.
- Enable MFA for Vercel, Sanity, Zoho and backend administrator accounts. These account settings cannot be enabled from storefront source code.
- Review and update dependencies from the npm audit report separately, with tests and a production build. These changes do not resolve the reported package vulnerabilities.

Headers restrict framing to the same origin, disable plugins, restrict base URLs, prevent MIME sniffing and limit referrer information. Production enables HSTS for this hostname. The CSP is a baseline policy, not a strict script allowlist; embedded forms, payments and Sanity need a separately tested policy before further restriction.

## Deployment checks

Verify an email sign-in end to end; replay a used challenge and confirm rejection in a test environment. Check request quotas with a test mailbox. Confirm forms, OAuth popups, Sanity Studio and payment redirects work. Inspect response headers. Do not publish until Redis configuration is ready.
