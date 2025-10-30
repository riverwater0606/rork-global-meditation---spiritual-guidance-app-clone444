# World App Meditation Mini-App – Complete Regeneration Prompt

You are **Codex**, an elite Expo SDK 52 / React 18 architect, UI visionary, meditation master, and prompt crafter. Starting from a clean slate, rebuild the entire World App meditation & spiritual guidance mini-app with flawless polish. Overwrite every file with a best-in-class implementation that is production-ready, monetizable, and free of conflicts.

### Mandatory reference resources (consult proactively during development)
- World Developer Portal: https://developer.worldcoin.org/
- World Developer Docs: https://docs.world.org/
- Mini Apps Quick Start: https://docs.world.org/mini-apps/quick-start
- Verify Command: https://docs.world.org/mini-apps/commands/verify
- Connect Wallet: https://docs.world.org/mini-apps/commands/connect-wallet
- Testing: https://docs.world.org/mini-apps/quick-start/testing
- App Store Submission: https://docs.world.org/mini-apps/quick-start/app-store
- Design Guidelines: https://docs.world.org/mini-apps/design/app-guidelines
- Notifications: https://docs.world.org/mini-apps/notifications/features-and-guidelines
- Init & Metadata: https://docs.world.org/mini-apps/reference/init
- GitHub Examples: https://github.com/worldcoin/minikit-js, https://github.com/worldcoin/minikit-web3-example, https://github.com/worldcoin/minikit-next-template, https://github.com/worldcoin/minikit-react-template, https://github.com/worldcoin/minikit-js-template, https://github.com/worldcoin/mini-apps-ui-kit, https://github.com/worldcoin/developer-docs, https://github.com/orgs/worldcoin/repositories
Document in comments and README how each relevant implementation aligns with guidance from these resources.

### Environment credentials & required variables
- Overwrite all previous World ID credentials with the following constants and wire them through configuration:
  - `APP_ID = "app_5bf2751f982e06fa48bfe166ff0fe5fd"`
  - `ACTION_ID = "psig-verification"`
  - `VERIFY_SIGNAL = "<preserve existing or auto-generate if missing>"`
  - `CALLBACK_URL = "https://meditation-v2-rebuild.vercel.app/callback"`
- Mirror these values in environment files and build tooling. Ensure `.env`, Expo config, serverless routes, and deployment pipelines reference:
  - `WORLD_ID_APP_ID=app_5bf2751f982e06fa48bfe166ff0fe5fd`
  - `WORLD_ID_ACTION_ID=psig-verification`
  - `WORLD_ID_CALLBACK_URL=https://meditation-v2-rebuild.vercel.app/callback`
  - `ENABLE_TELEMETRY=true`
- Provide documentation on how these environment variables are loaded (e.g., using `expo-env`, build scripts, CI secrets) so the regenerated project remains consistent across local, CI, and production builds.

---
## 1. Project foundation & package manifest
1. Scaffold a fresh Expo Router project pinned to **Expo SDK 52**, **React 18**, **React Native 0.74** (matching SDK 52). Do **not** upgrade beyond these core versions.
2. Author a comprehensive `package.json` that:
   - Pins every Expo dependency (`expo`, `expo-router`, `expo-av`, `expo-speech`, `expo-application`, `expo-constants`, `expo-status-bar`, `expo-font`, `expo-linking`, `expo-secure-store`, etc.) to SDK 52 compatible releases.
   - Locks all first-party libs with exact versions: `@tanstack/react-query`, `zustand`, `nativewind`, `lucide-react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-native-async-storage/async-storage`, `@shopify/flash-list`, `@worldcoin/minikit-js`, `viem`, `dayjs`, `react-hook-form`, `yup`, `expo-linear-gradient`, `expo-haptics`, `react-native-reanimated`, `react-native-gesture-handler`.
   - Adds npm `overrides` / `resolutions` to harmonize `lucide-react-native`, `@worldcoin/minikit-js`, and `viem` peer dependencies with Expo SDK 52.
   - Provides scripts: `dev`, `android`, `ios`, `web`, `start:web`, `lint`, `typecheck`, `format`, `doctor` (`EXPO_NO_PROXY=1 npx expo doctor`), `export:web`, `test`, `prebuild`.
   - Configures `expo` object with SDK 52 metadata, app icon/splash, deep link scheme, permissions for audio, speech, and secure storage, plus `updates` for production OTA.

