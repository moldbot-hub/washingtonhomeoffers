# Snohomish Paid Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Snohomish County paid-search landing page that sends complete, privacy-safe attribution into SetMate.

**Architecture:** Add a small UMD attribution core that can run unchanged in a browser and Node tests. The existing tracking and form scripts consume it, while a dedicated static landing page supplies Snohomish-specific copy and a market identifier.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node's built-in test runner, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-08-23-snohomish-paid-landing.md`

## Global Constraints

- Property market is exactly Snohomish County, Washington.
- Paid landing copy contains no foreclosure-rescue claims or guaranteed outcomes.
- Seller PII never enters analytics events.
- Existing site-wide pages remain unchanged unless required for the new path.
- Campaign activation remains paused until the end-to-end conversion path is verified.

---

### Task 1: Browser attribution core

**Files:**
- Create: `js/attribution-core.js`
- Create: `tests/attribution-core.test.cjs`
- Modify: `js/tracking.js`

**Interfaces:**
- Consumes: a query string, existing first/latest touches, landing URL, referrer, and cookie string.
- Produces: `window._smAttributionCore` in browsers and `module.exports` in Node with `parseTouch`, `parseMetaCookies`, and `mergeTouches`.

- [ ] **Step 1: Write failing Node tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeTouches, parseMetaCookies, parseTouch } = require('../js/attribution-core.js');

test('captures UTM and paid click identifiers', () => {
  assert.deepEqual(parseTouch('?utm_source=google&utm_campaign=snoco-search&gclid=abc123', '/snohomish-county', 'https://google.com'), {
    utm_source: 'google',
    utm_campaign: 'snoco-search',
    gclid: 'abc123',
    landing: '/snohomish-county',
    referrer: 'https://google.com',
  });
});

test('preserves first touch and refreshes last touch only when marketing parameters exist', () => {
  assert.deepEqual(mergeTouches(null, null, { utm_source: 'google', gclid: 'g-1' }), {
    first: { utm_source: 'google', gclid: 'g-1' },
    last: { utm_source: 'google', gclid: 'g-1' },
  });
  assert.deepEqual(mergeTouches({ utm_source: 'google' }, { utm_source: 'google' }, {}), {
    first: { utm_source: 'google' },
    last: { utm_source: 'google' },
  });
});

test('reads Meta cookies without unrelated cookie values', () => {
  assert.deepEqual(parseMetaCookies('_fbp=fb.1.1; session=secret; _fbc=fb.1.click'), { fbp: 'fb.1.1', fbc: 'fb.1.click' });
});
```

- [ ] **Step 2: Run the tests and verify the module-not-found failure**

Run: `node --test tests/attribution-core.test.cjs`

Expected: FAIL because `js/attribution-core.js` does not exist.

- [ ] **Step 3: Implement the core and update tracking storage**

Expose the exact interface from Step 1. `tracking.js` stores `_sm_first_touch` once, refreshes `_sm_last_touch` on attributed visits, and returns both touches from `window._smTracking.getData()`.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test tests/attribution-core.test.cjs`

Expected: 3 passing tests.

- [ ] **Step 5: Commit attribution core**

```powershell
git add js/attribution-core.js js/tracking.js tests/attribution-core.test.cjs
git commit -m "feat: retain paid click attribution"
```

### Task 2: Form payload and analytics event

**Files:**
- Modify: `js/form.js`
- Create: `tests/form-events.test.cjs`

**Interfaces:**
- Consumes: `window._smTracking.getData()`, Meta cookies, and the form's `data-target-market` value.
- Produces: a SetMate request containing latest attribution under its normal keys plus first-touch values prefixed with `first_`, and non-PII `generate_lead`/`seller_lead_submitted` events after success.

- [ ] **Step 1: Write a failing test for payload construction and event privacy**

The test must execute the exported pure helpers with a literal seller fixture and assert that the SetMate payload includes `gclid` and `targetMarket`, while the analytics event object includes only `event`, `market`, `source`, and `campaign`.

