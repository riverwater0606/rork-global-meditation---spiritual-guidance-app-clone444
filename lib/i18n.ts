import type { Language } from "@/providers/SettingsProvider";

export type LocalizedText = Record<Language, string>;

export function localize(language: Language, text: Partial<LocalizedText>) {
  return text[language] ?? text.en ?? text.zh ?? text.es ?? "";
}

export const tabsCopy = {
  home: { en: "Home", zh: "首頁", es: "Inicio" },
  meditate: { en: "Meditate", zh: "冥想", es: "Meditar" },
  garden: { en: "Garden", zh: "光球花園", es: "Jardín" },
  progress: { en: "Progress", zh: "進度", es: "Progreso" },
  assistant: { en: "AI Assistant", zh: "AI助手", es: "Asistente IA" },
  profile: { en: "Profile", zh: "個人資料", es: "Perfil" },
} satisfies Record<string, LocalizedText>;

export const languageScreenCopy = {
  title: { en: "Language", zh: "語言", es: "Idioma" },
  chooseLanguage: { en: "Choose Your Language", zh: "選擇您的語言", es: "Elige tu idioma" },
  subtitle: {
    en: "Select your preferred language for the app interface",
    zh: "選擇您偏好的應用程式介面語言",
    es: "Selecciona tu idioma preferido para la interfaz",
  },
  languageSupport: { en: "Language Support", zh: "語言支援", es: "Compatibilidad de idiomas" },
  supportText: {
    en: "The app supports multiple languages to make meditation accessible to everyone. When you change the language, the interface will update immediately, including meditation guidance and AI assistant responses.",
    zh: "應用程式支援多種語言，讓每個人都能輕鬆使用冥想功能。當您更改語言時，介面會立即更新，包括冥想指導和 AI 助手回應。",
    es: "La app admite varios idiomas para que la meditación sea accesible para todos. Cuando cambias el idioma, la interfaz se actualiza de inmediato, incluida la guía de meditación y las respuestas del asistente IA.",
  },
  englishSubtitle: { en: "Default language", zh: "預設語言", es: "Idioma predeterminado" },
  chineseSubtitle: { en: "Traditional Chinese", zh: "繁體中文", es: "Chino tradicional" },
  spanishSubtitle: { en: "Spanish beta", zh: "西班牙文 beta", es: "Español beta" },
} satisfies Record<string, LocalizedText>;

export const homeCopy = {
  journeyContinues: { en: "Your journey continues", zh: "您的旅程繼續", es: "Tu viaje continúa" },
  yourLightOrb: { en: "Your Light Orb", zh: "你的光球", es: "Tu esfera de luz" },
  enterGarden: { en: "Enter Garden →", zh: "進入花園 →", es: "Entrar al jardín →" },
  todaysAffirmation: { en: "Today's Affirmation", zh: "今日肯定語", es: "Afirmación de hoy" },
  resonanceEnergy: { en: "Resonance Energy", zh: "Resonance 能量", es: "Energía de resonancia" },
  featuredSessions: { en: "Featured Sessions", zh: "精選課程", es: "Sesiones destacadas" },
  seeAll: { en: "See all", zh: "查看全部", es: "Ver todo" },
  sessions: { en: "Sessions", zh: "課程", es: "Sesiones" },
  totalTime: { en: "Total Time", zh: "總時間", es: "Tiempo total" },
  dayStreak: { en: "Day Streak", zh: "連續天數", es: "Racha" },
  today: { en: "Today", zh: "今日", es: "Hoy" },
  next: { en: "Next", zh: "下一步", es: "Siguiente" },
} satisfies Record<string, LocalizedText>;

