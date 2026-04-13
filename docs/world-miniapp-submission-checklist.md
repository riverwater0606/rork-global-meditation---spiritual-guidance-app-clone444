# World Mini App Submission Checklist

Use this checklist before submitting PSI-G to World App.

## Identity and auth

- [ ] Wallet Auth uses a backend-generated nonce
- [ ] Wallet Auth signatures are verified on the backend
- [ ] Session tokens are stored and reused safely
- [ ] Old World ID sign-in assumptions are removed from the primary login path
- [ ] User-facing identity prefers `username` over raw wallet address wherever possible

## Payments and premium

- [ ] VIP upgrade uses backend-created payment intent/reference
- [ ] `WORLD_DEV_PORTAL_API_KEY` configured so backend `Get Transaction` can confirm mined payments without fallback timeouts
- [ ] Payment success is confirmed on the backend before premium access is granted
- [ ] Supported token and recipient configuration match current World requirements
- [ ] Payment cancellation and failure states show clear user-facing messages

## Permissions and notifications

- [ ] Notification permission state is visible in the app
- [ ] Users can re-request notification permission or jump to system settings
- [ ] Contacts permission failure during gifting is clearly explained
- [ ] World App / MiniKit unavailable states have friendly fallback copy

## Product behavior

- [ ] App can recover from poor network conditions without infinite loading
- [ ] Error boundaries and retry states are user-friendly
- [ ] Gifting, sign-in, VIP, and notifications all have graceful failure handling
- [ ] Web / non-World fallback behavior is understandable and not misleading

## World App fit

- [ ] App name, description, and metadata do not include clone/dev wording
- [ ] App copy clearly explains why World App is the best experience
- [ ] In-app language matches the final brand and submission metadata
- [ ] The app feels mobile-first and touch-friendly across key flows

## Policy and review readiness

- [ ] No misleading rewards, financial claims, or unverifiable promises
- [ ] Permissions requested in the app are justified by visible user value
- [ ] Audio, notifications, and gifting behavior feel intentional rather than spammy
- [ ] Debug-only states, banners, and mock flags are disabled before production release

## Testing

- [ ] `npm run lint` passes
- [ ] `npm run mobile:test` passes
- [ ] Sign-in flow tested inside a real World App environment
- [ ] VIP payment tested against a real backend and payment environment
- [ ] Notifications tested on a real device
- [ ] Contact sharing tested inside World App with actual permissions
- [ ] Manual pass completed using [World App real device testing](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-real-device-testing.md)

## Before release

- [ ] Set production `EXPO_PUBLIC_API_BASE_URL`
- [ ] Set `EXPO_PUBLIC_LOCAL_DEV=false`
- [ ] Set `EXPO_PUBLIC_DEV_FULL_MOCK=false`
- [ ] Replace mock/test payment or wallet values
- [ ] Finalize app icon, splash, and store-style metadata
- [ ] Prepare a production `.env` from [.env.example](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/.env.example)

## Useful references

- [Local World dev](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-local-dev.md)
- [Wallet auth backend contract](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-wallet-auth-backend.md)
- [VIP payment backend contract](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-vip-payment-backend.md)
