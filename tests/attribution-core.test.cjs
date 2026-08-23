const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mergeTouches,
  parseMetaCookies,
  parseTouch,
} = require('../js/attribution-core.js');

test('captures UTM and paid click identifiers', () => {
  assert.deepEqual(
    parseTouch(
      '?utm_source=google&utm_campaign=snoco-search&gclid=abc123',
      '/snohomish-county',
      'https://google.com',
    ),
    {
      utm_source: 'google',
      utm_campaign: 'snoco-search',
      gclid: 'abc123',
      landing: '/snohomish-county',
      referrer: 'https://google.com',
    },
  );
});

test('captures every supported paid click identifier and caps hostile values', () => {
  const touch = parseTouch(
    '?gbraid=gb-1&wbraid=wb-1&msclkid=ms-1&fbclid=fb-1&utm_term=' + 'x'.repeat(400),
    '/snohomish-county',
    '',
  );

  assert.deepEqual(touch, {
    gbraid: 'gb-1',
    wbraid: 'wb-1',
    msclkid: 'ms-1',
    fbclid: 'fb-1',
    utm_term: 'x'.repeat(240),
    landing: '/snohomish-county',
  });
});

test('preserves first touch and refreshes last touch only when marketing parameters exist', () => {
  assert.deepEqual(
    mergeTouches(null, null, { utm_source: 'google', gclid: 'g-1' }),
    {
      first: { utm_source: 'google', gclid: 'g-1' },
      last: { utm_source: 'google', gclid: 'g-1' },
    },
  );

  assert.deepEqual(
    mergeTouches(
      { utm_source: 'google' },
      { utm_source: 'google' },
      { landing: '/about.html' },
    ),
    {
      first: { utm_source: 'google' },
      last: { utm_source: 'google' },
    },
  );
});

test('uses landing and referrer on the first attributed visit without making them attribution by themselves', () => {
  assert.deepEqual(
    mergeTouches(null, null, {
      utm_source: 'google',
      landing: '/snohomish-county',
      referrer: 'https://google.com',
    }),
    {
      first: {
        utm_source: 'google',
        landing: '/snohomish-county',
        referrer: 'https://google.com',
      },
      last: {
        utm_source: 'google',
        landing: '/snohomish-county',
        referrer: 'https://google.com',
      },
    },
  );
});

test('reads Meta cookies without retaining unrelated cookies', () => {
  assert.deepEqual(
    parseMetaCookies('_fbp=fb.1.1; session=secret; _fbc=fb.1.click'),
    { fbp: 'fb.1.1', fbc: 'fb.1.click' },
  );
});

test('does not replace a Meta latest touch with a persistent fbc cookie on navigation', () => {
  const landing = mergeTouches(null, null, {
    utm_source: 'facebook',
    utm_campaign: 'snoco-meta',
    fbclid: 'fb-click-1',
    fbc: 'fb.1.click',
    landing: '/snohomish-county',
  });

  assert.deepEqual(
    mergeTouches(landing.first, landing.last, {
      fbc: 'fb.1.click',
      landing: '/privacy.html',
      referrer: 'https://washingtonhomeoffers.com/snohomish-county',
    }),
    landing,
  );
});
