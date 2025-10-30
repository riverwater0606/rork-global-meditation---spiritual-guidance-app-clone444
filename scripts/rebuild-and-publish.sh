#!/usr/bin/env bash
set -euo pipefail

BRANCH_NAME="${1:-rebuild/world-app-$(date +%Y%m%d%H%M%S)}"

printf '\n⚙️  Creating working branch %s\n' "$BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

printf '\n📦  Installing dependencies (legacy peer deps to respect Expo SDK 52 locks)\n'
npm install --legacy-peer-deps

printf '\n🩺  Repairing Expo native modules\n'
npx expo install --fix || true

printf '\n🧪  Doctoring and validating project health\n'
EXPO_NO_PROXY=1 EXPO_NO_TELEMETRY=1 npm run doctor
npm run lint
npm run typecheck
npm test

printf '\n🌐  Exporting static web bundle\n'
CI=1 EXPO_NO_PROXY=1 EXPO_NO_TELEMETRY=1 npm run export:web

if [ ! -f dist/index.html ]; then
  echo "dist/index.html not found after export. Please rerun the export before pushing." >&2
  exit 1
fi

printf '\n🪵  Staging regenerated files\n'
git add .

git commit -m "Rebuild World App meditation experience"
git push --set-upstream origin "$BRANCH_NAME"

cat <<'INSTRUCTIONS'
🚀 Branch ready!
Open a pull request for the branch above, review the Expo web export in dist/, and merge once Vercel confirms a green deployment.
INSTRUCTIONS
