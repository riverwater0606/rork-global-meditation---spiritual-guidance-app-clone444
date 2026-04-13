export const VIP_DURATION_DAYS = 30;
export const ORB_AWAKENING_DAYS_REQUIRED = 7;
export const FREE_DAILY_AWAKENING_MINUTES = 7;
export const VIP_DAILY_AWAKENING_MINUTES = 5;

export const VIP_STARTER_SHAPES = [
  "quantum-orbitals",
  "cosmic-serpent",
  "halo-bloom",
] as const;

export const FREE_CORE_SHAPES = [
  "default",
  "flower-of-life-complete",
  "merkaba",
  "tree-of-life",
  "star-of-david",
] as const;

export const FREE_AMBIENT_SOUND_IDS = [
  "crystal-bowl",
  "pure-ocean",
  "gentle-stream",
  "hz432",
  "temple-bell",
] as const;

export type MeditationAccessTier = "free" | "vip";

export const resolveVipExpiryDate = (activatedAtIso: string, durationDays = VIP_DURATION_DAYS) => {
  const expiry = new Date(activatedAtIso);
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry.toISOString();
};

export const getVipDaysRemaining = (vipExpiresAt: string | null, referenceNowMs: number = Date.now()) => {
  if (!vipExpiresAt) return 0;
  const diff = new Date(vipExpiresAt).getTime() - referenceNowMs;
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};
