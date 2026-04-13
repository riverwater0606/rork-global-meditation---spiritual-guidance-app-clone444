export const DAILY_RESONANCE_CAP = 12;
export const RESONANCE_BLESSING_BOOST_COST = 5;
export const RESONANCE_ORB_AURA_COST = 3;
export const RESONANCE_AMBIENT_PASS_COST = 4;

export const RESONANCE_REWARDS = {
  dailyCheckIn: 1,
  dailyMeditation: 3,
  chakraRitual: 5,
  aiCreation: 3,
} as const;

export type ResonanceRewardType = keyof typeof RESONANCE_REWARDS;
export type ResonanceLedgerType =
  | ResonanceRewardType
  | "blessingBoostSpend"
  | "orbAuraSpend"
  | "ambientPassSpend"
  | "aiTopUpSpend"
  | "aiBundleSpend"
  | "testGrant";

export function getResonanceRewardLabel(
  type: ResonanceLedgerType,
  lang: "en" | "zh" | "es" = "en"
) {
  const copy = {
    dailyCheckIn: {
      zh: "每日簽到",
      en: "Daily check-in",
      es: "Check-in diario",
    },
    dailyMeditation: {
      zh: "每日首次冥想",
      en: "First meditation of the day",
      es: "Primera meditación del día",
    },
    chakraRitual: {
      zh: "今日脈輪儀式",
      en: "Today's chakra ritual",
      es: "Ritual de chakras de hoy",
    },
    aiCreation: {
      zh: "首次 AI 課程生成",
      en: "First AI session creation",
      es: "Primera creación de sesión AI",
    },
    blessingBoostSpend: {
      zh: "強化下一次祝福",
      en: "Amplify next blessing",
      es: "Potenciar la próxima bendición",
    },
    orbAuraSpend: {
      zh: "點亮今日光暈",
      en: "Light today's orb aura",
      es: "Encender el aura de hoy",
    },
    ambientPassSpend: {
      zh: "解鎖今日環境音通行",
      en: "Unlock today's ambient pass",
      es: "Desbloquear el pase ambiental de hoy",
    },
    aiTopUpSpend: {
      zh: "補充 AI 靈感 1 次",
      en: "AI guidance top-up x1",
      es: "Recarga de guía AI x1",
    },
    aiBundleSpend: {
      zh: "補充 AI 靈感 3 次",
      en: "AI guidance top-up x3",
      es: "Recarga de guía AI x3",
    },
    testGrant: {
      zh: "測試加值",
      en: "Test grant",
      es: "Recarga de prueba",
    },
  } as const;

  return copy[type][lang];
}
