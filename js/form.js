(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root._smLeadForm = api;
    api.init(root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var ATTRIBUTION_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'gbraid',
    'wbraid',
    'msclkid',
    'fbclid',
    'fbp',
    'fbc',
    'landing',
    'referrer'
  ];

  function clean(value) {
    return typeof value === 'string' ? value.trim().slice(0, 240) : '';
  }

  function normalizeTouch(value) {
    var touch = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return touch;
    ATTRIBUTION_KEYS.forEach(function (key) {
      var item = clean(value[key]);
      if (item) touch[key] = item;
    });
    return touch;
  }

  function legacyTouch(tracking) {
    var touch = {};
    var utm = tracking && tracking.utm && typeof tracking.utm === 'object' ? tracking.utm : {};
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (key) {
      var value = clean(utm[key]);
      if (value) touch['utm_' + key] = value;
    });
    var landing = clean(tracking && tracking.landingPage);
    var referrer = clean(tracking && tracking.referrer);
    if (landing) touch.landing = landing;
    if (referrer) touch.referrer = referrer;
    return touch;
  }

  function metaCookies(cookieString) {
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

  function buildLeadPayload(values, tracking, targetMarket, cookieString) {
    var trackingData = tracking && typeof tracking === 'object' ? tracking : {};
    var latest = normalizeTouch(trackingData.lastTouch);
    if (!Object.keys(latest).length) latest = legacyTouch(trackingData);
    var first = normalizeTouch(trackingData.firstTouch);
    if (!Object.keys(first).length) first = Object.assign({}, latest);
    Object.assign(latest, metaCookies(cookieString));

    var attribution = Object.assign({}, latest);
    ATTRIBUTION_KEYS.forEach(function (key) {
      if (first[key]) attribution['first_' + key] = first[key];
    });

    var payload = {
      name: clean(values && values.name),
      phone: clean(values && values.phone),
      email: clean(values && values.email) || null,
      propertyAddress: clean(values && values.propertyAddress),
      situation: clean(values && values.situation) || null,
      message: clean(values && values.message) || null,
      source: 'washingtonhomeoffers.com',
      attribution: attribution
    };
    var market = clean(targetMarket);
    if (market) payload.targetMarket = market;
    return payload;
  }

  function buildLeadAnalyticsEvent(attribution, targetMarket) {
    var touch = normalizeTouch(attribution);
    return {
      event: 'seller_lead_submitted',
      market: clean(targetMarket) || 'unspecified',
      source: touch.utm_source || 'direct',
      campaign: touch.utm_campaign || 'none'
    };
  }

  function resolveLeadEndpoint(explicitEndpoint) {
    return clean(explicitEndpoint) || 'https://www.setmate.ai/api/public/seller-lead';
  }

  function emitLeadEvents(root, attribution, targetMarket) {
    var event = buildLeadAnalyticsEvent(attribution, targetMarket);
    root.dataLayer = root.dataLayer || [];
    root.dataLayer.push(event);
    var eventParameters = {
      market: event.market,
      source: event.source,
      campaign: event.campaign
    };
    if (typeof root.gtag === 'function') root.gtag('event', 'generate_lead', eventParameters);
    if (typeof root.fbq === 'function') root.fbq('track', 'Lead', eventParameters);
  }

  function init(root) {
    var document = root.document;
    if (!document) return;
    var form = document.getElementById('lead-form');
    if (!form) return;
    var btn = document.getElementById('submit-btn');
    var status = document.getElementById('form-status');
    var success = document.getElementById('form-success');

    function value(name) {
      return (form[name] && form[name].value || '').trim();
    }

    function showError(message) {
      status.textContent = message;
      status.className = 'form-status error';
      status.style.display = 'block';
    }

    function reset() {
      btn.disabled = false;
      btn.textContent = 'Get My Cash Offer';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.style.display = 'none';
      status.className = 'form-status';

      var name = value('name');
      var phone = value('phone');
      var address = value('propertyAddress');
      if (!name) return showError('Please enter your name.');
      if (phone.replace(/\D/g, '').length < 10) return showError('Please enter a valid phone number.');
      if (!address) return showError('Please enter your property address.');
      if (!form.smsConsent || !form.smsConsent.checked) return showError('Please agree to be contacted so we can reach you.');

      var message = value('message');
      message = (message ? message + ' | ' : '') + 'Consented to calls/texts (SMS opt-in)';
      btn.disabled = true;
      btn.textContent = 'Sending...';

      var tracking = {};
      try {
        tracking = root._smTracking && root._smTracking.getData() || {};
      } catch (error) {
        tracking = {};
      }
      var targetMarket = form.getAttribute('data-target-market') || '';
      var leadEndpoint = resolveLeadEndpoint(form.getAttribute('data-lead-endpoint') || '');
      var payload = buildLeadPayload({
        name: name,
        phone: phone,
        email: value('email'),
        propertyAddress: address,
        situation: value('situation'),
        message: message
      }, tracking, targetMarket, document.cookie || '');

      root.fetch(leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        return response.json();
      }).then(function (result) {
        if (result && result.success) {
          emitLeadEvents(root, payload.attribution, targetMarket);
          form.style.display = 'none';
          success.style.display = 'block';
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          showError(result && result.error || 'Something went wrong. Please call us at (425) 548-1993.');
          reset();
        }
      }).catch(function () {
        showError('Could not submit. Please call us at (425) 548-1993.');
        reset();
      });
    });
  }

  return {
    buildLeadAnalyticsEvent: buildLeadAnalyticsEvent,
    buildLeadPayload: buildLeadPayload,
    init: init,
    resolveLeadEndpoint: resolveLeadEndpoint
  };
});
