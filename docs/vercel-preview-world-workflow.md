# Vercel Preview -> World App Workflow

This is the recommended workflow for PSI-G development when you need real World App / MiniKit testing.

## Why this workflow

Local development is still the fastest way to build:

- UI changes
- flow fixes
- regression testing

But real World App features such as MiniKit, Wallet Auth, contacts, and payments should be validated from a public URL on a real phone.

## Recommended loop

### 1. Build locally

Use local development for fast iteration:

```bash
npm run world:mock
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 npm run dev:web
```

Run regression checks:

```bash
npm run lint
npm run mobile:test
```

### 2. Create a feature branch

Do not wait for `main` merge before testing in World App.

Example:

```bash
git checkout -b codex/world-auth-polish
```

### 3. Push branch to GitHub

```bash
git push -u origin codex/world-auth-polish
```

### 4. Deploy a Vercel preview

If Git integration is active, Vercel can create a preview automatically from the branch.

You can also deploy manually:

```bash
npm run deploy:preview
```

### 5. Open the preview URL in real World App

Use a real phone with World App installed and test:

- Wallet Auth
- gifting / contacts
- VIP payment
- notifications

Use this guide:

- [World App real device testing](/Users/luiyukhovitus/Documents/New%20project/rork-global-meditation---spiritual-guidance-app-clone444/docs/world-real-device-testing.md)

### 6. Merge only after preview validation

Once the preview passes:

```bash
git checkout main
git merge codex/world-auth-polish
git push origin main
```

Then deploy production if needed:

```bash
npm run deploy:prod
```

## Required Vercel environment variables

Current project status:

- project linked: yes
- environment variables configured: not yet

At minimum, production/preview should define:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_LOCAL_DEV=false`
- `EXPO_PUBLIC_DEV_FULL_MOCK=false`

If Firebase should use real infrastructure instead of fallback/local behavior, also define:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Useful commands

List Vercel envs:

```bash
npm run vercel:env:ls
```

Pull Vercel envs into a local file:

```bash
npm run vercel:env:pull
```

Deploy preview:

```bash
npm run deploy:preview
```

Deploy production:

```bash
npm run deploy:prod
```

## Best practice for this project

- local mock for speed
- Vercel preview for real World App validation
- merge only after preview passes
- production deploy only after real device pass