export const meditateCopy = {
  title: { en: "Meditation Library", zh: "冥想圖書館", es: "Biblioteca de meditación" },
  searchPlaceholder: { en: "Search meditations...", zh: "搜尋冥想...", es: "Buscar meditaciones..." },
  suggestedNextStep: { en: "Suggested Next Step", zh: "下一個建議", es: "Siguiente paso sugerido" },
  coreJourneyEyebrow: { en: "PSI-G Core Journey", zh: "PSI-G 核心旅程", es: "Viaje central de PSI-G" },
  coreJourneyTitle: { en: "Return to Spaciousness · 10 steps", zh: "回歸本源 · 十節一起", es: "Regreso a la amplitud · 10 pasos" },
  coreJourneyBody: {
    en: "Start with settling, move into release, and end in spacious awareness. Tap to expand or collapse the full set.",
    zh: "先安住，再鬆開，最後走向觀照與寬廣。點一下可展開或收起整組課程。",
    es: "Comienza asentándote, pasa a soltar y termina en una conciencia espaciosa. Toca para expandir o contraer toda la serie.",
  },
  vipUnlockHint: { en: "Unlock the full audio with VIP", zh: "升級 VIP 解鎖完整音頻", es: "Desbloquea el audio completo con VIP" },
  vipLocked: { en: "VIP Locked", zh: "VIP 鎖定", es: "VIP bloqueado" },
  manageMeditation: { en: "Manage Meditation", zh: "管理冥想", es: "Gestionar meditación" },
  changeColor: { en: "Change Color", zh: "更換顏色", es: "Cambiar color" },
  deleteMeditation: { en: "Delete Meditation", zh: "刪除冥想", es: "Eliminar meditación" },
  selectTheme: { en: "Select Theme", zh: "選擇顏色主題", es: "Elegir tema" },
  deleteMeditationBody: {
    en: "Are you sure you want to delete this meditation? This action cannot be undone.",
    zh: "確定要刪除這個專屬冥想嗎？此操作無法撤銷。",
    es: "¿Seguro que quieres eliminar esta meditación? Esta acción no se puede deshacer.",
  },
  cancel: { en: "Cancel", zh: "取消", es: "Cancelar" },
  delete: { en: "Delete", zh: "刪除", es: "Eliminar" },
} satisfies Record<string, LocalizedText>;

export const profileCopy = {
  title: { en: "Profile", zh: "個人資料", es: "Perfil" },
  worldUsername: { en: "Your World username", zh: "你的 World 用戶名", es: "Tu nombre de usuario de World" },
  usernameHint: {
    en: "Friends can use this @username directly when sending blessings.",
    zh: "朋友可在送禮時直接輸入這個 @username。",
    es: "Tus amigos pueden usar este @usuario directamente al enviar bendiciones.",
  },
  copy: { en: "Copy", zh: "複製", es: "Copiar" },
  resonanceEnergy: { en: "Resonance Energy", zh: "Resonance 能量", es: "Energía de resonancia" },
  resonanceIntro: {
    en: "This is your daily spiritual energy inside PSI-G. Start with check-ins, your first meditation, and chakra rituals.",
    zh: "這是你在 PSI-G 內的日常靈性能量。先從簽到、每日首次冥想與脈輪儀式開始累積。",
    es: "Esta es tu energía espiritual diaria dentro de PSI-G. Empieza con el check-in, tu primera meditación y los rituales de chakras.",
  },
  checkedInToday: { en: "Checked in today", zh: "今日已簽到", es: "Registro hecho hoy" },
  claiming: { en: "Claiming...", zh: "領取中...", es: "Reclamando..." },
  dailyCheckIn: { en: "Daily check-in +1", zh: "每日簽到 +1", es: "Check-in diario +1" },
  recentEarnings: { en: "Recent earnings", zh: "最近收入", es: "Ganancias recientes" },
  noResonanceYet: { en: "You have not earned Resonance yet.", zh: "還未開始累積 Resonance。", es: "Todavía no has acumulado Resonance." },
  vip30DayPass: { en: "VIP 30-Day Pass", zh: "VIP 30 天內容", es: "Pase VIP de 30 días" },
  vipIntro: {
    en: "VIP is a 30-day advanced pass: it deepens the experience and accelerates tasks, without replacing your main orb journey.",
    zh: "VIP 是 30 天進階通行證：加深體驗、加速任務，不取代你自己養成主線光球。",
    es: "VIP es un pase avanzado de 30 días: profundiza la experiencia y acelera las tareas, sin sustituir el viaje de tu esfera principal.",
  },
  instantUnlocks: { en: "Instant unlocks", zh: "立即獲得", es: "Desbloqueos instantáneos" },
  duringFull30Days: { en: "During the full 30 days", zh: "30 天內持續有效", es: "Durante los 30 días completos" },
  freeVsVip: { en: "Free vs VIP", zh: "免費版 vs VIP", es: "Gratis vs VIP" },
  notifications: { en: "Notifications", zh: "通知", es: "Notificaciones" },
  theme: { en: "Theme", zh: "主題", es: "Tema" },
  language: { en: "Language", zh: "語言", es: "Idioma" },
  privacy: { en: "Privacy & Security", zh: "隱私與安全", es: "Privacidad y seguridad" },
  remindersEnabled: { en: "Reminders enabled", zh: "提醒已啟用", es: "Recordatorios activados" },
  remindersDisabled: { en: "Reminders disabled", zh: "提醒已停用", es: "Recordatorios desactivados" },
  manageData: { en: "Manage your data", zh: "管理您的數據", es: "Gestiona tus datos" },
} satisfies Record<string, LocalizedText>;

export function getLocalizedLanguageLabel(language: Language) {
  return localize(language, {
    en: "English",
    zh: "中文",
    es: "Español",
  });
}
