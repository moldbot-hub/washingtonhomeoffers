# Snohomish County Google Search launch package

This folder contains an import-ready Google Ads Editor build for Washington Home Offers. It is intentionally non-serving: campaign rows use `Scratchpad`, and every ad group, keyword, and ad is paused.

## Files

- `snohomish-google-search.json` is the source of truth for budget, targeting, keywords, ads, negatives, and assets.
- `build-google-ads-editor-csv.cjs` generates the Editor import.
- `google-ads-editor-snohomish.csv` is the generated import file.

Regenerate the CSV after changing the JSON:

```powershell
node ads\build-google-ads-editor-csv.cjs
```

Run the launch-package checks:

```powershell
node --test tests\*.test.cjs
```

## Approved starting allocation

| Campaign | Daily budget | Purpose |
| --- | ---: | --- |
| `SNCO | Search | Seller Intent` | $93.68 | Phrase/exact motivated-seller searches |
| `SNCO | Search | Brand` | $5 | Protect Washington Home Offers brand searches |
| Total | $98.68/day | At or below $3,000 using Google's 30.4-day billing-month calculation |

The seller campaign starts on Maximize Clicks with a $25 maximum CPC guardrail. Do not switch to Maximize Conversions until the imported `generate_lead` conversion is verified and SetMate has received at least 15 qualified paid leads.

## Required manual settings before anything can serve

Google Ads Editor cannot safely express every account-level or advanced targeting choice in this CSV. Confirm each item after import and before posting:

1. Use `https://washingtonhomeoffers.com/snohomish-county` as the website destination. Do not use the unrelated `David Yerokhin` Business Profile that Google currently suggests.
2. Target only `Snohomish County, Washington, United States`.
3. Set the positive location option to **Presence: people in or regularly in the targeted location**. Do not use presence-or-interest.
4. Keep Google Search only. Disable Search Partners and the Display Network.
5. Because this is housing-related advertising, leave every age, gender, and parental-status group enabled. Do not add ZIP-code targeting or demographic exclusions.
6. Use English and the 7:00 a.m.–10:00 p.m. Pacific schedule in the plan.
7. Turn on auto-tagging. Keep the campaign UTM suffixes from the JSON/CSV.
8. Disable automatically created assets and broad-match expansion for the initial test.
9. Link the Google Analytics property that owns measurement ID `G-F5N9DBL4ZW`.
10. Import the GA4 `generate_lead` event into Google Ads as the primary seller-lead conversion only after a successful SetMate submission has been observed end to end.
11. Verify that `(425) 548-1993` reaches the correct acquisitions line before adding a call asset or call conversion. The import intentionally omits the call asset until that check is complete.
12. Keep both campaigns paused until billing, conversion tracking, landing-page deployment, and SetMate deployment are all verified.

## Import workflow

1. Open the correct Google Ads account in Google Ads Editor.
2. Choose **Account → Import → From file**, then select `google-ads-editor-snohomish.csv`.
3. Review the detected English column headers and import the proposed changes.
4. Keep the proposed changes, then run **Check changes**.
5. Resolve the Snohomish County location name if Editor asks for a location match.
6. Apply every manual setting above.
7. Post only after the launch gates pass. Posting must still leave campaigns paused.

## Launch gates

- The live landing page returns a successful response on desktop and mobile.
- A test seller can submit without opting into SMS; SMS consent is recorded only when checked.
- A successful form submission creates or updates a SetMate contact with paid-click attribution.
- `targetMarket`, `propertyCounty`, and `marketStatus` appear in SetMate for the Snohomish funnel.
- Out-of-county and unresolved addresses are visible as `out_of_market` or `needs_review`; they are not silently treated as Snohomish leads.
- The GA4 `generate_lead` event fires only after the SetMate endpoint returns success and contains no seller PII or click identifier.
- Google Ads shows the imported conversion as receiving data.
- Billing is valid, the account time zone is Pacific, and currency is USD.
- A human confirms the final campaign summary and then enables only the intended campaign.

## First 30 days

- Days 1–3: review search terms daily, block buyer/renter/education traffic, and confirm every paid lead in SetMate.
- Days 4–7: compare raw CPL with qualified CPL; do not optimize against unqualified form volume.
- Week 2: pause keywords that spend 1.5× the current qualified-CPL target without producing a qualified lead, unless the query volume is too small to judge.
- Weeks 3–4: move budget toward the ad groups producing conversations, appointments, and offers. Keep the brand campaign capped at $5/day.
- After 15 qualified leads: evaluate Maximize Conversions. Do not switch merely because Google recommends it.

The initial operating target is 8–12 qualified seller leads from the $3,000 test, or roughly $250–$375 per qualified lead. This is a planning range, not a market promise. Replace it with the actual SetMate cost per qualified conversation, appointment, offer, and signed contract as soon as data exists.

## Source notes

- Google Ads Editor CSV guidance: https://support.google.com/google-ads/editor/answer/56368
- Google Ads Editor columns and Scratchpad status: https://support.google.com/google-ads/editor/answer/57747
- Google housing-ad targeting restrictions: https://support.google.com/adspolicy/answer/16701755
- Google location targeting guidance: https://support.google.com/google-ads/answer/2453995
