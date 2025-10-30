# World App Meditation Mini-App

A regenerated Expo Router experience for the World App meditation and spiritual guidance mini-app. The project adheres to Expo SDK 52 with React 18 and is tuned for Vercel web exports while preserving World ID gated features, AI-powered customization, and premium meditation journeys.

## Key Capabilities
- **World ID verification** using MiniKit IDKitWidget with `app_5bf2751f982e06fa48bfe166ff0fe5fd`, action `psig-verification`, and callback `https://meditation-v2-rebuild.vercel.app/callback`. The flow follows the [Verify command](https://docs.world.org/mini-apps/commands/verify) guidelines and exposes reusable hooks for tabs, assistant, and catalog screens.
- **AI assistant** with resilient fallbacks that can compose bespoke meditations, layer Expo Speech narration, and push custom sessions into the catalog. Unverified users receive locking prompts until they finish World ID verification.
- **Meditation catalog & player** featuring stats, streak analytics, offline caching of the latest three sessions, and guarded access to AI-generated rituals. The Expo AV player adds layered ambience, Expo Speech narration, haptic cues, and guarded error handling for buffering failures.
- **Focus, sleep, and breathing rituals** enhanced with NativeWind-ready theming, gradient visuals, and structured quick actions on the home dashboard.
- **Offline preparedness** via AsyncStorage-backed caches for session metadata, stats, and verification payloads so returning users resume seamlessly.

## Environment & Configuration
Create a `.env` file (one is included) with the following variables so Expo, Vercel, and serverless handlers read consistent values:

```env
WORLD_ID_APP_ID=app_5bf2751f982e06fa48bfe166ff0fe5fd
WORLD_ID_ACTION_ID=psig-verification
WORLD_ID_CALLBACK_URL=https://meditation-v2-rebuild.vercel.app/callback
ENABLE_TELEMETRY=true
```

> The Expo runtime also reads the `EXPO_PUBLIC_` variants that mirror the same values. Update Vercel project `meditation-v2-rebuild` with identical secrets before deploying.

Additional tooling expectations:
- Node.js 18 LTS
- `EXPO_NO_PROXY=1` and `EXPO_NO_TELEMETRY=1` for deterministic doctor/export commands
- React Native Reanimated 3 configuration enabled via Expo Router entry (already wired)

## Scripts
| Command | Purpose |
| --- | --- |
| `npm install --loglevel=warn` | Install dependencies with minimal noise |
| `npm run dev` | Launch Expo development server |
| `npm run web` | Launch Expo web bundler |
| `npm run doctor` | Run `expo doctor` with required proxy flags |
| `npm run export:web` | Export the static web bundle into `dist/` |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript validation |
| `npm run format` | Prettier formatting check |
| `npm run prebuild` | Prepare native directories if required |
| `npm test` | Placeholder (no automated tests yet) |

## QA & Deployment Checklist
1. `npm run doctor`
2. `npm run lint && npm run typecheck`
3. `npm run export:web`
4. Verify `dist/index.html` exists
5. `EXPO_NO_PROXY=1 EXPO_NO_TELEMETRY=1 npx expo start --web` to sanity-check routes, assistant fallbacks, and focus timer (4:00 preset)
6. Confirm World ID verification succeeds inside World App without the “Please open inside World App” loop
7. Deploy via `npx vercel deploy --prebuilt --prod --confirm`

## World ID Notes
- The reusable `useWorldId` hook coordinates MiniKit loading, environment detection, redirect fallbacks, and provider persistence.
- Components render contextual warnings when verification is required and expose retry buttons tied to official [World Developer Portal](https://developer.worldcoin.org/) guidance.
- Offline caching and state hydration leverage the verified payload stored in SecureStore/AsyncStorage, preventing redundant QR prompts.

## Official Resources Consulted
- [Mini Apps Quick Start](https://docs.world.org/mini-apps/quick-start)
- [Verify command reference](https://docs.world.org/mini-apps/commands/verify)
- [Connect Wallet guide](https://docs.world.org/mini-apps/commands/connect-wallet)
- [MiniKit JS SDK repository](https://github.com/worldcoin/minikit-js)
- [World App design guidelines](https://docs.world.org/mini-apps/design/app-guidelines)
- [Testing docs](https://docs.world.org/mini-apps/quick-start/testing)

Keep these resources nearby when extending authentication, analytics, or wallet actions to ensure parity with the World App ecosystem.
