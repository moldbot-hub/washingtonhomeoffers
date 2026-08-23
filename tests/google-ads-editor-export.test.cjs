const test = require('node:test');
const assert = require('node:assert/strict');

const plan = require('../ads/snohomish-google-search.json');
const { buildRows, toCsv } = require('../ads/build-google-ads-editor-csv.cjs');

test('exports every campaign as Scratchpad and every ad as paused', () => {
  const rows = buildRows(plan);
  const campaignRows = rows.filter((row) => row['Campaign status']);
  const adRows = rows.filter((row) => row['Headline 1']);

  assert.equal(campaignRows.length, plan.campaigns.length);
  assert.ok(campaignRows.every((row) => row['Campaign status'] === 'Scratchpad'));
  assert.equal(adRows.length, plan.campaigns.reduce((sum, campaign) => sum + campaign.adGroups.length, 0));
  assert.ok(adRows.every((row) => row.Status === 'Paused'));
});

test('exports the county target, negative keywords, and account assets', () => {
  const rows = buildRows(plan);
  assert.equal(rows.filter((row) => row.Location === 'Snohomish County, Washington, United States').length, plan.campaigns.length);
  assert.ok(rows.some((row) => row.Type === 'Campaign negative' && row.Keyword === 'foreclosure help'));
  assert.equal(rows.filter((row) => row['Callout text']).length, plan.account.assets.callouts.length);
  assert.equal(rows.filter((row) => row['Sitelink text']).length, plan.account.assets.sitelinks.length);
});

test('produces a quoted UTF-8 CSV with recognized English headers', () => {
  const csv = toCsv(buildRows(plan));
  assert.match(csv, /^Campaign,Campaign Type,Campaign Daily Budget,Campaign status,/);
  assert.match(csv, /"SNCO \| Search \| Seller Intent"/);
  assert.match(csv, /Headline 15/);
  assert.match(csv, /Description 4/);
});