- [ ] **Step 2: Run the test and verify the missing exports fail**

Run: `node --test tests/form-events.test.cjs`

Expected: FAIL because `buildLeadPayload` and `buildLeadAnalyticsEvent` do not exist.

- [ ] **Step 3: Extract and use the pure helpers in `form.js`**

Use a browser/Node wrapper like Task 1. On a successful SetMate response:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push(buildLeadAnalyticsEvent(attribution, targetMarket));
if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { market: targetMarket });
if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { market: targetMarket });
```

Do not pass name, phone, email, address, or contact ID to these analytics calls.

- [ ] **Step 4: Run both Node test files**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

- [ ] **Step 5: Commit form tracking**

```powershell
git add js/form.js tests/form-events.test.cjs
git commit -m "feat: send privacy-safe seller conversion events"
```

### Task 3: Snohomish County paid landing page

**Files:**
- Create: `snohomish-county.html`
- Modify: `css/style.css`
- Modify: `_redirects`

**Interfaces:**
- Consumes: shared site styles, `js/attribution-core.js`, `js/tracking.js`, and `js/form.js`.
- Produces: the canonical `/snohomish-county` paid destination and a form marked `data-target-market="snohomish-county"`.

- [ ] **Step 1: Add the dedicated page with approved claims and disclosures**

The page must include:

```html
<h1>Sell Your Snohomish County House As-Is</h1>
<p>Tell us about the property and we'll discuss a straightforward, no-obligation cash option. No repairs or showings are required when we purchase directly.</p>
```

It must list Everett, Marysville, Lynnwood, Lake Stevens, Edmonds, Monroe, Arlington, Snohomish, Mill Creek, Mukilteo, Mountlake Terrace, and Stanwood; show the phone number; link privacy and terms; and state that a direct cash offer may be lower than a retail-market sale.

- [ ] **Step 2: Add the clean landing-page layout and responsive rules**

Reuse existing typography, colors, buttons, form controls, and imagery. Add only scoped `.paid-*` selectors needed for a compact header, hero/form split, local proof, process, FAQ, and disclosure footer.

- [ ] **Step 3: Add the canonical redirect**

Append:

```text
/snohomish-county.html /snohomish-county 301
```

- [ ] **Step 4: Serve and inspect desktop and mobile in a real browser**

Run: `python -m http.server 4173`

Inspect `http://127.0.0.1:4173/snohomish-county.html` at desktop width and approximately 390px mobile width. Verify there is no horizontal overflow, the form is usable, and the foreclosure page is not linked.

- [ ] **Step 5: Commit the paid landing page**

```powershell
git add snohomish-county.html css/style.css _redirects
git commit -m "feat: add Snohomish paid seller landing page"
```

### Task 4: End-to-end request verification

**Files:**
- Verify only; no new production files expected.

**Interfaces:**
- Consumes: Tasks 1–3 and the SetMate intake contract.
- Produces: evidence that click IDs survive through the actual browser form request and analytics events contain no PII.

- [ ] **Step 1: Start the static server and intercept the SetMate request in-browser**

Open:

```text
http://127.0.0.1:4173/snohomish-county.html?utm_source=google&utm_medium=cpc&utm_campaign=snoco-search&utm_term=sell%20my%20house%20fast&gclid=test-click-123
```

Intercept the form POST, submit a synthetic test seller, and verify the JSON contains `gclid: test-click-123`, `utm_campaign: snoco-search`, and `targetMarket: snohomish-county`.

- [ ] **Step 2: Verify analytics privacy**

Inspect `window.dataLayer` and confirm it contains `seller_lead_submitted` without name, phone, email, property address, or contact ID.

- [ ] **Step 3: Run all static tests again**

Run: `node --test tests/*.test.cjs`

Expected: all tests pass.

- [ ] **Step 4: Record screenshots and final verification notes**

Save desktop and mobile screenshots outside the repository as task evidence; do not add generated screenshots to Git.
