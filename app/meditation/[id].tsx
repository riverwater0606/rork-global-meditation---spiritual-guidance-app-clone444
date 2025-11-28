import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, X, Volume2, VolumeX, Music, MessageSquare } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";

const { width } = Dimensions.get("window");

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
  const { completeMeditation, customMeditations } = useMeditation();
  const { settings } = useSettings();
  const lang = settings.language;
  
  const customSession = customMeditations.find(m => m.id === id);
  const isCustom = !!customSession;
  const session = isCustom ? {
    id: customSession.id,
    title: customSession.title,
    description: customSession.script.substring(0, 100) + '...',
    duration: customSession.duration,
    narrator: lang === 'zh' ? 'AI 生成' : 'AI Generated',
    category: 'custom',
    gradient: ['#8B5CF6', '#6366F1'],
  } : sessionFromLibrary;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session?.duration ? session.duration * 60 : 600);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [breathingMethod, setBreathingMethod] = useState<'4-7-8' | '4-4-4-4' | '5-2-7' | 'free'>('4-7-8');
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const originalVolume = useRef(0.5);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');

  // 關鍵修復：正確同步 AI 課程的呼吸法
  useEffect(() => {
    const method = (isCustom && customSession?.breathingMethod) || '4-7-8';
    if (['4-7-8', '4-4-4-4', '5-2-7', 'free'].includes(method)) {
      setBreathingMethod(method as any);
    }
  }, [isCustom, customSession?.breathingMethod]);

  // 關鍵修復：呼吸動畫只監聽 isPlaying + breathingMethod
  useEffect(() => {
    if (!isPlaying) {
      breathAnimation.setValue(1);
      setBreathingPhase('inhale');
      return;
    }

    const animations = {
      '4-7-8': Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 4000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 7000, useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.0, duration: 8000, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      ),
      '4-4-4-4': Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 4000, useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.0, duration: 4000, useNativeDriver: true }),
        ])
      ),
      '5-2-7': Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 5000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.35, duration: 2000, useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.0, duration: 7000, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])
      ),
      'free': Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnimation, { toValue: 1.3, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(breathAnimation, { toValue: 1.0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ),
    };

    const animation = animations[breathingMethod] || animations['4-7-8'];
    animation.start();

    return () => animation.stop();
  }, [isPlaying, breathingMethod]);

  // 語音引導（web 環境必須直接呼叫）
  const handleVoiceGuidance = () => {
    if (!isCustom || !customSession) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(customSession.script, {
      language: lang.startsWith('zh') ? 'zh-CN' : 'en-US',
      rate: 0.9,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // 你的其他 useEffect（音效載入、volume、timer）全部保持不變
  // return JSX 也完全不變

  return (
    // 你的 UI 完全不變
  );
}

// styles 完全不變
