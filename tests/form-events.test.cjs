const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildLeadAnalyticsEvent,
  buildLeadMessage,
  buildLeadPayload,
  resolveLeadEndpoint,
} = require('../js/form.js');

const values = {
  name: 'Test Seller',
  phone: '(425) 555-0100',
  email: 'seller@example.test',
  propertyAddress: '123 Test Ave, Everett, WA 98201',
  situation: 'repairs-needed',
  message: 'Needs work | Consented to calls/texts (SMS opt-in)',
};

const tracking = {
  firstTouch: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'snoco-search',
    gclid: 'first-click',
    landing: '/snohomish-county?gclid=first-click',
  },
  lastTouch: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'snoco-search',
    utm_term: 'sell my house fast',
    gclid: 'latest-click',
    landing: '/snohomish-county',
  },
};

test('builds a Snohomish SetMate payload with first and latest attribution', () => {
  const payload = buildLeadPayload(
    values,
    tracking,
    'snohomish-county',
    '_fbp=fb.1.browser; _fbc=fb.1.click',
  );

  assert.deepEqual(payload, {
    name: 'Test Seller',
    phone: '(425) 555-0100',
    email: 'seller@example.test',
    propertyAddress: '123 Test Ave, Everett, WA 98201',
    situation: 'repairs-needed',
    message: 'Needs work | Consented to calls/texts (SMS opt-in)',
    source: 'washingtonhomeoffers.com',
    targetMarket: 'snohomish-county',
    attribution: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'snoco-search',
      utm_term: 'sell my house fast',
      gclid: 'latest-click',
      landing: '/snohomish-county',
      fbp: 'fb.1.browser',
      fbc: 'fb.1.click',
      first_utm_source: 'google',
      first_utm_medium: 'cpc',
      first_utm_campaign: 'snoco-search',
      first_gclid: 'first-click',
      first_landing: '/snohomish-county?gclid=first-click',
    },
  });
});

test('falls back to legacy UTM storage for visitors captured before the tracking upgrade', () => {
  const payload = buildLeadPayload(values, {
    utm: { source: 'google', medium: 'cpc', campaign: 'legacy-search' },
    landingPage: '/get-offer.html',
    referrer: 'https://google.com',
  }, '', '');

  assert.deepEqual(payload.attribution, {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'legacy-search',
    landing: '/get-offer.html',
    referrer: 'https://google.com',
    first_utm_source: 'google',
    first_utm_medium: 'cpc',
    first_utm_campaign: 'legacy-search',
    first_landing: '/get-offer.html',
    first_referrer: 'https://google.com',
  });
  assert.equal(Object.hasOwn(payload, 'targetMarket'), false);
});

test('builds an analytics event with no seller PII or click identifier', () => {
  const event = buildLeadAnalyticsEvent(tracking.lastTouch, 'snohomish-county');

  assert.deepEqual(event, {
    event: 'seller_lead_submitted',
    market: 'snohomish-county',
    source: 'google',
    campaign: 'snoco-search',
  });

  const serialized = JSON.stringify(event);
  for (const forbidden of [
    values.name,
    values.phone,
    values.email,
    values.propertyAddress,
    'latest-click',
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('uses an explicit form endpoint for local verification and the SetMate endpoint otherwise', () => {
  assert.equal(resolveLeadEndpoint('http://127.0.0.1:4174/lead'), 'http://127.0.0.1:4174/lead');
  assert.equal(resolveLeadEndpoint(''), 'https://www.setmate.ai/api/public/seller-lead');
});

test('records SMS consent only when the seller opts in', () => {
  assert.equal(buildLeadMessage('Needs work', true), 'Needs work | Consented to calls/texts (SMS opt-in)');
  assert.equal(buildLeadMessage('Needs work', false), 'Needs work');
  assert.equal(buildLeadMessage('', false), '');
  const capped = buildLeadMessage('x'.repeat(240), true);
  assert.ok(capped.length <= 240);
  assert.match(capped, /Consented to calls\/texts \(SMS opt-in\)$/);
});

test('keeps SMS consent optional on the paid landing page', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'snohomish-county.html'), 'utf8');
  const checkbox = html.match(/<input[^>]+name="smsConsent"[^>]*>/)?.[0] || '';
  assert.ok(checkbox, 'SMS consent checkbox should exist');
  assert.equal(/\brequired\b/.test(checkbox), false);
});
