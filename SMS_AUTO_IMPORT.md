# Auto-add expenses from bank SMS (free)

No website can read your SMS inbox — browsers block that for every site, including
this one. So this works by using a free Android automation app that reads the SMS
on your phone and pushes the parsed amount straight into your Firestore database,
using the same free Firebase project this app already uses. No paid app, no server,
no extra hosting cost.

**Tool: [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)**
— free tier allows up to 5 macros, which is plenty since you only need one.

## How it works

```
Bank sends SMS → MacroDroid reads it → extracts amount with regex
→ signs in to Firebase → creates a document in your transactions collection
```

It writes into the **same** `transactions` collection the app already uses, tagged
with `source: "sms-auto"` and a note, so it shows up instantly on your Dashboard/
Expenses page — and if a message gets misparsed, you edit/delete it there exactly
like any manual entry.

## 1. Get a refresh token (one-time, do this yourself — don't share the result with anyone, including me)

Your Firebase Web API key is the `apiKey` already in `src/environments/environment.ts`.
Using a terminal (or Postman) **on your own machine**, run:

```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_LOGIN_EMAIL","password":"YOUR_LOGIN_PASSWORD","returnSecureToken":true}'
```

The response contains `"refreshToken": "..."` and `"localId": "..."` (this second one
is your **uid** — copy both). This refresh token is what MacroDroid will use forever
after — your password itself never needs to touch your phone's automation config.

## 2. MacroDroid macro

**Trigger:** SMS Received → filter by sender containing your bank's ID (e.g. `HDFCBK`, `SBIINB`) so it ignores unrelated texts.

**Action 1 — Regex to pull the amount** (Local Variable action, or built into the
SMS trigger's "Received Text" variable). A generic starting pattern for Indian bank
debit alerts:

```
(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s*(?:debited|spent|paid|dr)
```

Every bank phrases this differently, so test with a real SMS and adjust. Store the
matched amount (strip commas) into a variable, e.g. `[amount]`.

**Action 2 — HTTP Request: refresh the token** (tokens expire hourly, so do this every run):

- URL: `https://securetoken.googleapis.com/v1/token?key=YOUR_API_KEY`
- Method: POST
- Body (form): `grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN`
- Parse JSON response → save `id_token` as a variable, e.g. `[idtoken]`

**Action 3 — HTTP Request: create the transaction:**

- URL: `https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/users/YOUR_UID/transactions`
- Method: POST
- Header: `Authorization: Bearer [idtoken]`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "fields": {
    "title": {"stringValue": "SMS Auto Entry"},
    "category": {"stringValue": "Other"},
    "amount": {"doubleValue": [amount]},
    "date": {"stringValue": "{today's date, YYYY-MM-DD}"},
    "notes": {"stringValue": "Auto-imported from SMS"},
    "source": {"stringValue": "sms-auto"}
  }
}
```

(`YOUR_PROJECT_ID` is the `projectId` from `environment.ts`; `YOUR_UID` is the
`localId` from step 1.)

That's it — no billing, no server, and it reuses the Firestore security rules
already in place (a write only succeeds because the request is authenticated as
you).

## Caveats

- Bank SMS formats vary a lot — expect to tune the regex per bank, and expect the
  occasional missed/garbled entry (fix it manually in the app, same as any typo).
- The refresh token grants ongoing write access to your account from your phone. If
  you ever suspect it leaked, revoke it: Firebase Console → Authentication → your
  user → **Disable account**, then re-enable and sign in again to get a fresh one.
- This only works on Android. iOS doesn't allow any app (free or paid) to read
  SMS content for automation — Apple blocks it entirely.
