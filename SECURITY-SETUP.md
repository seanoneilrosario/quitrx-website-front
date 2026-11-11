# Storefront security setup

The storefront rejects bundle PATCH requests. Catalog edits must use the admin application.
Facebook email linking now requires a matching verified email-code session.

## Required before deploying email login

Set these server-only environment variables:

- `AUTH_SECRET` or `AUTH_SESSION_SECRET` (at least 32 random characters)
- `RESEND_API_KEY`
- `EMAIL_FROM`

Restart locally or redeploy after changes. Never prefix secrets with `NEXT_PUBLIC_`.

Email codes use signed, HTTP-only cookies, expire after ten minutes, and track five failed attempts and a one-minute resend cooldown in the current cookie. Successful verification clears the cookie. There is no shared rate-limit or consumption store: deleting cookies resets these limits, and replaying a saved valid cookie can reuse a code until expiry.

Local passwordless bypass requires `ENABLE_LOCAL_LOGIN=true` and never works in production.

## Account settings still required

- In Vercel, review Firewall traffic and configure rate limits for login and expensive API requests. Server Actions post to page URLs, so include `/account/login`, not just `/api/auth`. Test checkout before broad API limits.
- Enable CAPTCHA/spam protection in each Zoho form's settings (support, intake, renewal, prescription upload and e-script). These submissions go directly to Zoho, outside this application's API.
- Enable MFA for Vercel, Sanity, Zoho and backend administrator accounts. These account settings cannot be enabled from storefront source code.
- Next.js and its ESLint configuration are patched to 16.4.3, and sanitize-html to 2.18.1 or newer. Review remaining npm audit findings separately; do not use `npm audit fix --force` without reviewing breaking changes.

## Request and crawler protections

Browser mutations under `/api/account/`, `/api/checkout/`, and the eWAY payment-start
endpoint require an Origin matching the request URL. OAuth callbacks and payment
return endpoints are excluded so external providers can still complete their flows.
Server Actions retain Next.js's built-in origin protection. Automated clients of the
protected browser endpoints must send the storefront Origin and still authenticate.
Origin checks prevent browser cross-site requests; they are not bot detection.

Private/account/checkout/admin/API paths are excluded in robots.txt and receive
`X-Robots-Tag: noindex, nofollow, noarchive`. Public pages remain crawlable.
Robots instructions are voluntary and do not block hostile crawlers. The customer
debug page returns 404 in production before fetching any data.

## Protections that still require hosting or backend changes

No Redis integration is included. Email-code counters and consumption remain in
cookies; the replay limitation above is unresolved. Payment confirmation also needs
an atomic backend uniqueness constraint tying each eWAY transaction to one order.
The process-local callback map cannot prevent sequential replay or cross-instance
duplicates. Implement this in the existing order backend before treating replay as fixed.

In the Vercel Firewall, start rate-limit rules in monitoring/logging mode, review
normal traffic, then enforce limits for POST `/account/login`, authentication
endpoints and expensive catalog APIs. Keep payment provider returns and verified
search-engine crawlers exempt from blanket challenges. These dashboard rules and
Zoho CAPTCHA settings have not been changed by this code update.

Headers restrict framing to the same origin, disable plugins, restrict base URLs, prevent MIME sniffing and limit referrer information. Production enables HSTS for this hostname. The CSP is a baseline policy, not a strict script allowlist; embedded forms, payments and Sanity need a separately tested policy before further restriction.

## Deployment checks

Verify email sign-in, code expiry, incorrect-code handling and the resend cooldown. Confirm forms, OAuth popups, Sanity Studio and payment redirects work. Inspect response headers.
