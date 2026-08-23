const fs = require('node:fs');
const path = require('node:path');

const HEADERS = [
  'Campaign',
  'Campaign Type',
  'Campaign Daily Budget',
  'Campaign status',
  'Networks',
  'Languages',
  'Bid Strategy Type',
  'Maximum CPC bid limit',
  'Final URL suffix',
  'Location',
  'Ad Group',
  'Ad Group Status',
  'Max CPC',
  'Keyword',
  'Type',
  'Status',
  'Final URL',
  'Path 1',
  'Path 2',
  ...Array.from({ length: 15 }, (_, index) => `Headline ${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `Description ${index + 1}`),
  'Callout text',
  'Sitelink text',
  'Platform targeting',
];

function buildRows(plan) {
  const rows = [];

  for (const campaign of plan.campaigns) {
    const maxCpc = campaign.bidStrategy.maximumCpcBidUsd || '';
    rows.push({
      Campaign: campaign.name,
      'Campaign Type': campaign.campaignType,
      'Campaign Daily Budget': campaign.dailyBudgetUsd,
      'Campaign status': campaign.status,
      Networks: campaign.networks.join(';'),
      Languages: campaign.languages.join(';'),
      'Bid Strategy Type': campaign.bidStrategy.type,
      'Maximum CPC bid limit': maxCpc,
      'Final URL suffix': campaign.finalUrlSuffix,
    });

    for (const callout of plan.account.assets.callouts) {
      rows.push({
        Campaign: campaign.name,
        'Callout text': callout,
        Status: 'Paused',
      });
    }
    for (const sitelink of plan.account.assets.sitelinks) {
      rows.push({
        Campaign: campaign.name,
        'Sitelink text': sitelink.text,
        'Description 1': sitelink.description1,
        'Description 2': sitelink.description2,
        'Final URL': sitelink.finalUrl,
        'Platform targeting': 'All',
        Status: 'Paused',
      });
    }

    for (const location of campaign.locations) {
      rows.push({ Campaign: campaign.name, Location: location });
    }

    for (const negative of campaign.negativeKeywords) {
      rows.push({ Campaign: campaign.name, Keyword: negative, Type: 'Campaign negative' });
    }

    for (const group of campaign.adGroups) {
      rows.push({
        Campaign: campaign.name,
        'Ad Group': group.name,
        'Ad Group Status': 'Paused',
        'Max CPC': maxCpc,
      });

      for (const keyword of group.keywords) {
        rows.push({
          Campaign: campaign.name,
          'Ad Group': group.name,
          Keyword: keyword.text,
          Type: keyword.matchType,
          Status: 'Paused',
        });
      }

      const adRow = {
        Campaign: campaign.name,
        'Ad Group': group.name,
        Status: 'Paused',
        'Final URL': group.ad.finalUrl,
        'Path 1': group.ad.path1,
        'Path 2': group.ad.path2,
      };
      group.ad.headlines.forEach((headline, index) => {
        adRow[`Headline ${index + 1}`] = headline;
      });
      group.ad.descriptions.forEach((description, index) => {
        adRow[`Description ${index + 1}`] = description;
      });
      rows.push(adRow);
    }
  }

  return rows;
}

function quote(value) {
  if (value === undefined || value === null || value === '') return '';
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  const lines = [HEADERS.join(',')];
  for (const row of rows) lines.push(HEADERS.map((header) => quote(row[header])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

if (require.main === module) {
  const plan = require('./snohomish-google-search.json');
  fs.writeFileSync(path.join(__dirname, 'google-ads-editor-snohomish.csv'), toCsv(buildRows(plan)), 'utf8');
}

module.exports = { HEADERS, buildRows, toCsv };
