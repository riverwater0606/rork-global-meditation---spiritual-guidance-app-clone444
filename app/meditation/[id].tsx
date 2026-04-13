import React, { useMemo, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Easing,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, X, Volume2, VolumeX, Music, ChevronDown, ChevronUp } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getMeditationDescription, getMeditationTitle, isFreeMeditationId, MEDITATION_SESSIONS } from "@/constants/meditations";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { FREE_AMBIENT_SOUND_IDS } from "@/constants/vip";
import { getResonanceRewardLabel, RESONANCE_AMBIENT_PASS_COST, ResonanceRewardType } from "@/constants/resonance";
import { createMeditationTtsCacheKey, requestElevenLabsTts } from "@/lib/elevenLabsTts";
import { buildMeditationPreviewText } from "@/lib/aiMeditation";

const { width } = Dimensions.get("window");
const CATEGORY_LABEL_MAP: Record<string, { zh: string; en: string; es: string }> = {
  mindfulness: { zh: "正念", en: "Mindfulness", es: "Atención plena" },
  sleep: { zh: "睡眠", en: "Sleep", es: "Sueño" },
  anxiety: { zh: "焦慮舒緩", en: "Anxiety", es: "Ansiedad" },
  focus: { zh: "專注", en: "Focus", es: "Enfoque" },
  gratitude: { zh: "感恩", en: "Gratitude", es: "Gratitud" },
  spiritual: { zh: "靈性", en: "Spiritual", es: "Espiritual" },
  custom: { zh: "AI 專屬課程", en: "AI Session", es: "Sesión de IA" },
};

interface AmbientSound {
  id: string;
  name: { zh: string; en: string };
  url: string;
}

interface SoundCategory {
  id: string;
  name: { zh: string; en: string };
  sounds: AmbientSound[];
}

const FREE_AMBIENT_SOUND_ID_SET = new Set<string>(FREE_AMBIENT_SOUND_IDS as readonly string[]);
const isAmbientSoundFree = (soundId: string) => FREE_AMBIENT_SOUND_ID_SET.has(soundId);
const ELEVENLABS_DAILY_PREVIEW_LIMIT = 10;
const ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT = 1;
const VOICE_USAGE_STORAGE_PREFIX = "psig-voice-usage";

const getCloudTtsDayKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getVoiceUsageStorageKey = (walletAddress?: string | null) =>
  `${VOICE_USAGE_STORAGE_PREFIX}:${walletAddress?.trim().toLowerCase() || "anon"}`;

