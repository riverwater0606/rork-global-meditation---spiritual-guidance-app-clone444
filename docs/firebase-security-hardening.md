# Firebase Security Hardening

PSI-G previously relied on open Realtime Database rules. That meant any client on the internet could read, overwrite, or delete gifting and meditation data.

This repo now includes a managed ruleset:

- `/Users/luiyukhovitus/Documents/New project/rork-global-meditation---spiritual-guidance-app-clone444/firebase.json`
- `/Users/luiyukhovitus/Documents/New project/rork-global-meditation---spiritual-guidance-app-clone444/database.rules.json`

## What changed

1. Default deny
- Top-level `.read` and `.write` are now `false`.

2. Per-user binding layer
- The app now writes `userBindings/{auth.uid}` after Firebase auth is ready.
- Each binding stores:
  - `walletAddress`
  - `walletGiftId`
  - `walletMeditationId`
  - `username`
  - `usernameGiftId`

3. Meditation history protection
- `meditations/{userId}` is only readable and writable by:
  - the matching Firebase auth uid, or
  - the wallet-derived legacy meditation id tied to that uid binding

4. Gift protection
- Gift inboxes, sent history, received history, and audit entries are restricted using the binding ids.
- `giftAudit` is no longer publicly readable.

## Important limitation

This is a major improvement over public rules, but it is still not the final production-grade model.

Why:
- Firebase auth is still anonymous client auth.
- A malicious client could still sign in anonymously and try to bind arbitrary wallet/username values unless you move the binding write behind verified server trust.

## True production next step

For high-trust production security, move from anonymous Firebase auth to a server-issued identity flow:

1. User signs in with World Wallet Auth.
2. Your backend verifies the wallet session.
3. Your backend issues a Firebase Custom Auth token tied to the verified wallet/user.
4. The app signs into Firebase with that custom token.
5. Database rules rely on `auth.uid` or custom claims, not client-written bindings.

That is the professional end-state.

## Applying the rules

This machine currently does not have the Firebase CLI installed, so the rules have not been pushed automatically yet.

Use either:
- Firebase Console -> Realtime Database -> Rules -> paste `database.rules.json`
- or install Firebase CLI later and deploy with:

```bash
firebase deploy --only database
```

## Recommended rollout order

1. Apply the new rules in Firebase.
2. Confirm Anonymous Auth is still enabled during this transition.
3. Sign in once in PSI-G so `userBindings/{uid}` is created.
4. Test:
   - meditation record upload
   - gifting by `@username`
   - reading sent / received history
5. Plan the move to backend-issued Firebase custom auth.
