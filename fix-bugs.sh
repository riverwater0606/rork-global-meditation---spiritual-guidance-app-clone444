#!/bin/bash
set -euo pipefail

PATCH_FILE="patches/fix-bugs.patch"

if [ -f "$PATCH_FILE" ]; then
  if git apply --check "$PATCH_FILE" >/dev/null 2>&1; then
    git apply "$PATCH_FILE"
  else
    echo "Patch already applied or not applicable." >&2
  fi
fi

npm install --legacy-peer-deps
npx expo install --fix
EXPO_NO_PROXY=1 npm run doctor