const AMBIENT_SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: "bowls",
    name: { zh: "頌缽與梵唱", en: "Bowls & Chants" },
    sounds: [
      { id: "crystal-bowl", name: { zh: "頂級水晶頌缽聲", en: "Crystal Singing Bowl" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A1%B6%E7%BA%A7%E6%B0%B4%E6%99%B6%E9%92%B5%E9%A2%82%E9%9F%B3.mp3" },
      { id: "bowl-long", name: { zh: "頌缽長音", en: "Tibetan Bowl Long" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
      { id: "bowl-meditation-1", name: { zh: "頌缽冥想音樂1", en: "Tibetan Bowl Meditation 1" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E6%A8%82.mp3" },
      { id: "bowl-meditation-2", name: { zh: "頌缽冥想音樂2", en: "Tibetan Bowl Meditation 2" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
      { id: "bowl-stream-birds", name: { zh: "頌缽聲與流水鳥鳴", en: "Bowl + Stream & Birds" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E5%A3%B0.%E6%95%B2%E4%B8%8E%E7%A3%A8.%E6%BD%AA%E6%BD%AA%E6%B5%81%E6%B0%B4.%E9%B8%9F%E9%B8%A3.mp3" },
      { id: "bowl-water-birds", name: { zh: "頌缽聲水聲鳥叫", en: "Bowl + Water & Birds" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E9%9F%B3%2B%E6%B0%B4%E5%A3%B0%2B%E9%B8%9F%E5%8F%AB%E8%87%AA%E7%84%B6%E5%A3%B0.mp3" },
      { id: "bowl-pure", name: { zh: "頌缽聲", en: "Tibetan Bowl Pure" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E9%9F%B3.mp3" },
      { id: "deep-om", name: { zh: "Deep OM Chants", en: "Deep OM Chants" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/deep-om-chants-with-reverb-229614.mp3" },
      { id: "wind-chime", name: { zh: "風鈴缽聲清脆", en: "Wind Chime Bowl" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A3%8E%E9%93%83%E9%93%9B%2C%E6%B8%85%E8%84%86%E6%82%A6%E8%80%B3.mp3" },
    ],
  },
  {
    id: "nature",
    name: { zh: "大自然", en: "Nature" },
    sounds: [
      { id: "ocean-waves", name: { zh: "海洋浪潮", en: "Ocean Waves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%8F%E5%A4%A9%E7%9A%84%E6%B8%85%E6%99%A8%2C%E5%B1%B1%E6%9D%91%E9%87%8C%E5%85%AC%E9%B8%A1%E6%89%93%E9%B8%A3%2C%E5%A5%BD%E5%90%AC%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "pure-ocean", name: { zh: "海浪聲", en: "Pure Ocean Waves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BA%AF%E6%B5%B7%E6%B5%AA%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "gentle-stream", name: { zh: "緩緩流水", en: "Gentle Stream" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BC%93%E7%BC%93%E6%B5%81%E6%B0%B4.mp3" },
      { id: "waterfall", name: { zh: "瀑布聲", en: "Waterfall" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BC%93%E7%BC%93%E6%B5%81%E6%B0%B4.mp3" },
      { id: "rain-meditation", name: { zh: "雨聲冥想音樂", en: "Rain Meditation" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E6%A8%82.mp3" },
      { id: "thunder-rain", name: { zh: "雷雨夜", en: "Thunder & Rain" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%89%93%E9%9B%B7%E4%B8%8B%E9%9B%A8.mp3" },
      { id: "forest-insects", name: { zh: "森林蟲鳴鳥叫", en: "Forest Insects & Birds" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%A7%E8%87%AA%E7%84%B6%E5%86%A5%E6%83%B3%E9%9F%B3%E4%B9%90.mp3" },
      { id: "starry-crickets", name: { zh: "星夜蟲鳴", en: "Starry Night Crickets" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%98%9F%E5%A4%9C%20%E5%8E%9F%E7%94%9F%E6%80%81%E8%87%AA%E7%84%B6%E4%B9%8B%E5%A3%B0.mp3" },
      { id: "summer-morning", name: { zh: "夏日清晨公雞鳥鳴", en: "Summer Morning Birds" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%8F%E5%A4%A9%E7%9A%84%E6%B8%85%E6%99%A8%2C%E5%B1%B1%E6%9D%91%E9%87%8C%E5%85%AC%E9%B8%A1%E6%89%93%E9%B8%A3%2C%E5%A5%BD%E5%90%AC%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "mountain-birds", name: { zh: "深山清脆鳥叫", en: "Mountain Bird Calls" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%9D%9E%E5%B8%B8%E9%9A%BE%E5%BE%97%E7%9A%84%E6%B8%85%E8%84%96%E9%B8%9F%E5%8F%AB%2C%E6%B7%B1%E5%B1%B1%E9%87%8C%E5%BD%95%E5%88%B6.mp3" },
      { id: "ethereal-birds", name: { zh: "空靈鳥叫", en: "Ethereal Birds" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%A9%BA%E7%81%B5%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "seagulls-waves", name: { zh: "海鷗與海浪", en: "Seagulls & Waves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B5%B7%E9%B8%A5%E7%9A%84%E5%8F%AB%E5%A3%B0%2C%E6%B5%B7%E6%B5%AA%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "lakeside-campfire", name: { zh: "湖邊篝火流水鳥鳴", en: "Lakeside Campfire" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B2%B3%E8%BE%B9%E7%82%B9%E7%87%83%E7%AF%9D%E7%81%AB%20%E6%B0%B4%E5%A3%B0%E5%92%8C%E6%B8%85%E8%84%96%E7%9A%84%E9%B8%9F%E9%B8%A3.mp3" },
      { id: "underwater-bubbles", name: { zh: "水底冒泡滴答", en: "Underwater Bubbles" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B0%B4%E5%BA%95%E5%86%92%E6%B3%A1%2C%E5%92%95%E5%98%9F%E5%92%95%E5%98%9F%E5%92%95%E5%98%9F.mp3" },
    ],
  },
  {
    id: "frequencies",
    name: { zh: "療癒頻率", en: "Healing Frequencies" },
    sounds: [
      { id: "brainwave-1", name: { zh: "極度冥想通靈腦波1", en: "Deep Meditation Brainwave 1" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%9E%81%E5%BA%A6%E5%86%A5%E6%83%B3%2C%E9%80%9A%E7%81%B5%E8%84%91%E7%94%B5%E6%B3%A21.mp3" },
      { id: "brainwave-2", name: { zh: "極度冥想通靈腦波2", en: "Deep Meditation Brainwave 2" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%9E%81%E5%BA%A6%E5%86%A5%E6%83%B3%2C%E9%80%9A%E7%81%B5%E8%84%91%E7%94%B5%E6%B3%A22.mp3" },
      { id: "hz432", name: { zh: "432Hz 療癒", en: "432Hz Healing" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
    ],
  },
  {
    id: "daily",
    name: { zh: "生活音", en: "Daily Sounds" },
    sounds: [
      { id: "rowing-boat", name: { zh: "划船聲音", en: "Rowing Boat" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E8%8D%A1%E8%B5%B7%E5%8F%8C%E6%A1%A8%2C%E5%88%92%E8%88%B9%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "temple-bell", name: { zh: "寺院鐘聲", en: "Temple Bell" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%B9%BD%E9%9D%99%E5%AF%BA%E9%99%A2%E7%9A%84%E9%92%9F%E5%A3%B0.mp3" },
      { id: "wind-chime-daily", name: { zh: "風鈴缽聲清脆", en: "Wind Chime Bowl" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A3%8E%E9%93%83%E9%93%9B%2C%E6%B8%85%E8%84%86%E6%82%A6%E8%80%B3.mp3" },
    ],
  },
];

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const sessionFromLibrary = MEDITATION_SESSIONS.find(s => s.id === id);
  const { completeMeditation, customMeditations, hasAmbientPassToday, unlockAmbientPass } = useMeditation();
  const { hasActiveVIP, walletAddress } = useUser();
  const { settings } = useSettings();
  const lang = settings.language;
  const tr = (zh: string, en: string, es: string) => {
    if (lang === "zh") return zh;
    if (lang === "es") return es;
    return en;
  };
  const ambientLabelLanguage = lang === "zh" ? "zh" : "en";
  
  const customSession = customMeditations.find(m => m.id === id);
  const isCustom = !!customSession;
  const session = useMemo(() => {
    if (isCustom && customSession) {
      return {
        id: customSession.id,
        title: customSession.title,
        description: customSession.script.substring(0, 100) + "...",
        duration: customSession.duration,
        narrator: tr("AI 生成", "AI Generated", "Generado por IA"),
        category: "custom",
        gradient: customSession.gradient || ["#8B5CF6", "#6366F1"],
      };
    }

    if (!sessionFromLibrary) return sessionFromLibrary;
    return {
      ...sessionFromLibrary,
      title: getMeditationTitle(sessionFromLibrary, lang),
      description: getMeditationDescription(sessionFromLibrary, lang),
    };
  }, [customSession, isCustom, lang, sessionFromLibrary]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session?.duration ? session.duration * 60 : 600);
  const durationMinutesRef = useRef(10);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [unlockingAmbientPass, setUnlockingAmbientPass] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<"full" | "preview" | null>(null);
  const [isVoicePanelCollapsed, setIsVoicePanelCollapsed] = useState(true);
  const [voiceUsage, setVoiceUsage] = useState({
    dayKey: getCloudTtsDayKey(),
    previewUsed: 0,
    fullUsed: 0,
  });
  const [isScriptCollapsed, setIsScriptCollapsed] = useState(true);
  const [breathingMethod, setBreathingMethod] = useState<'4-7-8' | '4-4-4-4' | '5-2-7' | 'free'>('4-7-8');
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const ttsSoundRef = useRef<Audio.Sound | null>(null);
  const webTtsAudioRef = useRef<HTMLAudioElement | null>(null);
  const webTtsObjectUrlRef = useRef<string | null>(null);
  const localVoicePayloadCacheRef = useRef<Record<string, { audioBase64?: string; audioUrl?: string; mimeType: string }>>({});
  const originalVolume = useRef(0.5);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [completionSummary, setCompletionSummary] = useState<null | {
    uploaded: boolean;
    error?: string;
    sessionCategory: string | null;
    addedNewCategory: boolean;
    customMeditationCompleted: boolean;
    streakAfter: number;
    totalSessionsAfter: number;
    totalMinutesAfter: number;
    orbLevelBefore: number;
    orbLevelAfter: number;
    orbAwakenedNow: boolean;
    resonanceGained: number;
    resonanceRewardTypes: ResonanceRewardType[];
    resonanceBalanceAfter: number;
    resonanceDailyCapReached: boolean;
  }>(null);
  const completionNextStepRoute = completionSummary?.customMeditationCompleted
    ? "/garden"
    : completionSummary?.addedNewCategory
      ? "/progress"
      : "/garden";
  const completionNextStepLabel = completionSummary?.customMeditationCompleted
    ? tr(
        "帶著這次 AI 靈感回到花園，看看任務與形態有冇推進。",
        "Return to the garden and see how this AI insight moved your forms and missions.",
        "Vuelve al jardín con esta inspiración IA y mira cómo avanzaron tus misiones y formas."
      )
    : completionSummary?.addedNewCategory
      ? tr(
          "你剛剛打開了新的主題探索，現在去進度頁看下一個解鎖。",
          "You just opened a new theme path. Head to Progress to see the next unlock.",
          "Acabas de abrir una nueva ruta temática. Ve a Progreso para ver el siguiente desbloqueo."
        )
      : tr(
          "這次靜心已累積成長，現在回花園看看你的光球有冇變化。",
          "This session added real growth. Return to the garden to see how your orb changed.",
          "Esta sesión aportó crecimiento real. Vuelve al jardín para ver cómo cambió tu esfera."
        );
  const totalAmbientSoundCount = AMBIENT_SOUND_CATEGORIES.reduce((sum, category) => sum + category.sounds.length, 0);
  const vipAmbientSoundCount = totalAmbientSoundCount - FREE_AMBIENT_SOUND_IDS.length;
  const previewUsageForToday = voiceUsage.dayKey === getCloudTtsDayKey() ? voiceUsage.previewUsed : 0;
  const fullUsageForToday = voiceUsage.dayKey === getCloudTtsDayKey() ? voiceUsage.fullUsed : 0;
  const previewRemaining = Math.max(0, ELEVENLABS_DAILY_PREVIEW_LIMIT - previewUsageForToday);
  const fullGuidanceRemaining = Math.max(0, ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT - fullUsageForToday);
  const voiceEngineLabel = voiceMode === "preview"
    ? tr("ElevenLabs 預覽", "ElevenLabs preview", "Vista previa de ElevenLabs")
    : tr("可靠雲端導引", "Reliable cloud guidance", "Guía fiable en la nube");
  const customScriptPreview = useMemo(() => {
    if (!customSession) return "";
    const baseText = (customSession.previewText || customSession.openingPreview || customSession.script || "").trim();
    if (!baseText) return "";
    return baseText.length > 220 ? `${baseText.slice(0, 220).trim()}…` : baseText;
  }, [customSession]);

  useEffect(() => {
    let isMounted = true;
    if (!isCustom) return () => {
      isMounted = false;
    };

    AsyncStorage.getItem(getVoiceUsageStorageKey(walletAddress))
      .then((raw) => {
        if (!raw) {
          return {
            dayKey: getCloudTtsDayKey(),
            previewUsed: 0,
            fullUsed: 0,
          };
        }
        const parsed = JSON.parse(raw) as { dayKey?: string; previewUsed?: number; fullUsed?: number };
        return {
          dayKey: typeof parsed.dayKey === "string" ? parsed.dayKey : getCloudTtsDayKey(),
          previewUsed: typeof parsed.previewUsed === "number" ? parsed.previewUsed : 0,
          fullUsed: typeof parsed.fullUsed === "number" ? parsed.fullUsed : 0,
        };
      })
      .then((nextState) => {
        if (isMounted) {
          setVoiceUsage(nextState);
        }
      })
      .catch((error) => {
        console.error("[meditation/[id]] Failed to load TTS usage:", error);
        if (isMounted) {
          setVoiceUsage({
            dayKey: getCloudTtsDayKey(),
            previewUsed: 0,
            fullUsed: 0,
          });
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isCustom, walletAddress]);

  const stopPlaybackExperience = async () => {
    setIsPlaying(false);
    setIsSpeaking(false);
    setIsLoadingVoice(false);
    setVoiceStatus(null);
    setVoiceMode(null);
    setShowSoundPicker(false);

    try {
      Speech.stop();
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop speech:", error);
    }

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop ambient sound:", error);
    }

    try {
      if (ttsSoundRef.current) {
        await ttsSoundRef.current.stopAsync();
        await ttsSoundRef.current.unloadAsync();
        ttsSoundRef.current = null;
      }
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop TTS sound:", error);
    }

    try {
      if (webTtsAudioRef.current) {
        webTtsAudioRef.current.pause();
        webTtsAudioRef.current.currentTime = 0;
        webTtsAudioRef.current.src = "";
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop web TTS audio:", error);
    }
  };

  const handleUnlockAmbientPass = async () => {
    if (unlockingAmbientPass) return;
    setUnlockingAmbientPass(true);
    try {
      const result = await unlockAmbientPass();
      if (result.granted) {
        Alert.alert(
          tr("今日環境音通行已開啟", "Today's ambient pass is unlocked", "El pase de sonido ambiental de hoy ya está activo"),
          tr(
            `你花費了 ${RESONANCE_AMBIENT_PASS_COST} 點 Resonance。今天可使用全部環境音。`,
            `You spent ${RESONANCE_AMBIENT_PASS_COST} Resonance. All ambient sounds are unlocked for today.`,
            `Has gastado ${RESONANCE_AMBIENT_PASS_COST} Resonance. Todos los sonidos ambientales están desbloqueados hoy.`
          )
        );
      } else {
        Alert.alert(
          tr("暫時不能解鎖", "Cannot unlock yet", "Todavía no se puede desbloquear"),
          result.reason === 'already-active'
            ? tr("今日環境音通行已經開啟。", "Your ambient pass is already active today.", "Tu pase de sonido ambiental ya está activo hoy.")
            : tr("Resonance 不足，先完成今日簽到或冥想。", "You need more Resonance first. Try today’s check-in or meditation.", "Necesitas más Resonance primero. Prueba el check-in de hoy o una meditación.")
        );
      }
    } finally {
      setUnlockingAmbientPass(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (ttsSoundRef.current) {
        ttsSoundRef.current.unloadAsync();
      }
      if (webTtsAudioRef.current) {
        webTtsAudioRef.current.pause();
        webTtsAudioRef.current.src = "";
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [fadeAnimation, isSpeaking]);

  useEffect(() => {
    if (session) {
      const durationMinutes = Math.max(1, session.duration ?? 10);
      durationMinutesRef.current = durationMinutes;
      setTimeRemaining(durationMinutes * 60);
    }
  }, [session]);

  useEffect(() => {
    if (isCustom && customSession?.breathingMethod) {
      const method = customSession.breathingMethod;
      if (method === '4-7-8' || method === '4-4-4-4' || method === '5-2-7' || method === 'free') {
        console.log("Setting breathing method from custom session:", method);
        setBreathingMethod(method);
      }
    }
  }, [isCustom, customSession]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        if (selectedSound) {
          let soundUrl: string | null = null;
          for (const category of AMBIENT_SOUND_CATEGORIES) {
            const sound = category.sounds.find(s => s.id === selectedSound);
            if (sound) {
              soundUrl = sound.url;
              break;
            }
          }

          if (soundUrl) {
            const { sound: audioSound } = await Audio.Sound.createAsync(
              { uri: soundUrl },
              { shouldPlay: isPlaying, isLooping: true, volume }
            );
            soundRef.current = audioSound;
          }
        }
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };

    loadSound();
  }, [isPlaying, selectedSound, volume]);

  useEffect(() => {
    const updateSound = async () => {
      if (soundRef.current) {
        if (isPlaying) {
          await soundRef.current.playAsync();
        } else {
          await soundRef.current.pauseAsync();
        }
      }
    };
    updateSound();
  }, [isPlaying]);

  useEffect(() => {
    originalVolume.current = volume;
  }, [volume]);

  useEffect(() => {
    const updateVolume = async () => {
      if (soundRef.current) {
        const targetVolume = isSpeaking ? volume * 0.3 : volume;
        await soundRef.current.setVolumeAsync(targetVolume);
      }
    };
    updateVolume();
  }, [volume, isSpeaking]);

  const normalizeNarrationText = (script: string) => {
    return script
      .replace(/\r\n/g, "\n")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s{0,3}[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s*/gm, "")
      .replace(/[*_`]/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };

  const stopVoiceGuidance = async () => {
    setIsLoadingVoice(false);
    setIsSpeaking(false);
    setVoiceMode(null);
    setVoiceStatus(null);
    try {
      Speech.stop();
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop expo speech fallback:", error);
    }
    if (Platform.OS === "web" && "speechSynthesis" in globalThis) {
      globalThis.speechSynthesis.cancel();
    }
    try {
      if (ttsSoundRef.current) {
        await ttsSoundRef.current.stopAsync();
        await ttsSoundRef.current.unloadAsync();
        ttsSoundRef.current = null;
      }
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop cloud TTS playback:", error);
    }
    try {
      if (webTtsAudioRef.current) {
        webTtsAudioRef.current.pause();
        webTtsAudioRef.current.currentTime = 0;
        webTtsAudioRef.current.src = "";
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
    } catch (error) {
      console.error("[meditation/[id]] Failed to stop web cloud TTS playback:", error);
    }
  };

  const playWebAudioSource = async (
    src: string,
    statusLabel: string,
    mode: "preview" | "full" = "preview"
  ) => {
    const webAudio = new globalThis.Audio();
    webAudio.preload = "auto";
    webAudio.playsInline = true;
    webAudio.volume = 1;
    webAudio.src = src;
    webTtsAudioRef.current = webAudio;
    setIsSpeaking(true);
    setIsLoadingVoice(false);
    setVoiceMode(mode);
    setVoiceStatus(statusLabel);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        webAudio.oncanplaythrough = null;
        webAudio.onloadeddata = null;
        webAudio.onerror = null;
      };
      webAudio.oncanplaythrough = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      webAudio.onloadeddata = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      webAudio.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Browser audio playback failed"));
      };
      webAudio.load();
      setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }, mode === "full" ? 2500 : 1200);
    });

    webAudio.onended = () => {
      setIsSpeaking(false);
      setIsLoadingVoice(false);
      setVoiceMode(null);
      setVoiceStatus(
        mode === "full"
          ? tr("完整導引播放完成", "Full guidance finished", "Guía completa terminada")
          : tr("高質預覽播放完成", "Premium preview finished", "Vista previa premium terminada")
      );
      if (webTtsAudioRef.current === webAudio) {
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current && src === webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
    };

    webAudio.onerror = () => {
      setIsSpeaking(false);
      setIsLoadingVoice(false);
      setVoiceMode(null);
      setVoiceStatus(
        mode === "full"
          ? tr("完整導引播放失敗", "Full guidance playback failed", "La reproducción de la guía completa falló")
          : tr("瀏覽器音訊播放失敗", "Browser audio playback failed", "Falló la reproducción de audio del navegador")
      );
      if (webTtsAudioRef.current === webAudio) {
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current && src === webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
    };

    try {
      await webAudio.play();
    } catch (error) {
      setIsSpeaking(false);
      setIsLoadingVoice(false);
      setVoiceMode(null);
      if (webTtsAudioRef.current === webAudio) {
        webTtsAudioRef.current = null;
      }
      if (webTtsObjectUrlRef.current && src === webTtsObjectUrlRef.current) {
        URL.revokeObjectURL(webTtsObjectUrlRef.current);
        webTtsObjectUrlRef.current = null;
      }
      throw error instanceof Error ? error : new Error("Browser audio playback failed");
    }
  };

  const isUserGesturePlaybackError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const normalized = message.toLowerCase();
    return (
      normalized.includes("user gesture") ||
      normalized.includes("notallowederror") ||
      normalized.includes("play() can only be initiated")
    );
  };

  const incrementVoiceUsageLocally = (mode: "preview" | "full") => {
    const dayKey = getCloudTtsDayKey();
    setVoiceUsage((prev) => {
      const base =
        prev.dayKey === dayKey
          ? prev
          : {
              dayKey,
              previewUsed: 0,
              fullUsed: 0,
            };
      const nextState = {
        ...base,
        previewUsed: mode === "preview" ? base.previewUsed + 1 : base.previewUsed,
        fullUsed: mode === "full" ? base.fullUsed + 1 : base.fullUsed,
      };
      void AsyncStorage.setItem(
        getVoiceUsageStorageKey(walletAddress),
        JSON.stringify(nextState)
      ).catch((error) => {
        console.error("[meditation/[id]] Failed to persist TTS usage:", error);
      });
      return nextState;
    });
  };

  const playRemoteVoiceUrl = async (params: {
    url: string;
    mode: "preview" | "full";
    loadingLabel: string;
    playingLabel: string;
  }) => {
    if (Platform.OS === "web") {
      try {
        setVoiceStatus(params.loadingLabel);
        const response = await fetch(params.url, {
          method: "GET",
          cache: "force-cache",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch cached audio");
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        webTtsObjectUrlRef.current = blobUrl;
        try {
          await playWebAudioSource(blobUrl, params.playingLabel, params.mode);
          return;
        } catch (blobError) {
          if (webTtsObjectUrlRef.current === blobUrl) {
            URL.revokeObjectURL(blobUrl);
            webTtsObjectUrlRef.current = null;
          }
          console.warn("[meditation/[id]] Cached blob playback failed, retrying direct URL:", blobError);
        }
      } catch (fetchError) {
        console.warn("[meditation/[id]] Failed to fetch cached audio URL, retrying direct playback:", fetchError);
      }

      await playWebAudioSource(params.url, params.playingLabel, params.mode);
      return;
    }

    setVoiceStatus(params.loadingLabel);
    const { sound } = await Audio.Sound.createAsync(
      { uri: params.url },
      { shouldPlay: true, volume: 1 }
    );
    ttsSoundRef.current = sound;
    setIsSpeaking(true);
    setIsLoadingVoice(false);
    setVoiceMode(params.mode);
    setVoiceStatus(params.playingLabel);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        setIsSpeaking(false);
        setIsLoadingVoice(false);
        setVoiceMode(null);
        setVoiceStatus(
          params.mode === "full"
          ? tr("完整導引播放完成", "Full guidance finished", "Guía completa terminada")
          : tr("高質預覽播放完成", "Premium preview finished", "Vista previa premium terminada")
        );
        sound.unloadAsync().catch(() => {});
        if (ttsSoundRef.current === sound) {
          ttsSoundRef.current = null;
        }
      }
    });
  };

  const playDirectVoicePayload = async (params: {
    audioBase64: string;
    mimeType: string;
    mode: "preview" | "full";
    playingLabel: string;
  }) => {
    if (Platform.OS === "web") {
      const dataUrl = `data:${params.mimeType};base64,${params.audioBase64}`;
      if (typeof globalThis.atob === "function") {
        try {
          const binary = globalThis.atob(params.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: params.mimeType });
          const blobUrl = URL.createObjectURL(blob);
          webTtsObjectUrlRef.current = blobUrl;
          try {
            await playWebAudioSource(blobUrl, params.playingLabel, params.mode);
            return;
          } catch (blobError) {
            if (webTtsObjectUrlRef.current === blobUrl) {
              URL.revokeObjectURL(blobUrl);
              webTtsObjectUrlRef.current = null;
            }
            console.warn("[meditation/[id]] Blob playback failed, retrying with data URL:", blobError);
          }
        } catch (blobSetupError) {
          console.warn("[meditation/[id]] Failed to create blob URL for TTS playback:", blobSetupError);
        }
      }

      await playWebAudioSource(dataUrl, params.playingLabel, params.mode);
      return;
    }

    const dataUrl = `data:${params.mimeType};base64,${params.audioBase64}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri: dataUrl },
      { shouldPlay: true, volume: 1 }
    );
    ttsSoundRef.current = sound;
    setIsSpeaking(true);
    setIsLoadingVoice(false);
    setVoiceMode(params.mode);
    setVoiceStatus(params.playingLabel);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        setIsSpeaking(false);
        setIsLoadingVoice(false);
        setVoiceMode(null);
        setVoiceStatus(
          params.mode === "full"
          ? tr("完整導引播放完成", "Full guidance finished", "Guía completa terminada")
          : tr("高質預覽播放完成", "Premium preview finished", "Vista previa premium terminada")
        );
        sound.unloadAsync().catch(() => {});
        if (ttsSoundRef.current === sound) {
          ttsSoundRef.current = null;
        }
      }
    });
  };

  const playResolvedVoicePayload = async (params: {
    audioUrl?: string;
    audioBase64?: string;
    mimeType: string;
    mode: "preview" | "full";
    loadingLabel: string;
    playingLabel: string;
  }) => {
    if (params.audioUrl) {
      await playRemoteVoiceUrl({
        url: params.audioUrl,
        mode: params.mode,
        loadingLabel: params.loadingLabel,
        playingLabel: params.playingLabel,
      });
      return;
    }

    if (params.audioBase64) {
      await playDirectVoicePayload({
        audioBase64: params.audioBase64,
        mimeType: params.mimeType,
        mode: params.mode,
        playingLabel: params.playingLabel,
      });
      return;
    }

    throw new Error(tr("語音音檔不可用", "Voice payload is unavailable", "El audio de voz no está disponible"));
  };

  const handleFullGuidance = async () => {
    if (!isCustom || !customSession) return;
    if (isSpeaking && voiceMode === "full") {
      await stopVoiceGuidance();
      return;
    }
    if (isSpeaking) {
      await stopVoiceGuidance();
    }
    if (!hasActiveVIP) {
      Alert.alert(
        tr("VIP 專屬完整導引", "VIP full guidance", "Guía completa VIP"),
        tr(
          "完整導引只開放給 VIP。免費用戶可以先試聽 opening 預覽。",
          "Full guidance is reserved for VIP. Free users can still try the opening preview.",
          "La guía completa está reservada para VIP. Los usuarios gratuitos aún pueden probar la vista previa inicial."
        )
      );
      setVoiceStatus(tr("完整導引只開放給 VIP", "Full guidance is available for VIP only", "La guía completa solo está disponible para VIP"));
      return;
    }

    setIsLoadingVoice(true);
    setVoiceMode("full");
    setVoiceStatus(tr("正在檢查完整導引快取...", "Checking full guidance cache...", "Comprobando caché de guía completa..."));

    try {
      const fullText = normalizeNarrationText(customSession.script);
      if (!fullText) {
        throw new Error(tr("沒有可朗讀的內容", "There is no text to read", "No hay texto para leer"));
      }

      const cacheKey = createMeditationTtsCacheKey(`${session.id}-full`, fullText, customSession.language);
      const localFullPayload = localVoicePayloadCacheRef.current[cacheKey];
      if (localFullPayload) {
        setVoiceStatus(tr("正在播放已準備好的完整導引...", "Playing prepared full guidance...", "Reproduciendo guía completa preparada..."));
        await playResolvedVoicePayload({
          audioUrl: localFullPayload.audioUrl,
          audioBase64: localFullPayload.audioBase64,
          mimeType: localFullPayload.mimeType,
          mode: "full",
          loadingLabel: tr("正在載入完整導引...", "Loading full guidance...", "Cargando guía completa..."),
          playingLabel: tr("正在播放完整導引...", "Playing full guidance...", "Reproduciendo guía completa..."),
        });
        return;
      }
      const payload = await requestElevenLabsTts({
        sessionId: session.id,
        text: fullText,
        language: customSession.language,
        cacheKey,
        mode: "full",
        allowGenerate: fullGuidanceRemaining > 0,
      });
      if (!payload.cached) {
        incrementVoiceUsageLocally("full");
      }
      localVoicePayloadCacheRef.current[cacheKey] = {
        audioUrl: payload.audioUrl,
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
      };

      await playResolvedVoicePayload({
        audioUrl: payload.audioUrl,
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
        mode: "full",
        loadingLabel: tr("正在載入完整導引...", "Loading full guidance...", "Cargando guía completa..."),
        playingLabel: tr("正在播放完整導引...", "Playing full guidance...", "Reproduciendo guía completa..."),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Full guidance playback failed";
      console.error("[meditation/[id]] Full guidance failed:", error);
      setIsLoadingVoice(false);
      setIsSpeaking(false);
      setVoiceMode(null);
      setVoiceStatus(
        isUserGesturePlaybackError(error)
          ? tr("完整導引已準備好，請再按一次播放", "Full guidance is ready. Tap once more to play.", "La guía completa está lista. Toca una vez más para reproducirla.")
          : detail
      );
    }
  };

  const handlePreviewGuidance = async () => {
    if (!isCustom || !customSession) return;
    if (isSpeaking && voiceMode === "preview") {
      await stopVoiceGuidance();
      return;
    }
    if (isSpeaking) {
      await stopVoiceGuidance();
    }

    setIsLoadingVoice(true);
    setVoiceMode("preview");
    setVoiceStatus(tr("正在檢查 opening 預覽快取...", "Checking opening preview cache...", "Comprobando caché de vista previa inicial..."));

    try {
      const previewText = buildMeditationPreviewText(
        customSession.script,
        customSession.previewText || customSession.openingPreview,
        customSession.language
      );
      if (!previewText) {
        throw new Error(tr("沒有可用的 opening 預覽", "No opening preview is available", "No hay vista previa inicial disponible"));
      }

      const cacheKey = createMeditationTtsCacheKey(session.id, previewText, customSession.language);
      const localPreviewPayload = localVoicePayloadCacheRef.current[cacheKey];
      if (localPreviewPayload) {
        setVoiceStatus(tr("正在播放本機預覽快取...", "Playing local preview cache...", "Reproduciendo caché local de vista previa..."));
        await playResolvedVoicePayload({
          audioUrl: localPreviewPayload.audioUrl,
          audioBase64: localPreviewPayload.audioBase64,
          mimeType: localPreviewPayload.mimeType,
          mode: "preview",
          loadingLabel: tr("正在載入高質預覽...", "Loading premium preview...", "Cargando vista previa premium..."),
          playingLabel: tr("正在播放高質預覽...", "Playing premium preview...", "Reproduciendo vista previa premium..."),
        });
        return;
      }
      const payload = await requestElevenLabsTts({
        sessionId: session.id,
        text: previewText,
        language: customSession.language,
        cacheKey,
        mode: "preview",
        allowGenerate: previewRemaining > 0,
      });
      localVoicePayloadCacheRef.current[cacheKey] = {
        audioUrl: payload.audioUrl,
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
      };
      if (!payload.cached) {
        incrementVoiceUsageLocally("preview");
      }

      await playResolvedVoicePayload({
        audioUrl: payload.audioUrl,
        audioBase64: payload.audioBase64,
        mimeType: payload.mimeType,
        mode: "preview",
        loadingLabel: tr("正在載入高質預覽...", "Loading premium preview...", "Cargando vista previa premium..."),
        playingLabel: tr("正在播放高質預覽...", "Playing premium preview...", "Reproduciendo vista previa premium..."),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Voice preview is unavailable right now.";
      console.error("[meditation/[id]] Premium preview failed:", error);
      setIsLoadingVoice(false);
      setIsSpeaking(false);
      setVoiceMode(null);
      setVoiceStatus(
        isUserGesturePlaybackError(error)
          ? tr("高質預覽已準備好，請再按一次播放", "Premium preview is ready. Tap once more to play.", "La vista previa premium está lista. Toca una vez más para reproducirla.")
          : detail
      );
    }
  };

  useEffect(() => {
    console.log("Breathing animation effect triggered", { isPlaying, breathingMethod, isCustom });
    if (isPlaying) {
      let breathingAnimation: Animated.CompositeAnimation;
      let phaseInterval: ReturnType<typeof setInterval>;
      const maxBreathScale = isCustom ? 1.22 : 1.3;
      
      if (breathingMethod === '4-7-8') {
        let cycleTime = 0;
        const totalCycleTime = 19000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 4000) {
            setBreathingPhase('inhale');
          } else if (cycleTime < 11000) {
            setBreathingPhase('hold');
          } else {
            setBreathingPhase('exhale');
          }
        }, 100);

        breathingAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 4000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 7000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.0,
              duration: 8000,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );
      } else if (breathingMethod === '4-4-4-4') {
        let cycleTime = 0;
        const totalCycleTime = 16000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 4000) {
            setBreathingPhase('inhale');
          } else if (cycleTime < 8000) {
            setBreathingPhase('hold');
          } else if (cycleTime < 12000) {
            setBreathingPhase('exhale');
          } else {
            setBreathingPhase('rest');
          }
        }, 100);

        breathingAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.0,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.0,
              duration: 4000,
              useNativeDriver: true,
            }),
          ])
        );
      } else if (breathingMethod === '5-2-7') {
        let cycleTime = 0;
        const totalCycleTime = 14000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 5000) {
            setBreathingPhase('inhale');
          } else if (cycleTime < 7000) {
            setBreathingPhase('hold');
          } else {
            setBreathingPhase('exhale');
          }
        }, 100);

        breathingAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 5000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.0,
              duration: 7000,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );
      } else {
        let cycleTime = 0;
        const totalCycleTime = 6000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 3000) {
            setBreathingPhase('inhale');
          } else {
            setBreathingPhase('exhale');
          }
        }, 100);

        breathingAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnimation, {
              toValue: maxBreathScale,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.0,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      }
      
      breathingAnimation.start();
      console.log("Breathing animation started with method:", breathingMethod);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            void stopPlaybackExperience();
            const courseLabel = isCustom ? "AI" : "Library";
            const courseTitle = session?.title || session?.id || "Meditation Session";
            const courseName = `${courseLabel}: ${courseTitle}`;
            const durationMinutes = Math.max(1, durationMinutesRef.current || session?.duration || 0);
            const sessionId = session?.id || String(id ?? "meditation");
            console.log('[meditation/[id]] Completing meditation:', { sessionId, durationMinutes, courseName });
            void completeMeditation(sessionId, durationMinutes, false, courseName)
              .then((summary) => {
                setCompletionSummary(summary);
              })
              .catch((error) => {
                console.error("[meditation/[id]] Failed to complete meditation:", error);
                Alert.alert(
                  tr("完成時發生問題", "Completion Issue", "Problema al completar"),
                  tr("本次冥想已結束，但回報摘要未能生成。", "This session ended, but the completion summary could not be generated.", "Esta sesión terminó, pero no se pudo generar el resumen.")
                );
              });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        if (phaseInterval) clearInterval(phaseInterval);
        breathingAnimation.stop();
      };
    } else {
      breathAnimation.setValue(1.0);
      setBreathingPhase('inhale');
    }
  }, [breathAnimation, breathingMethod, completeMeditation, isCustom, isPlaying, session?.duration, session?.id, session?.title]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={session.gradient as any}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              testID="close-meditation"
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {session.title}
            </Text>

            <View style={styles.breathingMethodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '4-7-8' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('4-7-8')}
              >
                <Text style={[styles.methodText, breathingMethod === '4-7-8' && styles.methodTextActive]}>
                  {tr('4-7-8 呼吸法', '4-7-8 Breathing', 'Respiración 4-7-8')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '4-4-4-4' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('4-4-4-4')}
              >
                <Text style={[styles.methodText, breathingMethod === '4-4-4-4' && styles.methodTextActive]}>
                  {tr('箱式呼吸', 'Box Breathing', 'Respiración en caja')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '5-2-7' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('5-2-7')}
              >
                <Text style={[styles.methodText, breathingMethod === '5-2-7' && styles.methodTextActive]}>
                  {tr('腹式慢呼吸', 'Deep Belly', 'Respiración abdominal')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === 'free' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('free')}
              >
                <Text style={[styles.methodText, breathingMethod === 'free' && styles.methodTextActive]}>
                  {tr('自由呼吸', 'Free Breathing', 'Respiración libre')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.breathingContainer, isCustom && styles.breathingContainerCompact]}>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  isCustom && styles.breathingCircleCompact,
                  {
                    transform: [{ scale: breathAnimation }],
                  },
                ]}
              >
                <View style={styles.innerCircle}>
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  {isPlaying && (
                    <Text style={styles.breathText}>
                      {breathingPhase === 'inhale' && tr('吸氣', 'Inhale', 'Inhala')}
                      {breathingPhase === 'hold' && tr('屏氣', 'Hold', 'Sostén')}
                      {breathingPhase === 'exhale' && tr('呼氣', 'Exhale', 'Exhala')}
                      {breathingPhase === 'rest' && tr('屏氣', 'Hold', 'Sostén')}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            {isCustom && customSession ? (
              <View style={styles.scriptCard}>
                <TouchableOpacity
                  style={styles.scriptCardHeader}
                  onPress={() => setIsScriptCollapsed((value) => !value)}
                  activeOpacity={0.85}
                >
                  <View style={styles.scriptCardHeaderText}>
                    <Text style={styles.scriptCardEyebrow}>
                      {tr("文本導引", "Guidance script", "Guion de la guía")}
                    </Text>
                    <Text style={styles.scriptCardTitle}>
                      {isScriptCollapsed
                        ? tr("點擊展開完整腳本", "Tap to expand full script", "Toca para expandir el guion completo")
                        : tr("點擊收起腳本", "Tap to collapse script", "Toca para contraer el guion")}
                    </Text>
                  </View>
                  {isScriptCollapsed ? (
                    <ChevronUp size={18} color="#E9D5FF" />
                  ) : (
                    <ChevronDown size={18} color="#E9D5FF" />
                  )}
                </TouchableOpacity>

                {isScriptCollapsed ? (
                  <Text style={styles.scriptPreviewText}>{customScriptPreview}</Text>
                ) : (
                  <ScrollView
                    style={styles.scriptScrollView}
                    contentContainerStyle={styles.scriptContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <Text style={styles.scriptText} selectable>{customSession.script}</Text>
                  </ScrollView>
                )}
              </View>
            ) : (
              <Text style={styles.description}>{session.description}</Text>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowSoundPicker(true)}
              testID="sound-picker-button"
            >
              <Music size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
              testID="play-pause-button"
            >
              {isPlaying ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setVolume(v => v > 0 ? 0 : 0.5)}
              testID="volume-button"
            >
              {volume === 0 ? (
                <VolumeX size={24} color="#FFFFFF" />
              ) : (
                <Volume2 size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {isCustom && (
            <View style={[styles.voiceActionsCard, isVoicePanelCollapsed && styles.voiceActionsCardCollapsed]}>
              <View style={styles.voiceActionsHeader}>
                <View style={styles.voiceActionsHeaderText}>
                  <Text style={styles.voiceActionsTitle}>
                    {tr("語音導引", "Voice guidance", "Guía por voz")}
                  </Text>
                  {!isVoicePanelCollapsed ? (
                    <Text style={styles.voiceActionsMeta}>
                      {lang === "zh"
                        ? `預覽 ${previewUsageForToday}/${ELEVENLABS_DAILY_PREVIEW_LIMIT} · 完整 ${fullUsageForToday}/${ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT}`
                        : lang === "es"
                          ? `Vista previa ${previewUsageForToday}/${ELEVENLABS_DAILY_PREVIEW_LIMIT} · Completa ${fullUsageForToday}/${ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT}`
                          : `Preview ${previewUsageForToday}/${ELEVENLABS_DAILY_PREVIEW_LIMIT} · Full ${fullUsageForToday}/${ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT}`}
                    </Text>
                  ) : null}
                </View>
                {isVoicePanelCollapsed ? (
                  <View style={styles.voiceCollapsedMetaPill}>
                    <Text style={styles.voiceCollapsedMetaText}>
                      {hasActiveVIP
                        ? `P ${previewUsageForToday}/${ELEVENLABS_DAILY_PREVIEW_LIMIT} · F ${fullUsageForToday}/${ELEVENLABS_DAILY_FULL_GUIDANCE_LIMIT}`
                        : `P ${previewUsageForToday}/${ELEVENLABS_DAILY_PREVIEW_LIMIT}`}
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={styles.voiceCollapseButton}
                  onPress={() => setIsVoicePanelCollapsed((value) => !value)}
                  activeOpacity={0.85}
                >
                  {isVoicePanelCollapsed ? (
                    <ChevronUp size={18} color="#E9D5FF" />
                  ) : (
                    <ChevronDown size={18} color="#E9D5FF" />
                  )}
                </TouchableOpacity>
              </View>
              {(!isVoicePanelCollapsed || isSpeaking || isLoadingVoice) && !!voiceStatus && (
                <View style={styles.voiceStatusPill}>
                  <Text style={styles.voiceStatusPillEyebrow}>{voiceEngineLabel}</Text>
                  <Text style={styles.voiceStatusPillText} numberOfLines={1}>
                    {voiceStatus}
                  </Text>
                </View>
              )}
              {!isVoicePanelCollapsed ? (
                <View style={styles.voiceActionsRow}>
                  <TouchableOpacity
                    style={[styles.voiceActionButton, voiceMode === "full" && isSpeaking && styles.voiceActionButtonActive]}
                    onPress={handleFullGuidance}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.voiceActionEyebrow}>
                      {tr("VIP 完整導引", "VIP full guidance", "Guía completa VIP")}
                    </Text>
                    <Text style={styles.voiceActionTitle}>
                      {voiceMode === "full" && isSpeaking
                        ? tr("停止完整導引", "Stop full guidance", "Detener guía completa")
                        : hasActiveVIP
                          ? tr("播放完整導引", "Play full guidance", "Reproducir guía completa")
                          : tr("升級 VIP 解鎖完整導引", "Upgrade to unlock full guidance", "Hazte VIP para desbloquear la guía completa")}
                    </Text>
                    <Text style={styles.voiceActionBody}>
                      {hasActiveVIP
                        ? tr(
                            `完整導引只會在雲端快取可用時生成。生成成功後同一課程可無限重播。今日尚餘 ${fullGuidanceRemaining} 次生成。`,
                            `Full guidance only generates when cloud caching is available. Once generated, the same course can replay without limits. ${fullGuidanceRemaining} generations left today.`,
                            `La guía completa solo se genera cuando la caché en la nube está disponible. Una vez generada, el mismo curso puede reproducirse sin límites. Quedan ${fullGuidanceRemaining} generaciones hoy.`
                          )
                        : tr(
                            "免費版只開放 opening 預覽。升級 VIP 後，完整導引生成一次即可無限重播。",
                            "Free users get the opening preview only. Upgrade to VIP and each full guidance can replay without limits after the first generation.",
                            "Los usuarios gratuitos solo tienen la vista previa inicial. Hazte VIP y cada guía completa podrá reproducirse sin límites después de la primera generación."
                          )}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voiceActionButton, voiceMode === "preview" && (isSpeaking || isLoadingVoice) && styles.voiceActionButtonActive]}
                    onPress={handlePreviewGuidance}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.voiceActionEyebrow}>
                      {tr("ElevenLabs 預覽", "ElevenLabs preview", "Vista previa de ElevenLabs")}
                    </Text>
                    <Text style={styles.voiceActionTitle}>
                      {isLoadingVoice && voiceMode === "preview"
                        ? tr("生成高質預覽...", "Generating preview...", "Generando vista previa...")
                        : voiceMode === "preview" && isSpeaking
                          ? tr("停止高質預覽", "Stop premium preview", "Detener vista previa premium")
                          : tr("試聽高質語音", "Try premium preview", "Probar vista previa premium")}
                    </Text>
                    <Text style={styles.voiceActionBody}>
                      {tr(
                        `免費版可試聽 opening。生成一次後同一課程可無限重播。今日尚餘 ${previewRemaining} 次生成。`,
                        `Free users can try the opening preview. Once generated, the same course can replay without limits. ${previewRemaining} generations left today.`,
                        `Los usuarios gratuitos pueden probar la apertura. Una vez generada, el mismo curso puede reproducirse sin límites. Quedan ${previewRemaining} generaciones hoy.`
                      )}
                    </Text>
                    {isLoadingVoice && voiceMode === "preview" ? (
                      <ActivityIndicator color="#FFFFFF" style={styles.voiceActionSpinner} />
                    ) : null}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

        </Animated.View>
      </SafeAreaView>

      <Modal
        visible={showSoundPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSoundPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.soundPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tr('環境音', 'Ambient Sound', 'Sonido ambiental')}</Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
              {!hasActiveVIP && (
                <View style={styles.soundGatingBanner}>
                  <Text style={styles.soundGatingTitle}>
                    {tr('免費版只開放 5 條環境音', 'Free tier unlocks only 5 ambient sounds', 'La versión gratuita desbloquea solo 5 sonidos ambientales')}
                  </Text>
                  <Text style={styles.soundGatingText}>
                    {hasAmbientPassToday
                      ? tr(
                          '你今日已開啟全環境音通行，現在可使用全部環境音。',
                          'Your all-sounds pass is active today. Every ambient sound is available right now.',
                          'Tu pase completo de sonidos está activo hoy. Todos los sonidos ambientales están disponibles ahora mismo.'
                        )
                      : tr(
                          `其餘 ${vipAmbientSoundCount} 條環境音要升級 VIP，或花 ${RESONANCE_AMBIENT_PASS_COST} 點 Resonance 解鎖今天通行。`,
                          `The other ${vipAmbientSoundCount} ambient sounds need VIP, or ${RESONANCE_AMBIENT_PASS_COST} Resonance for a one-day pass.`,
                          `Los otros ${vipAmbientSoundCount} sonidos ambientales requieren VIP o ${RESONANCE_AMBIENT_PASS_COST} Resonance para un pase de un día.`
                        )}
                  </Text>
                  {!hasAmbientPassToday && (
                    <>
                      <TouchableOpacity
                        style={[styles.soundOption, { marginTop: 10, borderColor: '#22c55e' }]}
                        onPress={handleUnlockAmbientPass}
                        disabled={unlockingAmbientPass}
                      >
                        <Text style={[styles.soundOptionText, { color: '#22c55e', fontWeight: '700' as const }]}>
                          {unlockingAmbientPass
                            ? tr('解鎖中...', 'Unlocking...', 'Desbloqueando...')
                            : tr(
                                `解鎖今天全部環境音 · ${RESONANCE_AMBIENT_PASS_COST} Resonance`,
                                `Unlock all ambient sounds today · ${RESONANCE_AMBIENT_PASS_COST} Resonance`,
                                `Desbloquear todos los sonidos hoy · ${RESONANCE_AMBIENT_PASS_COST} Resonance`
                              )}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.soundOption, { marginTop: 10, borderColor: '#8B5CF6' }]}
                        onPress={() => {
                          setShowSoundPicker(false);
                          router.push("/(tabs)/profile");
                        }}
                      >
                        <Text style={[styles.soundOptionText, { color: '#8B5CF6', fontWeight: '700' as const }]}>
                          {tr('開通 VIP 以在有效期內全部解鎖', 'Upgrade to VIP for full access while active', 'Hazte VIP para acceso completo mientras esté activo')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.soundOption,
                  selectedSound === null && styles.soundOptionSelected
                ]}
                onPress={() => {
                  setSelectedSound(null);
                  setShowSoundPicker(false);
                }}
              >
                <Text style={[
                  styles.soundOptionText,
                  selectedSound === null && styles.soundOptionTextSelected
                ]}>
                  {tr('無', 'None', 'Ninguno')}
                </Text>
                {selectedSound === null && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>

              {AMBIENT_SOUND_CATEGORIES.map((category) => (
                <View key={category.id}>
                  <Text style={styles.categoryTitle}>{category.name[ambientLabelLanguage]}</Text>
                  {category.sounds.map((sound) => {
                    const isLocked = !hasActiveVIP && !hasAmbientPassToday && !isAmbientSoundFree(sound.id);
                    return (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.soundOption,
                        selectedSound === sound.id && styles.soundOptionSelected,
                        isLocked && styles.soundOptionLocked,
                      ]}
                      onPress={() => {
                        if (isLocked) {
                          setShowSoundPicker(false);
                          router.push("/(tabs)/profile");
                          return;
                        }
                        setSelectedSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                    >
                      <View style={styles.soundOptionContent}>
                        <Text style={[
                          styles.soundOptionText,
                          selectedSound === sound.id && styles.soundOptionTextSelected,
                          isLocked && styles.soundOptionTextLocked,
                        ]}>
                          {sound.name[lang] ?? sound.name.en}
                        </Text>
                        {isLocked && <Text style={styles.soundVipBadge}>VIP</Text>}
                      </View>
                      {selectedSound === sound.id && !isLocked && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </TouchableOpacity>
                  )})}
                </View>
              ))}
            </ScrollView>

            <View style={styles.volumeControl}>
              <VolumeX size={20} color="#6B7280" />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#E5E7EB"
              />
              <Volume2 size={20} color="#6B7280" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(completionSummary)}
        transparent
        animationType="fade"
        onRequestClose={() => setCompletionSummary(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionTitle}>
              {tr("本次冥想回報", "Session Summary", "Resumen de la sesión")}
            </Text>
            <Text style={styles.completionSubtitle}>
              {tr("你這次的練習已經推進了這些旅程。", "This session moved your journey forward in these ways.", "Esta sesión hizo avanzar tu viaje de estas maneras.")}
            </Text>
            <View style={styles.completionNextCard}>
              <Text style={styles.completionNextEyebrow}>
                {tr("下一步", "Next Step", "Siguiente paso")}
              </Text>
              <Text style={styles.completionNextBody}>
                {completionNextStepLabel}
              </Text>
            </View>

            <View style={styles.completionPillRow}>
              <View style={styles.completionPill}>
                <Text style={styles.completionPillText}>
                  {tr(`連續 ${completionSummary?.streakAfter} 天`, `${completionSummary?.streakAfter}-day streak`, `Racha de ${completionSummary?.streakAfter} días`)}
                </Text>
              </View>
              <View style={styles.completionPill}>
                <Text style={styles.completionPillText}>
                  {tr(`總課程 ${completionSummary?.totalSessionsAfter}`, `Total sessions ${completionSummary?.totalSessionsAfter}`, `Sesiones totales ${completionSummary?.totalSessionsAfter}`)}
                </Text>
              </View>
            </View>

            <View style={styles.completionList}>
              <Text style={styles.completionItem}>
                {tr(
                  `冥想總分鐘：${completionSummary?.totalMinutesAfter} 分鐘`,
                  `Total meditation minutes: ${completionSummary?.totalMinutesAfter}`,
                  `Minutos totales de meditación: ${completionSummary?.totalMinutesAfter}`
                )}
              </Text>
              {completionSummary?.sessionCategory ? (
                <Text style={styles.completionItem}>
                  {completionSummary.addedNewCategory
                    ? (lang === "zh"
                      ? `已新增主題探索：${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.zh ?? completionSummary.sessionCategory}`
                      : lang === "es"
                        ? `Nuevo tema explorado: ${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.es ?? CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.en ?? completionSummary.sessionCategory}`
                        : `New theme explored: ${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.en ?? completionSummary.sessionCategory}`)
                    : (lang === "zh"
                      ? `本次完成主題：${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.zh ?? completionSummary.sessionCategory}`
                      : lang === "es"
                        ? `Tema completado: ${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.es ?? CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.en ?? completionSummary.sessionCategory}`
                        : `Completed theme: ${CATEGORY_LABEL_MAP[completionSummary.sessionCategory]?.en ?? completionSummary.sessionCategory}`)}
                </Text>
              ) : null}
              {completionSummary?.customMeditationCompleted ? (
                <Text style={styles.completionItem}>
                  {tr("AI 課程任務已推進 1 次", "AI session mission progressed by 1", "La misión de sesión AI avanzó en 1")}
                </Text>
              ) : null}
              <Text style={styles.completionItem}>
                {completionSummary?.orbLevelAfter !== completionSummary?.orbLevelBefore
                  ? (lang === "zh"
                    ? `主光球等級提升：${completionSummary?.orbLevelBefore} → ${completionSummary?.orbLevelAfter}`
                    : `Main orb level increased: ${completionSummary?.orbLevelBefore} → ${completionSummary?.orbLevelAfter}`)
                  : (lang === "zh"
                    ? `主光球等級維持：${completionSummary?.orbLevelAfter}`
                    : `Main orb level remains: ${completionSummary?.orbLevelAfter}`)}
              </Text>
              {completionSummary?.orbAwakenedNow ? (
                <Text style={styles.completionItem}>
                  {tr("你已完成七層旅程，白色覺醒核心已誕生", "You completed the seven layers and awakened the white core", "Completaste las siete capas y despertaste el núcleo blanco")}
                </Text>
              ) : null}
              <Text style={styles.completionItem}>
                {completionSummary?.uploaded
                  ? tr("雲端同步：已完成", "Cloud sync: complete", "Sincronización en la nube: completada")
                  : tr("雲端同步：未完成，但本地進度已保留", "Cloud sync: incomplete, but local progress was kept", "Sincronización en la nube: incompleta, pero el progreso local se conservó")}
              </Text>
              <Text style={styles.completionItem}>
                {tr("環境音與語音引導已自動停止。", "Ambient audio and voice guidance have been stopped automatically.", "El audio ambiental y la guía por voz se detuvieron automáticamente.")}
              </Text>
              <Text style={styles.completionItem}>
                {completionSummary?.resonanceGained
                  ? (lang === "zh"
                    ? `Resonance：+${completionSummary.resonanceGained}（目前 ${completionSummary.resonanceBalanceAfter}）`
                    : `Resonance: +${completionSummary.resonanceGained} (now ${completionSummary.resonanceBalanceAfter})`)
                  : tr(
                    `Resonance：本次未新增（目前 ${completionSummary?.resonanceBalanceAfter ?? 0}）`,
                    `Resonance: no new gain this session (now ${completionSummary?.resonanceBalanceAfter ?? 0})`,
                    `Resonance: sin nueva ganancia en esta sesión (ahora ${completionSummary?.resonanceBalanceAfter ?? 0})`
                  )}
              </Text>
              {completionSummary?.resonanceRewardTypes?.length ? (
                <Text style={styles.completionItem}>
                  {lang === "zh"
                    ? `來源：${completionSummary.resonanceRewardTypes.map((type) => getResonanceRewardLabel(type, "zh")).join("、")}`
                    : lang === "es"
                      ? `Fuentes: ${completionSummary.resonanceRewardTypes.map((type) => getResonanceRewardLabel(type, "es")).join(", ")}`
                      : `Sources: ${completionSummary.resonanceRewardTypes.map((type) => getResonanceRewardLabel(type, "en")).join(", ")}`}
                </Text>
              ) : null}
              {completionSummary?.resonanceDailyCapReached ? (
                <Text style={styles.completionItem}>
                  {tr("今日 Resonance 已接近或達到上限。", "Your daily Resonance cap is close or already reached.", "Tu límite diario de Resonance está cerca o ya fue alcanzado.")}
                </Text>
              ) : null}
            </View>

            <View style={styles.completionActions}>
              <TouchableOpacity
                style={styles.completionSecondaryButton}
                onPress={() => {
                  setCompletionSummary(null);
                  router.push("/progress");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.completionSecondaryText}>
                  {tr("看進度", "View Progress", "Ver progreso")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionPrimaryButton}
                onPress={() => {
                  setCompletionSummary(null);
                  router.push(completionNextStepRoute as never);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.completionPrimaryText}>
                  {tr("做下一步", "Do Next Step", "Dar el siguiente paso")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 8,
  },
  sessionTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    maxWidth: "92%",
  },

  breathingContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 18,
  },
  breathingContainerCompact: {
    width: width * 0.52,
    height: width * 0.52,
    marginTop: 22,
    marginBottom: 22,
  },
  breathingCircle: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  breathingCircleCompact: {
    shadowRadius: 14,
  },
  innerCircle: {
    width: "70%",
    height: "70%",
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  breathText: {
    fontSize: 16,
    color: "#E0E7FF",
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: "#E0E7FF",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  scriptCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    marginTop: 18,
  },
  scriptCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  scriptCardHeaderText: {
    flex: 1,
    gap: 3,
  },
  scriptCardEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C4B5FD",
    textTransform: "uppercase",
  },
  scriptCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scriptPreviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#E9D5FF",
    paddingBottom: 4,
  },
  scriptScrollView: {
    width: "100%",
    maxHeight: 160,
  },
  scriptContent: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  scriptText: {
    fontSize: 15,
    color: "#E0E7FF",
    lineHeight: 25,
    textAlign: "left",
  },
  speakingButton: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
  },
  speakingIndicator: {
    justifyContent: "center",
    alignItems: "center",
  },
  speakingText: {
    fontSize: 24,
    color: "#FFD700",
  },
  breathingMethodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  methodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  methodButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  methodText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  methodTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  voiceActionsCard: {
    marginBottom: 8,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.28)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  voiceActionsCardCollapsed: {
    marginBottom: 4,
    paddingVertical: 8,
    gap: 6,
  },
  voiceActionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  voiceActionsHeaderText: {
    flex: 1,
    gap: 4,
  },
  voiceCollapsedMetaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(167, 139, 250, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.28)",
  },
  voiceCollapsedMetaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DDD6FE",
  },
  voiceActionsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  voiceActionsMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C4B5FD",
  },
  voiceCollapseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  voiceStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  voiceStatusPillEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A78BFA",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  voiceStatusPillText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "#F8FAFC",
  },
  voiceActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  voiceActionButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 118,
  },
  voiceActionButtonActive: {
    borderColor: "rgba(196, 181, 253, 0.9)",
    backgroundColor: "rgba(139,92,246,0.18)",
  },
  voiceActionEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A78BFA",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  voiceActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  voiceActionBody: {
    fontSize: 12,
    lineHeight: 17,
    color: "#E2E8F0",
  },
  voiceActionSpinner: {
    marginTop: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 24,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  soundPickerModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  soundList: {
    maxHeight: 400,
  },
  soundGatingBanner: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  soundGatingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  soundGatingText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8B5CF6",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  soundOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  soundOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    paddingRight: 12,
  },
  soundOptionLocked: {
    opacity: 0.82,
  },
  soundOptionSelected: {
    backgroundColor: "#F3F4F6",
  },
  soundOptionText: {
    fontSize: 16,
    color: "#4B5563",
  },
  soundOptionTextLocked: {
    color: "#6B7280",
  },
  soundOptionTextSelected: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  soundVipBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
  },
  volumeControl: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  completionModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 16,
  },
  completionNextCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  completionNextEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#8B5CF6",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  completionNextBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
  completionPillRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  completionPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  completionPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
  },
  completionList: {
    gap: 10,
    marginBottom: 20,
  },
  completionItem: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  completionActions: {
    flexDirection: "row",
    gap: 12,
  },
  completionSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  completionSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  completionPrimaryButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  completionPrimaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
