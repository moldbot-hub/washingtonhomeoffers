const test = require('node:test');
const assert = require('node:assert/strict');

const plan = require('../ads/snohomish-google-search.json');

test('caps the approved budget at $3,000 per Google billing month', () => {
  assert.equal(plan.account.monthlyBudgetUsd, 3000);
  const daily = plan.campaigns.reduce((sum, campaign) => sum + campaign.dailyBudgetUsd, 0);
  assert.equal(daily, 98.68);
  assert.ok(daily * 30.4 <= plan.account.monthlyBudgetUsd);
});

test('keeps every campaign in a non-serving draft state', () => {
  assert.ok(plan.campaigns.length >= 2);
  for (const campaign of plan.campaigns) {
    assert.equal(campaign.status, 'Scratchpad');
    assert.deepEqual(campaign.networks, ['Google Search']);
  }
});

test('targets only Snohomish County residents and respects housing-ad restrictions', () => {
  for (const campaign of plan.campaigns) {
    assert.deepEqual(campaign.locations, ['Snohomish County, Washington, United States']);
    assert.equal(campaign.positiveLocationOption, 'Presence');
    assert.deepEqual(campaign.demographics, {
      age: 'All enabled',
      gender: 'All enabled',
      parentalStatus: 'All enabled',
    });
    assert.deepEqual(campaign.postalCodes, []);
  }
});

test('uses only phrase and exact seller-intent keywords', () => {
  const seller = plan.campaigns.find((campaign) => campaign.slug === 'seller-intent');
  assert.ok(seller);
  assert.ok(seller.adGroups.length >= 4);
  for (const group of seller.adGroups) {
    assert.ok(group.keywords.length >= 4);
    for (const keyword of group.keywords) {
      assert.match(keyword.matchType, /^(Phrase|Exact)$/);
    }
  }
});

test('keeps responsive search ads inside Google asset limits and avoids risky claims', () => {
  const forbidden = /guaranteed|highest offer|best price|#1|stop foreclosure|foreclosure rescue/i;
  for (const campaign of plan.campaigns) {
    for (const group of campaign.adGroups) {
      assert.ok(group.ad.headlines.length >= 3 && group.ad.headlines.length <= 15);
      assert.ok(group.ad.descriptions.length >= 2 && group.ad.descriptions.length <= 4);
      for (const headline of group.ad.headlines) {
        assert.ok(headline.length <= 30, `Headline too long: ${headline}`);
        assert.doesNotMatch(headline, forbidden);
      }
      for (const description of group.ad.descriptions) {
        assert.ok(description.length <= 90, `Description too long: ${description}`);
        assert.doesNotMatch(description, forbidden);
      }
      assert.ok(group.ad.path1.length <= 15);
      assert.ok(group.ad.path2.length <= 15);
      assert.match(group.ad.finalUrl, /^https:\/\/washingtonhomeoffers\.com\/snohomish-county$/);
    }
  }
});

test('includes the core waste-control negatives', () => {
  const seller = plan.campaigns.find((campaign) => campaign.slug === 'seller-intent');
  const negatives = new Set(seller.negativeKeywords.map((keyword) => keyword.toLowerCase()));
  for (const expected of ['jobs', 'real estate course', 'wholesale contract', 'homes for sale', 'rent', 'mortgage', 'foreclosure help']) {
    assert.ok(negatives.has(expected), `Missing negative keyword: ${expected}`);
  }
});

test('includes import-ready account assets within Google limits', () => {
  assert.ok(plan.account.assets.callouts.length >= 4);
  assert.ok(plan.account.assets.sitelinks.length >= 4);
  for (const callout of plan.account.assets.callouts) assert.ok(callout.length <= 25);
  for (const sitelink of plan.account.assets.sitelinks) {
    assert.ok(sitelink.text.length <= 25);
    assert.ok(sitelink.description1.length <= 35);
    assert.ok(sitelink.description2.length <= 35);
    assert.match(sitelink.finalUrl, /^https:\/\/washingtonhomeoffers\.com\/snohomish-county#/);
  }
});
