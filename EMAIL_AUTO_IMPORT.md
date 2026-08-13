# Auto-add expenses and income from bank email (free)

Based on your HDFC Bank email formats — debit:

> Rs.540.00 is debited from your account ending 7760 towards VPA qr.haoming@sib (HAOMING) on 08-08-26.

and credit:

> We're writing to inform you that Rs.120.00 has been successfully credited to
> your HDFC Bank account ending in 7760.
> Date: 13-08-26
> Sender: JEENA J (VPA: jeenahari994@oksbi)

This uses **Google Apps Script** — free forever, runs on Google's servers (not
your phone), and needs no separate backend. It checks your inbox every minute
for new debit AND credit emails. Debits get parsed into your Firestore
`transactions` collection (guessing a category); credits get parsed into your
`income` collection as their own entry for that month — both are the same
collections your Dashboard/Expenses/Income pages already read, so entries
show up automatically and the Total Balance updates on its own. You can
edit/delete any auto-imported entry like a manual one if something parses wrong.

## 1. Get a Firebase refresh token + uid (skip if you already did this)

On your own machine (not your phone), run — filling in your real login email/password:

```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDYGKatK_Xho4sEGjdFm5J1PMrCtDQqkGY" \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD","returnSecureToken":true}'
```

Or open your browser's DevTools → Network tab → filter by "signIn" → log into
the app → find the `accounts:signInWithPassword` request → check its Response
for the same fields.

Copy `refreshToken` and `localId` (your uid) from the response. Keep them private — don't paste them to anyone.

## 2. Create the Apps Script

1. Go to https://script.google.com → **New project**.
2. Delete the default `myFunction` code and paste in the script below.
3. Click the **gear icon** (Project Settings) → scroll to **Script Properties** → add two properties:
   - `FIREBASE_REFRESH_TOKEN` → paste your refresh token
   - `FIREBASE_UID` → paste your uid

