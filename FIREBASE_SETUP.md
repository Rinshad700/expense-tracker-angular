# Connect this app to Firebase (free)

The app now stores data in Firestore instead of `localStorage`, behind a simple
email/password login (see `src/app/services/auth.service.ts` and the services in
`src/app/services/`). You need a Firebase project before it will actually work.

## 1. Create the project

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. **Add project** → give it any name → you can decline Google Analytics (not needed).
3. This puts you on the **Spark (free) plan** by default — no billing required.

## 2. Enable Firestore

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Production mode** (we set our own rules below).
3. Pick a region close to you (can't be changed later) and confirm.

## 3. Enable email/password sign-in

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.

## 4. Register a web app and get the config

1. **Project settings** (gear icon, top left) → **General** tab.
2. Under "Your apps", click the **</>** (web) icon → give it any nickname → **Register app**.
   (Skip "Firebase Hosting" — you're already deploying to GitHub Pages.)
3. Copy the `firebaseConfig` object shown.
4. Paste those values into `src/environments/environment.ts` in this repo, replacing the
   placeholders (`YOUR_API_KEY`, etc).

This config is not a secret — it's meant to ship in frontend code. Access to your
data is controlled by the security rules below, not by hiding this object. It's fine
to commit it even in a public GitHub repo.

## 5. Lock down access with security rules

In **Firestore Database → Rules**, replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**. This means each signed-in user can only read/write their own
`users/{their-uid}/...` data — nobody else's.

## 6. Try it

```
npm start
```

Open the app, you'll land on a **Sign In / Create Account** screen — create an
account with any email + password (6+ characters). Your expenses/trips now sync to
Firestore in real time and will follow you to any device you log into.

## Free tier limits (Spark plan)

- Firestore: 1 GiB storage, 50k reads/20k writes/20k deletes **per day**
- Auth: unlimited email/password users

That's far more than a personal expense tracker will ever use — no billing needed
unless you deliberately upgrade the plan.

## Deploying (GitHub Pages)

No changes needed — `.github/workflows/deploy.yml` still just runs `npm run build`
and publishes the static output, which now includes your Firebase config baked in.
