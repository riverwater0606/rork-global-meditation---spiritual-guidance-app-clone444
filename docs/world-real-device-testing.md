# World App Real Device Testing

Use this guide when you want to validate PSI-G inside a real World App environment instead of the local mock flow.

## Goal

Confirm that these flows work on a real device inside World App:

- Wallet Auth sign-in
- Contact sharing / gifting
- VIP payment
- Notification permission and reminder behavior

## Before testing

Prepare a production-like env:

```bash
cp .env.production.example .env
```

Set real values in `.env`:

- `EXPO_PUBLIC_LOCAL_DEV=false`
- `EXPO_PUBLIC_DEV_FULL_MOCK=false`
- `EXPO_PUBLIC_API_BASE_URL=<your real backend>`
- real Firebase values

Make sure your backend supports:

- `POST /api/world/wallet-auth/nonce`
- `POST /api/world/wallet-auth/verify`
- `POST /api/world/payments/vip/create`
- `POST /api/world/payments/vip/confirm`

## Start the app

For local network testing:

```bash
npm run dev:web
```

For remote/tunnel testing:

```bash
npm run dev:web:tunnel
```

## In World App

1. Open the PSI-G Mini App inside World App.
2. Confirm the app does not show local dev or mock banners.
3. Try sign-in with Wallet Auth.
4. Confirm the profile shows a real username-first identity if available.
5. Try the VIP upgrade flow with a real backend/payment environment.
6. Try gifting and confirm contacts permission is requested properly.
7. Open notifications settings and confirm permission state behaves correctly on device.

## What to verify

### Sign-in

- Wallet Auth opens and returns successfully
- Backend nonce is accepted
- Backend verify returns a real session
- The app lands inside the authenticated flow

### VIP

- Payment intent is created by backend
- World payment sheet opens correctly
- Backend confirm succeeds
- VIP UI unlocks only after confirmation

### Gifting

- Contact picker opens from World App
- Contacts permission request is understandable
- Selected contact returns a wallet
- Gift success UI appears cleanly

### Notifications

- Notification permission state is visible
- Denied permission can be retried or sent to settings
- Reminder scheduling works on device

## Common failure causes

- `EXPO_PUBLIC_LOCAL_DEV` still set to `true`
- `EXPO_PUBLIC_DEV_FULL_MOCK` still set to `true`
- `EXPO_PUBLIC_API_BASE_URL` still points to local mock backend
- backend nonce/verify not implemented fully
- backend payment confirm not verifying real payment state
- World App or MiniKit version too old

## Recommended final check

Run these before shipping:

```bash
npm run lint
npm run mobile:test
```

Then do one full manual pass inside real World App on a phone before release.