```javascript
const FIREBASE_API_KEY = 'AIzaSyDYGKatK_Xho4sEGjdFm5J1PMrCtDQqkGY';
const FIREBASE_PROJECT_ID = 'expensive-59992';
const LABEL_NAME = 'ExpenseTrackerProcessed';

const DEBIT_SEARCH = 'from:alerts@hdfcbank.bank.in "is debited from your account"';
const CREDIT_SEARCH = 'from:alerts@hdfcbank.bank.in "has been successfully credited"';

// Matches "Rs.540.00 is debited from your account ending 7760 towards
// VPA qr.haoming@sib (HAOMING) on 08-08-26." — tune this if your bank's
// wording differs from the sample.
function parseDebit(body) {
  const amountMatch = body.match(/Rs\.?\s*([\d,]+\.\d{2})\s+is debited/i);
  const merchantMatch = body.match(/\(([^)]+)\)/);
  const dateMatch = body.match(/on (\d{2})-(\d{2})-(\d{2})/);

  if (!amountMatch || !dateMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  const merchant = merchantMatch ? merchantMatch[1] : 'Bank Transaction';
  const [, day, month, year] = dateMatch;
  const date = `20${year}-${month}-${day}`;

  return { title: merchant, amount, date, category: guessCategory(merchant) };
}

// Matches:
// "...Rs.120.00 has been successfully credited to your HDFC Bank account..."
// "Date: 13-08-26"
// "Sender: JEENA J (VPA: jeenahari994@oksbi)"
function parseCredit(body) {
  const amountMatch = body.match(/Rs\.?\s*([\d,]+\.\d{2})\s+has been successfully credited/i);
  const dateMatch = body.match(/Date:\s*(\d{2})-(\d{2})-(\d{2})/);
  const senderMatch = body.match(/Sender:\s*([^(]+)\(/);

  if (!amountMatch || !dateMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  const sender = senderMatch ? senderMatch[1].trim() : 'Unknown';
  const [, day, month, year] = dateMatch;
  const yearMonth = `20${year}-${month}`;

  return { amount, month: yearMonth, note: `Received from ${sender}` };
}

// Simple keyword rules against the app's existing category list. Falls back
// to "Other" — easy to fix by hand in the app when a guess is wrong.
const CATEGORY_RULES = [
  { category: 'Food', keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dominos', 'pizza', 'mcdonald', 'kfc', 'hotel'] },
  { category: 'Petrol', keywords: ['petrol', 'fuel', 'diesel', 'hpcl', 'iocl', 'bharat petroleum', 'shell', 'indian oil'] },
  { category: 'Transport', keywords: ['uber', 'ola', 'metro', 'taxi', 'cab', 'rapido'] },
  { category: 'Shopping', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'mart'] },
  { category: 'Medical', keywords: ['pharmacy', 'medical', 'hospital', 'clinic', 'apollo', 'medplus', 'chemist'] },
  { category: 'Entertainment', keywords: ['netflix', 'spotify', 'hotstar', 'prime video', 'bookmyshow', 'pvr', 'inox'] },
  { category: 'Utilities', keywords: ['electricity', 'water bill', 'recharge', 'broadband', 'airtel', 'jio', 'vodafone', 'wifi'] },
  { category: 'Education', keywords: ['fees', 'tuition', 'course', 'udemy', 'coursera', 'school', 'college'] },
  { category: 'Travel', keywords: ['irctc', 'makemytrip', 'goibibo', 'oyo', 'airbnb', 'flight', 'railway'] }
];

function guessCategory(merchantText) {
  const text = merchantText.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(keyword => text.includes(keyword))) {
      return rule.category;
    }
  }
  return 'Other';
}

function processTransactionEmails() {
  const label = GmailApp.getUserLabelByName(LABEL_NAME) || GmailApp.createLabel(LABEL_NAME);
  const idToken = getFirebaseIdToken();

  const debitThreads = GmailApp.search(DEBIT_SEARCH + ' -label:' + LABEL_NAME);
  debitThreads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const parsed = parseDebit(message.getPlainBody());
      if (parsed) {
        createFirestoreDoc(idToken, 'transactions', {
          title: parsed.title,
          category: parsed.category,
          amount: parsed.amount,
          date: parsed.date,
          notes: 'Auto-imported from email',
          source: 'email-auto'
        });
      }
    });
    thread.addLabel(label);
  });

  const creditThreads = GmailApp.search(CREDIT_SEARCH + ' -label:' + LABEL_NAME);
  creditThreads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const parsed = parseCredit(message.getPlainBody());
      if (parsed) {
        createFirestoreDoc(idToken, 'income', {
          amount: parsed.amount,
          month: parsed.month,
          note: parsed.note
        });
      }
    });
    thread.addLabel(label);
  });
}

function getFirebaseIdToken() {
  const refreshToken = PropertiesService.getScriptProperties().getProperty('FIREBASE_REFRESH_TOKEN');
  const response = UrlFetchApp.fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: `grant_type=refresh_token&refresh_token=${refreshToken}`
    }
  );
  return JSON.parse(response.getContentText()).id_token;
}

function createFirestoreDoc(idToken, collectionName, fields) {
  const uid = PropertiesService.getScriptProperties().getProperty('FIREBASE_UID');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}/${collectionName}`;

  const payload = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        typeof value === 'number' ? { doubleValue: value } : { stringValue: value }
      ])
    )
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${idToken}` },
    payload: JSON.stringify(payload)
  });
}

// Run this manually from the Apps Script editor whenever you want to
// (re)schedule the recurring check — it clears any existing trigger for this
// function first, so running it again is always safe and never creates
// duplicates.
function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processTransactionEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processTransactionEmails')
    .timeBased()
    .everyMinutes(1)
    .create();
}
```

## 3. Run it once to authorize and schedule

1. In the Apps Script editor, select the `createTrigger` function from the dropdown next to the Run button, then click **Run**.
2. Google will ask you to authorize — it needs Gmail (read) and external requests (to reach Firebase). Approve it (you'll see an "unverified app" warning since this is your own private script — click **Advanced → Go to project (unsafe)** to proceed; it's only unsafe-looking because it's not published, not because it does anything untrusted).
3. That's it — `processTransactionEmails` now runs automatically every minute and checks your Gmail for both new debit and credit emails.

## 4. Test it

Manually run `processTransactionEmails` once from the Apps Script editor. Check your app's Expenses page for new debits, and your Income page (and the Dashboard's Total Balance) for new credits.

## Notes

- **Duplicates**: once an email is processed (debit or credit), it gets the `ExpenseTrackerProcessed` label and is skipped on future runs.
- **Every credit becomes its own income entry** — if you get multiple credits in the same month, you'll see multiple entries for that month rather than one combined total. That's intentional: it keeps each credit auditable/deletable on its own, and the Income page already sums everything into Total Balance regardless of how many entries exist per month.
- **Category** for debits is guessed from simple keyword rules — check `CATEGORY_RULES` in the script and add your own keywords/categories if the guesses aren't matching your spending patterns.
- If your bank ever changes its email wording, the regex in `parseDebit`/`parseCredit` will stop matching — paste me the new sample and I'll update it.
