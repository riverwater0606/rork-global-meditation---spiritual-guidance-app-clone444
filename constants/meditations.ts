import { SOUND_EFFECTS } from "./soundEffects";

export type SupportedLanguage = "en" | "zh";

export interface LocalizedMeditationContent {
  title: string;
  description: string;
}

export interface MeditationSession {
  id: string;
  category: string;
  duration: number; // in minutes
  narrator: string;
  gradient: string[];
  featured: boolean;
  audioUrl: string;
  defaultAmbientSoundId?: string;
  translations: Record<SupportedLanguage, LocalizedMeditationContent>;
}

export interface MeditationCategory {
  id: string;
  name: Record<SupportedLanguage, string>;
}

export const CATEGORIES: MeditationCategory[] = [
  { id: "all", name: { en: "All", zh: "全部" } },
  { id: "mindfulness", name: { en: "Mindfulness", zh: "正念" } },
  { id: "sleep", name: { en: "Sleep", zh: "睡眠" } },
  { id: "anxiety", name: { en: "Anxiety", zh: "焦慮" } },
  { id: "focus", name: { en: "Focus", zh: "專注" } },
  { id: "gratitude", name: { en: "Gratitude", zh: "感恩" } },
  { id: "spiritual", name: { en: "Spiritual", zh: "靈性" } },
];

const AMBIENT_LOOKUP = new Map(SOUND_EFFECTS.map((effect) => [effect.id, effect]));

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: "morning-mindfulness",
    translations: {
      en: {
        title: "Morning Mindfulness",
        description:
          "Start your day with clarity and intention through gentle awareness practices.",
      },
      zh: {
        title: "晨間正念",
        description: "以溫柔的覺察練習開啟清晰、有意識的一天。",
      },
    },
    duration: 10,
    category: "mindfulness",
    narrator: "Sarah Chen",
    gradient: ["#FF6B6B", "#FF8E53"],
    featured: true,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/09/06/audio_655f1f4e8f.mp3?filename=deep-meditation-128-11058.mp3",
    defaultAmbientSoundId: "nature",
  },
  {
    id: "deep-sleep",
    translations: {
      en: {
        title: "Deep Sleep Journey",
        description: "Drift into peaceful slumber with calming visualizations and body relaxation.",
      },
      zh: {
        title: "深層睡眠之旅",
        description: "透過舒緩的觀想與身體放鬆，引導你沉入安穩睡眠。",
      },
    },
    duration: 20,
    category: "sleep",
    narrator: "Michael Rivers",
    gradient: ["#667EEA", "#764BA2"],
    featured: true,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/03/08/audio_deaf3ddda8.mp3?filename=good-night-110624.mp3",
    defaultAmbientSoundId: "ocean",
  },
  {
    id: "anxiety-relief",
    translations: {
      en: {
        title: "Anxiety Relief",
        description: "Release tension and find calm through breathing techniques and grounding exercises.",
      },
      zh: {
        title: "舒緩焦慮",
        description: "透過呼吸技巧與紮根練習，釋放壓力、找回平靜。",
      },
    },
    duration: 15,
    category: "anxiety",
    narrator: "Emma Thompson",
    gradient: ["#4FACFE", "#00F2FE"],
    featured: true,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/09/06/audio_efd1d5d295.mp3?filename=calm-meditation-11070.mp3",
    defaultAmbientSoundId: "wind",
  },
  {
    id: "focus-flow",
    translations: {
      en: {
        title: "Focus & Flow",
        description: "Enhance concentration and enter a state of productive flow.",
      },
      zh: {
        title: "專注心流",
        description: "提升專注力，進入高效率的心流狀態。",
      },
    },
    duration: 12,
    category: "focus",
    narrator: "David Kim",
    gradient: ["#43E97B", "#38F9D7"],
    featured: false,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/12/16/audio_4b3b87160c.mp3?filename=inspiring-ambient-hip-hop-12331.mp3",
    defaultAmbientSoundId: "rain",
  },
  {
    id: "gratitude-practice",
    translations: {
      en: {
        title: "Gratitude Practice",
        description: "Cultivate appreciation and joy through guided gratitude meditation.",
      },
      zh: {
        title: "感恩練習",
        description: "透過引導式冥想培養感恩之心與喜悅感。",
      },
    },
    duration: 8,
    category: "gratitude",
    narrator: "Lisa Martinez",
    gradient: ["#FA709A", "#FEE140"],
    featured: false,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/11/15/audio_4abf43ceab.mp3?filename=meditation-ambient-11254.mp3",
    defaultAmbientSoundId: "tibetan",
  },
  {
    id: "spiritual-awakening",
    translations: {
      en: {
        title: "Spiritual Awakening",
        description: "Connect with your higher self and explore spiritual dimensions.",
      },
      zh: {
        title: "靈性覺醒",
        description: "連結內在高我，探索靈性層面。",
      },
    },
    duration: 25,
    category: "spiritual",
    narrator: "Raj Patel",
    gradient: ["#A8EDEA", "#FED6E3"],
    featured: false,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/03/14/audio_8db2607843.mp3?filename=divine-meditation-14036.mp3",
    defaultAmbientSoundId: "meditation",
  },
  {
    id: "body-scan",
    translations: {
      en: {
        title: "Body Scan Relaxation",
        description: "Progressive relaxation through mindful body awareness.",
      },
      zh: {
        title: "身體掃描放鬆",
        description: "透過正念覺察逐步放鬆全身。",
      },
    },
    duration: 18,
    category: "mindfulness",
    narrator: "Sarah Chen",
    gradient: ["#FBC2EB", "#A6C1EE"],
    featured: false,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/09/16/audio_4468f8c6c7.mp3?filename=meditation-relaxing-ambient-112191.mp3",
    defaultAmbientSoundId: "forest",
  },
  {
    id: "loving-kindness",
    translations: {
      en: {
        title: "Loving Kindness",
        description: "Cultivate compassion for yourself and others through metta meditation.",
      },
      zh: {
        title: "慈心冥想",
        description: "透過慈悲冥想培養對自己與他人的關懷。",
      },
    },
    duration: 15,
    category: "spiritual",
    narrator: "Emma Thompson",
    gradient: ["#F093FB", "#F5576C"],
    featured: false,
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/09/01/audio_6b68d949f6.mp3?filename=relaxing-ambient-11034.mp3",
    defaultAmbientSoundId: "fire",
  },
];

export const getAmbientSoundById = (id?: string) => {
  if (!id) return undefined;
  return AMBIENT_LOOKUP.get(id);
};

export const getLocalizedContent = (
  session: MeditationSession,
  language: SupportedLanguage
): LocalizedMeditationContent => {
  return session.translations[language] ?? session.translations.en;
};

