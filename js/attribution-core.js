(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root._smAttributionCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'gbraid',
    'wbraid',
    'msclkid',
    'fbclid'
  ];
  var MARKETING_KEYS = PARAMS.concat(['fbc']);

  function clean(value) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 240);
  }

  function parseTouch(search, landing, referrer) {
    var params = new URLSearchParams(search || '');
    var touch = {};
    PARAMS.forEach(function (key) {
      var value = clean(params.get(key) || '');
      if (value) touch[key] = value;
    });
    var cleanLanding = clean(landing || '');
    var cleanReferrer = clean(referrer || '');
    if (cleanLanding) touch.landing = cleanLanding;
    if (cleanReferrer) touch.referrer = cleanReferrer;
    return touch;
  }

  function parseMetaCookies(cookieString) {
    var found = {};
    String(cookieString || '').split(';').forEach(function (part) {
      var separator = part.indexOf('=');
      if (separator < 0) return;
      var name = part.slice(0, separator).trim();
      var value = clean(part.slice(separator + 1));
      if (name === '_fbp' && value) found.fbp = value;
      if (name === '_fbc' && value) found.fbc = value;
    });
    return found;
  }

  function hasMarketingSignal(touch) {
    return MARKETING_KEYS.some(function (key) { return Boolean(touch && touch[key]); });
  }

  function clone(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return Object.assign({}, value);
  }

  function mergeTouches(first, last, candidate) {
    var originalFirst = clone(first);
    var originalLast = clone(last);
    var next = clone(candidate) || {};
    if (!hasMarketingSignal(next)) {
      return { first: originalFirst, last: originalLast };
    }
    return {
      first: originalFirst || Object.assign({}, next),
      last: Object.assign({}, next)
    };
  }

  return {
    mergeTouches: mergeTouches,
    parseMetaCookies: parseMetaCookies,
    parseTouch: parseTouch
  };
});