---
## 2. Project structure & architecture
1. Adopt Expo Router layout with directories:
   - `app/(tabs)/index.tsx` – dashboard with shortcuts, daily rituals, premium upsells, and World ID login button.
   - `app/(tabs)/assistant.tsx` – AI companion chat, unlocked post World ID verification, with guided fallback responses.
   - `app/(tabs)/meditate.tsx` – curated meditation catalog, segmented by focus/sleep/breath/spiritual themes, handling premium locks.
   - `app/focus-meditation.tsx`, `app/sleep-meditation.tsx`, `app/breathwork.tsx` – dedicated flows with timers and playlists.
   - `app/meditation/[id].tsx` – immersive audio player for individual sessions.
   - `app/premium/masterclass.tsx`, `app/premium/retreat.tsx` – premium upsell experiences for paid members.
   - Shared `app/_layout.tsx` and provider wrappers for theming, query client, store hydration, i18n.
2. Implement modular feature folders: `components/`, `hooks/`, `providers/`, `services/`, `constants/`, `contracts/` (World ID), `lib/` utilities, `stores/`, `translations/`, `ai-generated/` (for assistant-built sessions), and `content/` for curated scripts.
3. Ensure router navigation uses explicit `switch` statements with `router.push`/`router.replace` to avoid incorrect destinations.

---
## 3. State management, data & services
1. Build a Zustand store that tracks playback session, timers, current meditation metadata, dynamically generated meditations, World ID verification status, AI chat history, premium entitlements, breath pacing configuration, and user preferences (language, dark mode, reminders, background audio choice).
2. Configure React Query clients for:
   - Meditation catalog fetch with caching, pagination, offline persistence, and optimistic updates when custom meditations are added.
   - AI assistant messaging to `https://toolkit.rork.com/text/llm` with retry/backoff, structured message schema, transcript persistence, and mutation handlers that can request server-side generation of meditation scripts/audio metadata when the user opts in.
   - Premium subscription/product metadata, bundled retreat schedules, and upsell experiments.
3. Add secure persistence with `expo-secure-store` for user tokens, settings, and verified status.
4. Implement `useWorldId` hook leveraging `@worldcoin/minikit-js` **IDKitWidget**:
   - Credentials: APP ID `app_5bf2751f982e06fa48bfe166ff0fe5fd`, ACTION ID `psig-verification`, verification level `normal`, callback `https://meditation-v2-rebuild.vercel.app/callback`.
   - Handle nonce creation, QR presentation, environment detection (user agent + fallback delay to avoid “Please open inside World App”), and backend verification via POST.
   - Provide loading, success, failure states, toasts, analytics events, and expose imperative retry helpers for UI components.
5. Integrate `expo-av` for audio playback with buffered streaming, download-to-offline, crossfade transitions, and `expo-speech` for guided narration (English/Chinese) with cancellation safeguards. Ensure AI-generated meditations receive synthesized guidance and optional background ambience layering.
6. Add breath pacing service with science-backed cadences, vibrations (`expo-haptics`), and fallback values to guarantee timers never render `NaN:NaN`.

---
## 4. Screen specifications & UX polish
1. **Home (`index.tsx`)**
   - Show daily intention, quick-start buttons (Focus 4:00, Sleep 20:00, Breath 6:00), recent progress, streak tracker, premium banners, and spotlight cards for AI-crafted rituals.
   - Include responsive World ID login button wired to `useWorldId`, presenting verification status, retry option, and callouts referencing the official Verify command flow.
   - Surface localized greetings, mindfulness challenges, notification opt-ins, and call-to-action cards that link to premium journeys and custom courses.
2. **Assistant (`assistant.tsx`)**
   - `try/catch` around fetch with exponential backoff; on failure, deliver curated breathing/meditation scripts with localized narration, interactive breath counters, and contextual affirmations.
   - Gate chat input behind World ID verification, show skeleton loaders, offline indicator, conversation history with timestamps, transcript export, and contextual tooltips referencing official guidelines.
   - After conversational consent, offer to auto-compose personalized meditation courses: capture theme, duration, tone, background audio choice, and store them via Zustand/React Query mutation. Generate accompanying narration scripts, ambient track recommendations, and scheduling reminders. Surface preview modal with audio synthesized through `expo-speech` layered on `expo-av` playlists. Allow users to revise or duplicate AI-generated sessions and push them into the meditation catalog with premium tagging when applicable.
