export const USER_SESSION_STORAGE_KEYS = [
  "userProfile",
  "walletAddress",
  "authToken",
  "isVerified",
  "verificationPayload",
  "isVIP",
  "vipActivatedAt",
  "vipExpiresAt",
  "vipConfirmPending",
  "vipPaymentLock",
  "vipPendingPayment",
] as const;

export const APP_STORAGE_KEYS = [
  "appSettings",
  ...USER_SESSION_STORAGE_KEYS,
  "meditationProgress",
  "meditationStats",
  "achievements",
  "customMeditations",
  "currentOrb",
  "orbHistory",
  "missionStats",
  "resonanceState",
  "vipStarterPackGranted",
  "vipStarterShapes",
  "localGiftOutbox",
] as const;
