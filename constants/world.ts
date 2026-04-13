const normalizeEnv = (value: string | undefined) => value?.trim();

export const APP_ID =
  normalizeEnv(process.env.WORLD_ID_APP_ID) ??
  'app_7cb26ab7bcbdd62a1bcb3c6353f0b957';

export const ACTION_ID =
  normalizeEnv(process.env.WORLD_ID_ACTION_ID) ??
  'psig';

export const WALLET_AUTH_STATEMENT =
  'Sign to confirm wallet ownership and authenticate to PSI-G' as const;

const browserOrigin =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : null;

export const API_BASE_URL =
  normalizeEnv(process.env.EXPO_PUBLIC_API_BASE_URL) ??
  browserOrigin ??
  'https://mini-app-backend.example.com';
