# PSI-G

PSI-G is a spiritual guidance and meditation mini app built with Expo Router.  
This local workspace is set up for fast web development, mobile-style regression testing, and World Mini App integration work.

## What is already wired

- Expo Router app with local web development scripts
- `DEV FULL MOCK MODE` for bypassing wallet / awakened orb / VIP gating during local UI testing
- World Wallet Auth frontend flow with backend nonce/verify contract
- World VIP payment frontend flow with backend create/confirm contract
- Local World mock backend for end-to-end development without production services
- Mobile Playwright smoke tests for Garden, Meditate, Sign In/VIP, and Notifications

## Quick start

Install dependencies:

```bash
npm install
```

Create your local env file from the template:

```bash
cp .env.example .env
```

Start the local World mock backend:

```bash
npm run world:mock
```

In a second terminal, start the app for web development with the mock backend:

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 npm run dev:web
```

Open the app locally:

- Web: `http://localhost:8081`
- Mobile on the same Wi-Fi: use your computer's LAN IP with port `8081`

## Core commands

Run local app:

```bash
npm run dev
```

Run web app:

```bash
npm run dev:web
```

Run iOS Simulator:

```bash
npm run ios
```

Run mobile smoke tests:

```bash
npm run mobile:test
```

Run headed mobile smoke tests:

```bash
npm run mobile:test:headed
```

Run lint:

```bash
npm run lint
```

Validate Firebase rules JSON:

```bash
npm run firebase:rules:check
```

Build a web export:

```bash
npm run export
```

Run Expo environment checks:

```bash
npm run doctor
```

## Vercel workflow

List linked Vercel env variables:

```bash
npm run vercel:env:ls
```

Pull Vercel env variables into a local file:

```bash
npm run vercel:env:pull
```

Create a preview deployment:

```bash
npm run deploy:preview
```

Create a production deployment:

```bash
npm run deploy:prod
```

## World Mini App local development

The app expects backend endpoints for:

- Wallet Auth nonce
- Wallet Auth verify
- VIP payment create
- VIP payment confirm

For local development, use the included mock backend:

```bash
npm run world:mock
```

Health check:

```bash
npm run world:mock:health
```

Related docs:

- [Local World dev](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-local-dev.md)
- [World App real device testing](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-real-device-testing.md)
- [Vercel preview workflow for World App](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/vercel-preview-world-workflow.md)
- [Wallet auth backend contract](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-wallet-auth-backend.md)
- [VIP payment backend contract](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-vip-payment-backend.md)
- [VIP product spec](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/vip-product-spec.md)
- [PSI-G tokenomics v0](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/psig-tokenomics-v0.md)
- [PSI-G economy spec v1](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/psig-economy-spec-v1.md)
- [Lightweight gstack adaptation](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/lightweight-gstack-adaptation.md)
- [World App support agent](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-app-support-agent.md)
- [Firebase security hardening](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/firebase-security-hardening.md)
- [World Mini App submission checklist](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-miniapp-submission-checklist.md)
- [.env example](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/.env.example)
- [.env production example](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/.env.production.example)

## Environment flags

- [env.ts](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/constants/env.ts) now reads:
  - `EXPO_PUBLIC_LOCAL_DEV`
  - `EXPO_PUBLIC_DEV_FULL_MOCK`

Default behavior:

- in local development: both flags default to `true`
- in production builds: both flags default to `false`

Examples:

```bash
EXPO_PUBLIC_LOCAL_DEV=true EXPO_PUBLIC_DEV_FULL_MOCK=true npm run dev:web
```

```bash
EXPO_PUBLIC_LOCAL_DEV=false EXPO_PUBLIC_DEV_FULL_MOCK=false npm run dev:web
```

This keeps local development fast, while making it much harder to accidentally ship a production build with mock bypasses still enabled.

## Notes

- `npm run ios` requires full Xcode with iOS Simulator installed.
- `mobile:test` uses Playwright with an `iPhone 15 Pro` profile against the Expo web app.
- The app includes WebGL fallback behavior for headless/mobile browser automation.
- Firebase includes local-friendly fallback config so the app can boot without a full production setup.
