# Snohomish Paid Landing Page Spec

## Scope

Create a focused Washington Home Offers landing page for paid seller searches involving properties in Snohomish County. Preserve complete first- and last-touch attribution through form submission to SetMate and emit a non-PII lead event after a successful response.

## Requirements

- Use one dedicated canonical path: `/snohomish-county`.
- Keep the page focused on an as-is direct-sale option for Snohomish County properties.
- Remove navigation and foreclosure-rescue links from the paid landing page.
- Do not make guarantees about market value, foreclosure outcomes, exact offer timing, or closing.
- State that Washington Home Offers is a principal buyer, not a brokerage, and that a direct cash offer may be lower than a retail-market sale.
- Require name, phone, property address, and unchecked SMS/call consent.
- Capture first and latest UTM values plus Google, Microsoft, and Meta click identifiers; send first-touch values with a `first_` prefix and latest values under their normal keys.
- Never send the seller's name, phone, email, or property address to GA4, Google Ads, or Meta analytics events.
- Emit `generate_lead` and `seller_lead_submitted` only after SetMate returns success.
- Send `targetMarket: snohomish-county` to SetMate.
- Keep the campaign unpublished/paused until billing, conversion actions, and a browser-based production test are verified.

## Success criteria

- The landing page renders cleanly on desktop and mobile.
- Paid click identifiers survive navigation and appear in the SetMate request payload.
- A successful mocked submission emits analytics events without PII.
- Privacy, terms, phone, and principal-buyer disclosure remain visible.