3. **Meditate (`meditate.tsx`)**
   - Parse durations using `parseInt`, guard fallbacks, show lock icons for premium tracks, integrate `FlashList` for performance, use `useMemo` for timers and filter chips, and present session health metrics (heart coherence tips, breath pacing suggestions) alongside progress indicators.
   - Support search, filters, categories, badges for “New”, “Popular”, “World ID Exclusive”, “AI Crafted”, and “Guided Ritual”. Enable per-category analytics logging and allow users to pin favorite playlists or AI-generated sessions to the top.
4. **Detail Player (`meditation/[id].tsx`)**
   - Load audio via `playAsync` inside `try/catch`, show progress slider, waveform visualization, countdown timers, share/download buttons, “immersive focus” UI (breathing ring, haptics, color breathing).
   - Provide Affirmation toggle (uses `expo-speech`), queue support, dual-language subtitles, integrated journaling prompts, and graceful cleanup on unmount. For AI-generated sessions, inject dynamic script paragraphs, optional nature sound layers, and allow exporting to shareable cards.
5. **Focus/Sleep/Breathwork screens**
   - Preconfigured sequences (e.g., Focus 4:00 timer) with ambient loops, dynamic backgrounds, session notes, journaling modal via `react-hook-form` + `yup` validation, optional co-listening mode, and adaptive guidance that adapts pace based on previous sessions.
6. **Premium experiences**
   - Masterclass & Retreat pages with hero imagery, pricing tiers, comparison tables, testimonials, CTA to World ID + payment portal (mocked), calendar scheduling integration, limited-time offers, bundle packages, and “invite a friend” referral hooks.
   - Introduce premium-only AI coaching: asynchronous audio replies from the assistant, goal tracking dashboards, and personalized retreat itineraries.
7. **Global UX**
   - Theming via NativeWind/Tailwind with light/dark mode, accessible color contrast, animations powered by Reanimated.
   - Toasts/alerts for network/audio/verification errors, skeletons for loading, optimistic UI for likes/favorites, offline banners.
8. **Custom Meditation Library & Community**
   - Provide library management UI for AI-generated and user-favorited sessions: editable metadata, reorderable playlists, and toggles for private vs. shared.
   - Allow exporting sessions as shareable QR codes or deep links, respecting World ID permissions and leveraging Connect Wallet samples for future tokenized rewards.
   - Surface engagement analytics (completion rate, mood tracking) and offer prompts to iterate with the assistant for improved versions.

---
## 5. Internationalization & content
1. Define `TRANSLATIONS` record covering English (`en`) and Chinese (`zh`), including meditation titles, prompts, premium copy, error messages, and assistant fallbacks.
2. Create `useI18n` hook to detect device locale, allow manual switching, and memoize translation lookups.
3. Provide scripture/affirmation content curated for meditation mastery and monetize via premium tiers.

---
## 6. Testing, quality & tooling
1. Supply configs: `babel.config.js`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.js`, `metro.config.js`, `prettier.config.js` tuned for Expo SDK 52.
2. Add global polyfills as needed for `@worldcoin/minikit-js` on web.
3. Implement Jest or React Native Testing Library smoke tests for key components, plus `tsc --noEmit` and ESLint checks.
4. Document a full QA plan in README covering:
   - `npm run doctor`
   - `npx expo start --web`
   - Validation that AI assistant fallback triggers gracefully, timers show 4:00 focus session, buttons respond, routes correct, World ID QR scan verifies without “open in World App” error.
   - Premium flows (upsells, downloads, journaling, reminders) operate flawlessly.
   - Vercel deploy via `npm run export:web` completes green.
5. Include analytics placeholders (e.g., logging hooks) and error boundary capturing to ensure no crashes reach users.

---
## 7. Deployment automation
1. Create `scripts/rebuild-and-publish.sh` that performs:
   - `git checkout -b new-branch`
   - Copy regenerated files into repo
   - `npm install --legacy-peer-deps`
   - `npx expo install --fix`
   - `npm run doctor`
   - `npm run export:web`
   - `npm run lint && npm run typecheck && npm test`
   - `git add .`
   - `git commit -m "Rebuild World App meditation experience"`
   - `git push --set-upstream origin new-branch`
   - Echo guidance to open PR and merge
2. Update README with deploy instructions, feature catalog, monetization overview, and QA checklist.

---
## 8. Output expectations
1. Return the full regenerated project tree with all files populated—no placeholders, no omissions.
2. Ensure every feature described above is implemented with production-level care, zero runtime errors, and no dependency conflicts.
3. Showcase your mastery: polished UI, smooth animations, airtight error handling, and monetization-ready premium content.
4. Confirm everything through tests, manual checks, and documentation so the app ships flawlessly.

Rebuild now with confidence and perfection.
