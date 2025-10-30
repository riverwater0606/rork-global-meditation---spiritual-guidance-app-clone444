const ensureEnv = (value: string | undefined, fallback: string, label: string) => {
  if (!value || value.trim().length === 0) {
    console.warn(`Missing environment variable for ${label}; falling back to baked default.`);
    return fallback;
  }
  return value;
};

const DEFAULT_APP_ID = 'app_5bf2751f982e06fa48bfe166ff0fe5fd' as const;
const DEFAULT_ACTION_ID = 'psig-verification' as const;
const DEFAULT_VERIFY_SIGNAL = '0x12312' as const;
const DEFAULT_CALLBACK_URL = 'https://meditation-v2-rebuild.vercel.app/callback' as const;

const env = process.env;

export const APP_ID = ensureEnv(
  env?.EXPO_PUBLIC_WORLD_ID_APP_ID ?? env?.WORLD_ID_APP_ID,
  DEFAULT_APP_ID,
  'WORLD_ID_APP_ID'
) as typeof DEFAULT_APP_ID;

export const ACTION_ID = ensureEnv(
  env?.EXPO_PUBLIC_WORLD_ID_ACTION_ID ?? env?.WORLD_ID_ACTION_ID,
  DEFAULT_ACTION_ID,
  'WORLD_ID_ACTION_ID'
) as typeof DEFAULT_ACTION_ID;

export const VERIFY_SIGNAL = ensureEnv(
  env?.EXPO_PUBLIC_WORLD_ID_VERIFY_SIGNAL ?? env?.WORLD_ID_VERIFY_SIGNAL,
  DEFAULT_VERIFY_SIGNAL,
  'WORLD_ID_VERIFY_SIGNAL'
) as typeof DEFAULT_VERIFY_SIGNAL;

export const CALLBACK_URL = ensureEnv(
  env?.EXPO_PUBLIC_WORLD_ID_CALLBACK_URL ?? env?.WORLD_ID_CALLBACK_URL,
  DEFAULT_CALLBACK_URL,
  'WORLD_ID_CALLBACK_URL'
) as typeof DEFAULT_CALLBACK_URL;
