# Checkout discounts

The browser calls `/api/checkout/discounts`. This route resolves the customer from the existing authenticated session, reads current catalog prices, and calls QuitHero's `/discounts/preview` with server-only credentials. Existing checkout requires sign-in; no guest identity is invented.

`useCheckoutDiscounts` keys results by cart contents, shipping, customer, code, and retry revision. Changes immediately make previous totals unusable. Effect cleanup aborts obsolete requests and prevents late responses from replacing current results. Preview requests never create orders or change the stored cart.

Successfully validated codes are saved per customer in browser session storage. Refreshing checkout in the same tab restores the code and requests a new backend preview before enabling payment. Totals are never persisted. Removing the code or completing payment clears it; rejected replacement codes do not overwrite the last validated code. Automatic discounts are always fetched from the backend. If browser storage is blocked, checkout remains usable without refresh persistence.

Both payment entry routes request a fresh backend preview. A different total returns a review error before opening the gateway. Discounted gateway payments use the backend total without allocating discounts locally. Original item details remain in the retail order payload. The signed payment session retains the selected code, original shipping charge, totals, and a compact fingerprint of the expected promotion history and line savings.

Payment callbacks send the code and original shipping charge to `/orders`, allowing the backend to recalculate. Returned totals, line discounts, promotion names/codes/scopes/amounts, and the presence of calculation details are verified. A created retail order ID is retained before verification so confirmation retries can retrieve that order.

## Verification and release checks

- Automated tests cover preview validation, backend eligibility errors, authenticated identity, shipping changes, payment totals for automatic/product/order/shipping combinations, order payloads, persisted history, and confirmation retries.
- A live preview using the supplied sample cart confirmed automatic free shipping and the response format. No order or payment was created during that check.
- Before release, use approved test promotions and payment sandbox accounts to verify valid/expired codes, segment inclusion/exclusion, combinations, quantity changes, and successful saved orders for both gateways. Browser interaction and the full payment-to-fulfilment flow still require this acceptance check.
- Confirm shipping changes and rapid cart edits do not display stale totals; rejected codes must leave the cart intact.

## Existing payment-flow constraints

Retail orders are created after payment. Discounts can change while the gateway is open; backend rejection or a saved-total mismatch therefore requires confirmation recovery/support, not another payment. A durable backend quote/reservation and payment-linked idempotency would be needed to eliminate this race and ambiguous order-creation failures entirely.

Zero-total orders currently return a support message before opening the gateway. An approved zero-payment order workflow is needed to support them automatically.

`shippingTotal` remains the original charge, matching the supplied saved-order example. `shippingAfterDiscount` is displayed in checkout; shipping savings are also part of the backend's combined `discountAmount`. The UI does not subtract those savings a second time.

## Buy X Get Y

The optional `promotionalItems` preview field is normalized to an empty array for older backend responses. Promotional lines are derived from the current preview and are not written into the customer's `quitrx-cart`, so a customer-added quantity of the same variant remains independent and stale gifts disappear with the stale preview. The checkout preview route hydrates product display data from the catalog.

Payment entry routes independently preview the customer-owned cart again, append the returned promotional lines to the signed payment session, and submit those lines to `/orders` with `isPromotional`, `discountId`, and `benefitType`. The saved order must return the same promotional metadata, quantities, line discounts, and line totals for fingerprint verification. The backend contract must define `promotionalItems[].quantity` as the desired total promotional quantity and include promotional pre-discount value in `subtotal` so displayed totals reconcile.
