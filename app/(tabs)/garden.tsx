/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Modal, Dimensions, Animated, Easing, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas } from "@react-three/fiber";
import { useMeditation, OrbShape, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { getFirebaseDiagnostics as getFirebaseDiagnosticsFn, getFirebaseMissingEnv, isFirebaseEnabled } from "@/constants/firebase";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Clock, Zap, Archive, ArrowUp, ArrowDown, Sparkles, X, Sprout, Maximize2, Minimize2, Music, Volume2, VolumeX } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled } from "@/components/worldcoin/IDKitWeb";
import { MiniKit, ResponseEvent } from "@/constants/minikit";
import { APP_ID } from "@/constants/world";
import * as firebaseDiagnostics from "@/constants/firebase";
import * as Haptics from "expo-haptics";
import { OrbParticles } from "@/features/garden/components/OrbParticles";
import { useAmbientAudio } from "@/features/garden/hooks/useAmbientAudio";
import { useGiftSync } from "@/features/garden/hooks/useGiftSync";
import { extractContactsFromPayload, extractContactWalletAddress, formatContactName } from "@/features/garden/services/contactUtils";

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

// Minimal Progress Component (Corner Ring)
const MinimalProgress = forwardRef(({ theme, duration }: { theme: any, duration: number }, ref) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useImperativeHandle(ref, () => ({
    update: (newProgress: number) => {
      if (!visible && newProgress > 0) setVisible(true);
      setProgress(newProgress);
    },
    reset: () => {
      setVisible(false);
      setProgress(0);
    }
  }));

  if (!visible) return null;

  return (
    <View style={styles.cornerProgressContainer}>
      <View style={styles.ringContainer}>
        <View style={[styles.ringBackground, { borderColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[
          styles.ringProgress, 
          { 
            borderColor: theme.primary,
            transform: [{ rotate: '45deg' }],
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
          } 
        ]} />
         <Text style={styles.cornerProgressText}>{Math.floor(progress * 100)}%</Text>
      </View>
    </View>
  );
});
MinimalProgress.displayName = "MinimalProgress";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;

const shapes: { id: OrbShape, name: string, nameZh: string, icon: string }[] = [
  { id: 'flower-of-life-complete', name: 'Flower of Life', nameZh: '生命之花', icon: '' },
  { id: 'star-of-david', name: 'Star of David', nameZh: '六芒星', icon: '' },
  { id: 'merkaba', name: 'Merkaba', nameZh: '梅爾卡巴', icon: '' },
  { id: 'tree-of-life', name: 'Tree of Life', nameZh: '生命之樹', icon: '' },
  { id: 'grid-of-life', name: 'Grid of Life', nameZh: '生命之格', icon: '' },
  { id: 'sri-yantra', name: 'Sri Yantra', nameZh: '吉祥之輪', icon: '' },
  { id: 'triquetra', name: 'Triquetra', nameZh: '三位一體結', icon: '' },
  { id: 'golden-rectangles', name: 'Golden Rectangles', nameZh: '黃金矩形', icon: '' },
  { id: 'double-helix-dna', name: 'Double Helix DNA', nameZh: 'DNA雙螺旋', icon: '' },
  { id: 'vortex-ring', name: 'Vortex Ring', nameZh: '漩渦環', icon: '' },
  { id: 'fractal-tree', name: 'Fractal Tree', nameZh: '分形樹', icon: '' },
  { id: 'wave-interference', name: 'Wave Interference', nameZh: '波干涉', icon: '' },
  { id: 'quantum-orbitals', name: 'Quantum Orbitals', nameZh: '量子軌道', icon: '' },
  { id: 'celtic-knot', name: 'Celtic Knot', nameZh: '凱爾特結', icon: '' },
  { id: 'starburst-nova', name: 'Starburst Nova', nameZh: '星爆新星', icon: '' },
  { id: 'lattice-wave', name: 'Lattice Wave', nameZh: '晶格波', icon: '' },
  { id: 'sacred-flame', name: 'Sacred Flame', nameZh: '聖火', icon: '' },
  { id: 'earth', name: 'Earth', nameZh: '地球', icon: '' },
];

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const firebaseEnabled = isFirebaseEnabled();
  const firebaseMissingEnv = getFirebaseMissingEnv();
  
  // Dynamic collapsed height based on safe area
  const collapsedHeight = 90 + insets.bottom;
  const collapsedHeightRef = useRef(collapsedHeight);
  
  const { 
    currentOrb, 
    sendOrb, 
    storeOrb,
    swapOrb,
    orbHistory, 
    hasGrownOrbToday,
    cultivateDailyOrb,
    completeMeditation,
    devAddLayer,  
    devInstantOrb, 
    devResetOrb, 
    devSendOrbToSelf,
    setOrbShape,
    setSharedSpinVelocity,
    receiveGiftOrb 
  } = useMeditation();

  // Refs for stale closure fix in PanResponder
  const currentOrbRef = useRef(currentOrb);
  const storeOrbRef = useRef(storeOrb);
  const sendOrbRef = useRef(sendOrb);
  
  useEffect(() => {
    currentOrbRef.current = currentOrb;
    storeOrbRef.current = storeOrb;
    sendOrbRef.current = sendOrb;
  }, [currentOrb, storeOrb, sendOrb]);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOrbDragging, setIsOrbDragging] = useState<boolean>(false);
  const isOrbDraggingRef = useRef<boolean>(false);
  // Initialize with the calculated collapsed height
  const panelHeight = useRef(new Animated.Value(collapsedHeight)).current;

  // Meditation State
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(0);
  const [showAwakenedModal, setShowAwakenedModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [awakenedIntention, setAwakenedIntention] = useState("");
  const [awakenedDuration, setAwakenedDuration] = useState(15);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const isGifting = useRef(false); // Ref for lock to prevent double execution
  const hasAttemptedGift = useRef(false); // Ref to track if user tried to gift
  const [isGiftingUI, setIsGiftingUI] = useState(false); // State for UI loading indicator
  const [giftingError, setGiftingError] = useState<string | null>(null);
  const giftUploadAttemptRef = useRef(false);
  const pendingShareContactsRef = useRef(false);
  const shareContactsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeResetTimeoutRef = useRef<any>(null); // Safety timeout for mode reset
  const meditationTimerRef = useRef<any>(null);
  const handleGiftSuccessRef = useRef<(contact: any) => void>(() => {});
  const miniKitSubscribedRef = useRef(false);
  const miniKitInstanceRef = useRef<any | null>(null);
  const miniKitPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const miniKitLoggedMissingRef = useRef(false);
  const pauseMiniKitAutoSubscribeRef = useRef(false);
  const {
    selectedAmbientSound,
    setSelectedAmbientSound,
    ambientVolume,
    setAmbientVolume,
    showSoundPicker,
    setShowSoundPicker,
    syncMeditatingState,
    playGiftSendSound,
  } = useAmbientAudio(AMBIENT_SOUND_CATEGORIES);
  const useShareContactsAsyncOnly = true;

  useEffect(() => {
    console.log("[DEBUG_GIFT] GardenScreen MOUNTED - Checking for pending actions...");
    return () => console.log("[DEBUG_GIFT] GardenScreen UNMOUNTED");
  }, []);

  const clearShareContactsTimeout = () => {
    if (shareContactsTimeoutRef.current) {
      clearTimeout(shareContactsTimeoutRef.current);
      shareContactsTimeoutRef.current = null;
    }
  };

  const toSafeJson = (value: any) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      console.warn("[DEBUG_GIFT] Failed to stringify payload:", error);
      return String(value);
    }
  };

  const stopMiniKitPolling = () => {
    if (miniKitPollRef.current) {
      clearInterval(miniKitPollRef.current);
      miniKitPollRef.current = null;
    }
  };

  const resolveMiniKit = () => getMiniKit?.() ?? MiniKit;

  const MIN_WORLD_APP_VERSION = "2.8.72";
  const MIN_MINIKIT_VERSION = "1.4.0";

  const parseVersionString = (value: unknown) => {
    if (value === undefined || value === null) return null;
    const match = String(value).match(/\d+(?:\.\d+)+/);
    return match?.[0] ?? null;
  };

  const compareVersions = (left: string, right: string) => {
    const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
    const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));
    const maxLength = Math.max(leftParts.length, rightParts.length);
    for (let i = 0; i < maxLength; i += 1) {
      const leftValue = leftParts[i] ?? 0;
      const rightValue = rightParts[i] ?? 0;
      if (leftValue > rightValue) return 1;
      if (leftValue < rightValue) return -1;
    }
    return 0;
  };

  const getMiniKitVersion = (candidate: any) =>
    parseVersionString(
      candidate?.version ??
        candidate?.sdkVersion ??
        candidate?.miniKitVersion ??
        candidate?.deviceProperties?.miniKitVersion ??
        candidate?.deviceProperties?.sdkVersion
    );

  const getWorldAppVersion = (candidate: any) =>
    parseVersionString(
      candidate?.deviceProperties?.worldAppVersion ??
        candidate?.deviceProperties?.worldAppVersionName ??
        candidate?.deviceProperties?.worldAppVersionCode
    );

  const ensureMiniKitVersionSupported = (candidate: any) => {
    const worldAppVersion = getWorldAppVersion(candidate);
    const miniKitVersion = getMiniKitVersion(candidate);
    if (worldAppVersion && compareVersions(worldAppVersion, MIN_WORLD_APP_VERSION) < 0) {
      const error = new Error("version_unsupported");
      (error as any).code = "version_unsupported";
      (error as any).details = { worldAppVersion, miniKitVersion };
      throw error;
    }
    if (miniKitVersion && compareVersions(miniKitVersion, MIN_MINIKIT_VERSION) < 0) {
      const error = new Error("version_unsupported");
      (error as any).code = "version_unsupported";
      (error as any).details = { worldAppVersion, miniKitVersion };
      throw error;
    }
  };

  const parseGiftErrorMessage = (error: any) => {
    const code = error?.code || error?.message;
    if (code === "world_app_version_unsupported" || code === "version_unsupported") {
      return settings.language === "zh"
        ? "World App 版本過低，請更新"
        : "World App version is too old. Please update.";
    }
    if (code === "minikit_version_unsupported") {
      return settings.language === "zh"
        ? "MiniKit 版本過低"
        : "MiniKit version is too old.";
    }
    return null;
  };

  const shareContactsUnified = async ({
    miniKitInstance,
    shareContactsAsyncFn,
    shareContactsCommandFn,
    payload,
  }: {
    miniKitInstance: any;
    shareContactsAsyncFn?: (data: any) => Promise<any>;
    shareContactsCommandFn?: (data: any) => any;
    payload: any;
  }) => {
    const worldAppVersion = parseVersionString(miniKitInstance?.deviceProperties?.worldAppVersion);
    if (worldAppVersion && compareVersions(worldAppVersion, MIN_WORLD_APP_VERSION) < 0) {
      const error = new Error("world_app_version_unsupported");
      (error as any).code = "world_app_version_unsupported";
      (error as any).details = { worldAppVersion };
      throw error;
    }
    ensureMiniKitVersionSupported(miniKitInstance);
    const miniKitVersion = parseVersionString(
      miniKitInstance?.version ??
        miniKitInstance?.sdkVersion ??
        miniKitInstance?.miniKitVersion
    );
    if (miniKitVersion && compareVersions(miniKitVersion, MIN_MINIKIT_VERSION) < 0) {
      throw new Error("minikit_version_unsupported");
    }
    if (shareContactsCommandFn) {
      const result = shareContactsCommandFn(payload);
      console.log("[DEBUG_GIFT_CLOUD] shareContacts command dispatched:", JSON.stringify(result ?? {}, null, 2));
      return null;
    }
    const result = await shareContactsAsyncFn?.(payload);
    console.log("[DEBUG_GIFT_CLOUD] shareContacts resolved:", JSON.stringify(result, null, 2));
    return result;
  };

  const isMiniKitInstalled = async (candidate: any) => {
    if (!candidate) return false;
    try {
      const installed = typeof candidate.isInstalled === "function" ? candidate.isInstalled() : candidate.isInstalled;
      if (typeof installed?.then === "function") {
        return Boolean(await installed);
      }
      return Boolean(installed);
    } catch (error) {
      console.warn("[DEBUG_GIFT] MiniKit isInstalled check failed:", error);
      return false;
    }
  };

  const waitForMiniKitInstalled = async (
    candidate: any,
    timeoutMs = 1500,
    intervalMs = 100
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await isMiniKitInstalled(candidate)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return isMiniKitInstalled(candidate);
  };

  const subscribeMiniKit = (candidate: any, onEvent: (payload: any) => void) => {
    if (!candidate) return false;
    if (miniKitInstanceRef.current && miniKitInstanceRef.current !== candidate) {
      try {
        miniKitInstanceRef.current.unsubscribe(ResponseEvent.MiniAppShareContacts);
      } catch (error) {
        console.warn("[DEBUG_GIFT] MiniKit unsubscribe failed:", error);
      }
      miniKitSubscribedRef.current = false;
    }
    if (miniKitSubscribedRef.current && miniKitInstanceRef.current === candidate) {
      return true;
    }
    candidate.subscribe(ResponseEvent.MiniAppShareContacts, onEvent);
    miniKitSubscribedRef.current = true;
    miniKitInstanceRef.current = candidate;
    return true;
  };

  const handleMiniKitShareContactsEvent = (payload: any) => {
    console.log("[DEBUG_GIFT] MiniKit Event: ResponseEvent.MiniAppShareContacts triggered");
    console.log("[DEBUG_GIFT] Event Payload (Full):", toSafeJson(payload));

    const payloadRoot = payload?.finalPayload || payload;
    const status = payloadRoot?.status;
    if (status === "error") {
      const errorCode = payloadRoot?.error_code || payloadRoot?.error?.code || payloadRoot?.error?.message || payloadRoot?.message || "unknown";
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      isGifting.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
        settings.language === "zh"
          ? `選擇朋友失敗，請重試\n錯誤原因：${errorCode}`
          : `Friend selection failed. Please retry.\nReason: ${errorCode}`
      );
      return;
    }

    const contacts = extractContactsFromPayload(payload?.finalPayload || payload);
    const contact = contacts[0];
    const selectedWalletAddress = extractContactWalletAddress(contact);
    if (selectedWalletAddress) {
      console.log(`[DEBUG_GIFT] ShareContacts success: wallet = ${selectedWalletAddress}`);
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      handleGiftSuccessRef.current(contact);
    } else {
      console.log("[DEBUG_GIFT] No walletAddress");
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      isGifting.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
        settings.language === "zh" ? "選擇朋友失敗，請重試" : "Friend selection failed. Please retry."
      );
    }
  };

  // Subscribe to MiniKit Events
  useEffect(() => {
    if (useShareContactsAsyncOnly) {
      return;
    }

    const attemptSubscribe = async () => {
      if (pauseMiniKitAutoSubscribeRef.current) {
        return false;
      }
      const candidate = resolveMiniKit();
      const installed = await isMiniKitInstalled(candidate);
      if (!installed) {
        if (!miniKitLoggedMissingRef.current) {
          console.log("[DEBUG] MiniKit not installed or not available for subscription");
          miniKitLoggedMissingRef.current = true;
        }
        return false;
      }

      const subscribed = subscribeMiniKit(candidate, handleMiniKitShareContactsEvent);
      if (subscribed) {
        stopMiniKitPolling();
      }
      return subscribed;
    };

    void attemptSubscribe();

    if (!useShareContactsAsyncOnly && !miniKitSubscribedRef.current && !miniKitPollRef.current) {
      miniKitPollRef.current = setInterval(() => {
        void attemptSubscribe();
      }, 300);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void attemptSubscribe();
      }
    };

    if (typeof window !== "undefined" && !useShareContactsAsyncOnly) {
      window.addEventListener("focus", handleVisibilityChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("minikit:ready", handleVisibilityChange as EventListener);
    }

    return () => {
      stopMiniKitPolling();
      if (miniKitInstanceRef.current) {
        try {
          miniKitInstanceRef.current.unsubscribe(ResponseEvent.MiniAppShareContacts);
        } catch (error) {
          console.warn("[DEBUG_GIFT] MiniKit unsubscribe failed:", error);
        }
      }
      miniKitSubscribedRef.current = false;
      miniKitInstanceRef.current = null;
      miniKitLoggedMissingRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleVisibilityChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("minikit:ready", handleVisibilityChange as EventListener);
      }
    };
  }, [settings.language]);

  // Update ref when insets change
  useEffect(() => {
    collapsedHeightRef.current = collapsedHeight;
    // If not expanded, adjust the height to match new insets (e.g. rotation)
    if (!isExpanded) {
      Animated.timing(panelHeight, {
        toValue: collapsedHeight,
        duration: 0,
        useNativeDriver: false
      }).start();
    }
  }, [collapsedHeight, isExpanded, panelHeight]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (meditationTimerRef.current) clearInterval(meditationTimerRef.current);
      if (modeResetTimeoutRef.current) clearTimeout(modeResetTimeoutRef.current);
      clearShareContactsTimeout();
    };
  }, []);

  useEffect(() => {
    void syncMeditatingState(isMeditating);
  }, [isMeditating, syncMeditatingState]);
  
  const panelPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture vertical movements on the header
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        panelHeight.setOffset((panelHeight as any)._value);
        panelHeight.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Dragging UP is negative dy. We want to increase height.
        // newHeight = offset + (-dy)
        // We invert dy so dragging up increases value
        const dy = -gestureState.dy;
        
        // Simple bounds check during drag (optional, but good for UX)
        // We let it be flexible and snap later
        panelHeight.setValue(dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        panelHeight.flattenOffset();
        const currentHeight = (panelHeight as any)._value;
        const draggingUp = -gestureState.dy > 0;
        const velocityUp = -gestureState.vy > 0.5;
        const currentCollapsedHeight = collapsedHeightRef.current;
        
        // Logic to snap to Open or Closed
        // If dragged up significantly or fast -> Expand
        if ((draggingUp && currentHeight > currentCollapsedHeight + 50) || velocityUp) {
           Animated.spring(panelHeight, {
             toValue: EXPANDED_HEIGHT,
             useNativeDriver: false,
             bounciness: 4
           }).start(() => setIsExpanded(true));
        } else {
           // Collapse
           Animated.spring(panelHeight, {
             toValue: currentCollapsedHeight,
             useNativeDriver: false,
             bounciness: 4
           }).start(() => setIsExpanded(false));
        }
      }
    })
  ).current;

  const handleOrbSelect = (orb: any) => {
    handleSwapOrb(orb);
    // Auto collapse after selection if expanded
    if (isExpanded) {
      Animated.timing(panelHeight, {
        toValue: collapsedHeightRef.current,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false
      }).start(() => setIsExpanded(false));
    }
  };

  
  const { walletAddress } = useUser();
  const { uploadGiftOrbToCloud } = useGiftSync({
    walletAddress,
    receiveGiftOrb,
    language: settings.language,
  });


  
  // Chakra Collection Logic
  const collectionProgress = useMemo(() => {
    // Collect one orb of each level (1-7) to complete the rainbow
    const stats = new Array(7).fill(false);
    orbHistory.forEach(orb => {
       if (orb.level >= 1 && orb.level <= 7) {
         stats[orb.level - 1] = true; 
       }
    });
    return stats;
  }, [orbHistory]);
  
  const collectedCount = collectionProgress.filter(Boolean).length;

  const interactionState = useRef({ mode: 'idle', spinVelocity: 0, spinVelocityX: 0, progress: 0 });
  const progressOverlayRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const GATHER_DURATION = 7 * 60 * 1000; 
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenFadeAnim = useRef(new Animated.Value(0)).current;

  const fullscreenOrbOffsetX = useRef(new Animated.Value(0)).current;
  const fullscreenOrbOffsetY = useRef(new Animated.Value(0)).current;
  const orbShape = currentOrb.shape || 'default';

  // Toggle Diffuse
  const toggleDiffuse = () => {
     const nextMode = interactionState.current.mode === 'diffused' ? 'idle' : 'diffused';
     interactionState.current.mode = nextMode;
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Toggle Fullscreen
  const enterFullscreen = () => {
    setIsFullscreen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Hide tab bar
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    Animated.timing(fullscreenFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const exitFullscreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Show tab bar
    navigation.getParent()?.setOptions({ tabBarStyle: undefined });
    Animated.timing(fullscreenFadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsFullscreen(false);
      fullscreenOrbOffsetX.setValue(0);
      fullscreenOrbOffsetY.setValue(0);
    });
  };

  // Cleanup diffuse timeout on unmount
  useEffect(() => {
    const timeoutRef = diffuseTimeoutRef;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const diffuseTimeoutRef = useRef<any>(null);

  const triggerFullscreenDiffuse = () => {
    // Toggle between diffused and idle
    if (interactionState.current.mode === 'diffused') {
      interactionState.current.mode = 'idle';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      interactionState.current.mode = 'diffused';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const fullscreenPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        // Horizontal swipe controls Y-axis rotation (left/right)
        if (Math.abs(gestureState.dx) > 10) {
          const newVelocity = -gestureState.vx * 0.5;
          interactionState.current.spinVelocity = newVelocity;
          setSharedSpinVelocity(newVelocity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
        if (isTap) {
          // Single tap - toggle diffuse effect
          triggerFullscreenDiffuse();
        } else if (Math.abs(gestureState.vx) > 0.05) {
          // Apply fling velocity for momentum
          const newVelocity = -gestureState.vx * 0.5;
          interactionState.current.spinVelocity = newVelocity;
          setSharedSpinVelocity(newVelocity);
        }
      },
    })
  ).current;

  // Pan Responder for Gestures
  const panResponder = useRef(
    PanResponder.create({
      // Critical for responsiveness:
      onStartShouldSetPanResponder: () => true,
      // REMOVED Capture to allow buttons to work
      onMoveShouldSetPanResponder: () => true,
      
      // Ensure we don't lose the gesture easily
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      
      onPanResponderGrant: () => {
        if (!isOrbDraggingRef.current) {
          isOrbDraggingRef.current = true;
          setIsOrbDragging(true);
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const movedEnough = Math.abs(gestureState.dx) + Math.abs(gestureState.dy) > 6;
        if (movedEnough && !isOrbDraggingRef.current) {
          isOrbDraggingRef.current = true;
          setIsOrbDragging(true);
        }

        // Spin interaction - Increased sensitivity and inverted for natural control
        const newVelocity = -gestureState.vx * 0.5;
        interactionState.current.spinVelocity = newVelocity;
        setSharedSpinVelocity(newVelocity);
        
        // Swipe Detection
        const { dy, vy, dx } = gestureState;
        
        // Lower thresholds for better responsiveness
        const SWIPE_DISTANCE = 60; // Reduced for easier triggering
        const VELOCITY_THRESHOLD = 0.2; // Reduced for easier triggering
        
        const currentMode = interactionState.current.mode;
        const canSwipe = currentMode === 'gather' || currentMode === 'idle' || currentMode === 'diffused';
        
        // Debug log for swipe detection
        if (Math.abs(dy) > 30) {
          console.log("[DEBUG_SWIPE] Move detected - dy:", dy.toFixed(0), "vy:", vy.toFixed(2), "mode:", currentMode, "canSwipe:", canSwipe);
        }
        
        if (canSwipe) {
           // Check if it's primarily a vertical swipe
           const isVerticalSwipe = Math.abs(dy) > Math.abs(dx) * 1.0;
           
           if (isVerticalSwipe) {
             if (dy < -SWIPE_DISTANCE && vy < -VELOCITY_THRESHOLD) { // Swipe UP
               console.log("[DEBUG_SWIPE] SWIPE UP DETECTED! Triggering heart animation");
               triggerHeartAnimation();
             } else if (dy > SWIPE_DISTANCE && vy > VELOCITY_THRESHOLD) { // Swipe DOWN
               console.log("[DEBUG_SWIPE] SWIPE DOWN DETECTED! Triggering store animation");
               triggerStoreAnimation();
             }
           }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        if (isOrbDraggingRef.current) {
          isOrbDraggingRef.current = false;
          setIsOrbDragging(false);
        }

        // Check for Tap
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.vx) < 0.1 && Math.abs(gestureState.vy) < 0.1;
        if (isTap && !isMeditating) {
           toggleDiffuse();
        }

        // Capture final velocity for fling effect
        // Only update if there is significant velocity, otherwise keep momentum or settle
        if (Math.abs(gestureState.vx) > 0.05) {
           const newVelocity = -gestureState.vx * 0.5;
           interactionState.current.spinVelocity = newVelocity;
           setSharedSpinVelocity(newVelocity);
        }
        stopGathering();
      },
      
      onPanResponderTerminate: () => {
        if (isOrbDraggingRef.current) {
          isOrbDraggingRef.current = false;
          setIsOrbDragging(false);
        }
        stopGathering();
      },
    })
  ).current;

  // Meditation Logic
  const startMeditation = (durationMinutes: number, intention: string = "") => {
    // Reset state first to ensure clean start
    if (meditationTimerRef.current) clearInterval(meditationTimerRef.current);
    
    console.log("Starting meditation:", durationMinutes, "minutes");
    
    // Set immediate state
    setMeditationTimeLeft(durationMinutes * 60);
    setIsMeditating(true);
    interactionState.current.mode = 'meditating';
    
    const startTime = Date.now();
    const endTime = startTime + durationMinutes * 60 * 1000;
    
    // Start timer
    meditationTimerRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTime - now) / 1000));
      setMeditationTimeLeft(left);
      
      if (left <= 0) {
        finishMeditation(durationMinutes);
      }
    }, 1000);
  };
  
  const stopMeditation = () => {
    console.log("Stopping meditation...");
    if (meditationTimerRef.current) {
      clearInterval(meditationTimerRef.current);
      meditationTimerRef.current = null;
    }
    setIsMeditating(false);
    interactionState.current.mode = 'idle';
  };
  
  const finishMeditation = async (durationMinutes: number) => {
     stopMeditation();
     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
     const recordDuration = Math.max(1, durationMinutes || awakenedDuration || 1);
     
     // FOR TESTING: Removed !hasGrownOrbToday check
     if (!currentOrb.isAwakened) {
       await cultivateDailyOrb();
       await completeMeditation(
         "garden-daily",
         Math.max(1, durationMinutes),
         false,
         "Garden Meditation"
       );
       Alert.alert(
          settings.language === 'zh' ? "冥想完成" : "Meditation Complete", 
          settings.language === 'zh' ? "你的光球吸收了能量。" : "Your orb has absorbed energy."
       );
     } else {
       await completeMeditation(
         "awakened-session",
         recordDuration,
         false,
         "Garden: Awakened Meditation"
       );
       Alert.alert(
          settings.language === 'zh' ? "冥想完成" : "Meditation Complete", 
          settings.language === 'zh' ? "願你內心平靜。" : "May you be at peace."
       );
     }
  };

  const stopGathering = () => {
    // If in special animation, don't stop
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'store' || interactionState.current.mode === 'explode' || interactionState.current.mode === 'appear' || interactionState.current.mode === 'meditating') return;
    
    // Only reset if we were gathering (which we don't do anymore via hold)
    // But if we are diffused, keep it diffused until tap toggles it off
    if (interactionState.current.mode === 'diffused') return;

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    // Reset if not complete
    if (interactionState.current.progress < 1.0) {
      interactionState.current.mode = 'idle';
      interactionState.current.progress = 0;
      if (progressOverlayRef.current) {
        progressOverlayRef.current.reset();
      }
    }
  };

  const triggerHeartAnimation = () => {
    console.log("[DEBUG_SWIPE] triggerHeartAnimation called, current mode:", interactionState.current.mode);
    
    // Prevent duplicate triggers
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'explode') {
      console.log("[DEBUG_SWIPE] Already in heart/explode mode, ignoring");
      return;
    }
    
    // Check if orb is giftable (not empty white ball)
    const isEmptyWhiteBall = currentOrb.level === 0 && currentOrb.layers.length === 0 && (!currentOrb.shape || currentOrb.shape === 'default');
    
    if (isEmptyWhiteBall) {
      Alert.alert(
        settings.language === 'zh' ? "無法贈送" : "Cannot Gift",
        settings.language === 'zh' ? "請先培育或改變光球形態" : "Grow or transform your orb first"
      );
      return;
    }
    
    // Clear any previous mode reset timeout
    if (modeResetTimeoutRef.current) {
      clearTimeout(modeResetTimeoutRef.current);
    }
    
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (progressOverlayRef.current) progressOverlayRef.current.reset();
    
    // Start heart transformation
    interactionState.current.mode = 'heart';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log("[DEBUG_SWIPE] Heart mode started, waiting for transformation...");
    
    // Haptic feedback when heart shape is forming
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1000);
    
    // Open gift modal AFTER heart transformation completes (2.5 seconds)
    setTimeout(() => {
       if (interactionState.current.mode !== 'heart') {
         console.log("[DEBUG_SWIPE] Mode changed during heart animation, aborting modal open");
         return;
       }
       isGifting.current = false; // Reset lock before modal opens
       hasAttemptedGift.current = false;
       setGiftingError(null);
       setShowGiftModal(true);
       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       console.log("[DEBUG_SWIPE] Heart transformation complete, gift modal opened");
    }, 2500);
    
    // Safety timeout: if modal doesn't open or something goes wrong, reset mode
    modeResetTimeoutRef.current = setTimeout(() => {
      if (interactionState.current.mode === 'heart' && !showGiftModal) {
        console.log("[DEBUG_SWIPE] Safety reset: heart mode stuck, resetting to idle");
        interactionState.current.mode = 'idle';
        isGifting.current = false;
      }
    }, 5000);
  };

  const animateStore = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (progressOverlayRef.current) progressOverlayRef.current.reset();
    interactionState.current.mode = 'store';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerStoreAnimation = () => {
    animateStore();
    
    setTimeout(async () => {
       await storeOrbRef.current();
       interactionState.current.mode = 'idle'; 
    }, 2000);
  };

  const attemptGiftUpload = async (
    params: {
      fromWalletAddress: string;
      toWalletAddress: string;
      source: "event" | "shareContacts";
    },
    options?: { silent?: boolean }
  ) => {
    if (giftUploadAttemptRef.current) {
      console.log("[DEBUG_GIFT_CLOUD] Upload already attempted, skipping duplicate.", params);
      return false;
    }
    giftUploadAttemptRef.current = true;

    console.log("[Garden] Gift send payload:", {
      fromWalletAddress: params.fromWalletAddress,
      toWalletAddress: params.toWalletAddress,
      source: params.source,
    });

    try {
      const uploaded = await uploadGiftOrbToCloud({
        toWalletAddress: params.toWalletAddress,
        fromWalletAddress: params.fromWalletAddress,
        fromDisplayName: walletAddress ? `0x${walletAddress.slice(2, 6)}…` : undefined,
        blessing: giftMessage || (settings.language === "zh" ? "願愛與能量永流" : "May love and energy flow forever."),
        orb: {
          id: currentOrbRef.current.id || `orb-${Date.now()}`,
          level: currentOrbRef.current.level,
          layers: [...(currentOrbRef.current.layers ?? [])],
          isAwakened: Boolean(currentOrbRef.current.isAwakened),
          createdAt: currentOrbRef.current.createdAt || new Date().toISOString(),
          completedAt: currentOrbRef.current.completedAt,
          shape: currentOrbRef.current.shape,
          rotationSpeed: interactionState.current.spinVelocity,
        },
      });
      console.log("[DEBUG_GIFT_CLOUD] Gift uploaded:", uploaded.giftId);
      return true;
    } catch (e: any) {
      console.error("[DEBUG_GIFT_CLOUD] shareContacts/upload failed:", e);
      giftUploadAttemptRef.current = false;
      if (options?.silent) {
        return false;
      }
      const diagnostics = getFirebaseDiagnosticsFn();
      const lastAuthCode = diagnostics.lastAuthError?.code;
      const lastWriteCode = diagnostics.lastWriteError?.code;
      const lastWriteMessage = diagnostics.lastWriteError?.message;
      const isAuthDisabled =
        lastAuthCode === "auth/operation-not-allowed" ||
        lastAuthCode === "admin-restricted-operation";
      const fallbackMessage = e?.message || "unknown";
      const authDisabledMessage =
        settings.language === "zh"
          ? "Firebase 匿名登入未啟用。請在 Firebase Authentication 啟用匿名登入後再試。"
          : "Firebase anonymous sign-in is not enabled. Please enable Anonymous sign-in in Firebase Authentication and try again.";
      const authHint =
        settings.language === "zh"
          ? "提示：請確認 Firebase Authentication 已啟用 Anonymous Auth。"
          : "Tip: ensure Firebase Authentication has Anonymous Auth enabled.";
      const permissionHint =
        settings.language === "zh"
          ? "提示：請檢查 Realtime Database Rules 是否允許寫入 /gifts/{walletId}。"
          : "Tip: verify your Realtime Database Rules allow writes to /gifts/{walletId}.";
      const hasPermissionDenied =
        lastWriteCode === "permission_denied" ||
        lastWriteCode === "PERMISSION_DENIED" ||
        /permission/i.test(lastWriteMessage || "");
      const hasAuthError =
        Boolean(lastAuthCode && lastAuthCode.startsWith("auth/")) ||
        (lastWriteCode && lastWriteCode.startsWith("auth/")) ||
        /auth/i.test(lastWriteMessage || "");
      const diagnosticsLine =
        settings.language === "zh"
          ? `診斷碼：${lastWriteCode ?? "unknown"}\n診斷訊息：${lastWriteMessage ?? "unknown"}`
          : `Diagnostics code: ${lastWriteCode ?? "unknown"}\nDiagnostics message: ${lastWriteMessage ?? "unknown"}`;
      const message = [
        isAuthDisabled ? authDisabledMessage : fallbackMessage,
        diagnosticsLine,
        hasPermissionDenied ? permissionHint : null,
        hasAuthError && !isAuthDisabled ? authHint : null,
      ]
        .filter(Boolean)
        .join("\n\n");
      Alert.alert(
        settings.language === "zh" ? "傳送失敗" : "Send failed",
        message
      );
    }
  };

  const handleGiftSuccess = async (contact: any) => {
    console.log("[DEBUG_GIFT] handleGiftSuccess called with:", toSafeJson(contact));

    const toWalletAddress = extractContactWalletAddress(contact);
    const friendName = formatContactName(contact, toWalletAddress, settings.language);
    console.log("[DEBUG_GIFT] Selected contact walletAddress:", toWalletAddress);
    console.log(`[DEBUG_GIFT] ShareContacts success: wallet = ${toWalletAddress || ""}`);
    console.log("[DEBUG_GIFT] Processing Gift Success for:", friendName);

    if (!toWalletAddress) {
      console.log("[DEBUG_GIFT] No walletAddress");
      isGifting.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
        settings.language === "zh" ? "選擇朋友失敗，請重試" : "Friend selection failed. Please retry."
      );
      return;
    }

    // UI success flow immediately, upload happens in background
    finishGifting(friendName);
    void attemptGiftUpload({
      fromWalletAddress: walletAddress || "missing",
      toWalletAddress,
      source: "event",
    });
    console.log("[DEBUG_GIFT] Gift simulated successfully (Local Mode)");
  };

  useEffect(() => {
    handleGiftSuccessRef.current = handleGiftSuccess;
  });

  const playHolyGiftSound = async () => {
    try {
      await playGiftSendSound();
    } catch (e) {
      console.warn("[DEBUG_GIFT] playHolyGiftSound failed:", e);
    }
  };


  const finishGifting = (friendName: string) => {
      console.log("[DEBUG_GIFT] finishGifting called for:", friendName);
      console.log("[DEBUG_GIFT] Current Orb state before gifting:", JSON.stringify(currentOrbRef.current));
      
      // Clear any mode reset timeout
      if (modeResetTimeoutRef.current) {
        clearTimeout(modeResetTimeoutRef.current);
      }
      
      // Reset attempt flag
      hasAttemptedGift.current = false;

      // 1. Close modal immediately
      console.log("[DEBUG_GIFT] Closing Gift Modal");
      setShowGiftModal(false);
      
      // 2. Start Animation (Explode/Fly away)
      interactionState.current.mode = 'explode';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void playHolyGiftSound();
      console.log("[DEBUG_GIFT] Animation mode set to 'explode'");
      
      // Save the gift message before clearing
      const savedGiftMessage = giftMessage || (settings.language === 'zh' ? "願愛與能量永流" : "May love and energy flow forever.");
      
      // 3. Wait for fly-away animation then complete the process
      setTimeout(async () => {
           console.log("[DEBUG_GIFT] Fly-away animation phase 1 (2000ms)");
           try {
             await sendOrbRef.current(friendName, savedGiftMessage);
             console.log("[DEBUG_GIFT] sendOrbRef.current completed - orb should be reset now");
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           } catch (sendError) {
              console.error("[DEBUG_GIFT] sendOrb error:", sendError);
           }
      }, 2000);
      
      // 4. Reset all states after animation completes
      setTimeout(() => {
           console.log("[DEBUG_GIFT] Animation complete (3000ms), resetting all states");
           setGiftMessage("");
           isGifting.current = false;
           hasAttemptedGift.current = false;
           interactionState.current.mode = 'idle';
           console.log("[DEBUG_GIFT] Gifting sequence COMPLETE. All states reset.");
           
           Alert.alert(
               settings.language === 'zh' ? "✨ 贈送成功" : "✨ Gift Sent",
               settings.language === 'zh' 
                ? `已贈送給 ${friendName}，願愛與能量永流` 
                : `Gifted to ${friendName}, may love and energy flow forever.`
           );
      }, 3000);
      
      // Safety timeout: ensure mode resets even if something goes wrong
      modeResetTimeoutRef.current = setTimeout(() => {
        if (interactionState.current.mode === 'explode') {
          console.log("[DEBUG_GIFT] Safety reset: explode mode stuck, resetting to idle");
          interactionState.current.mode = 'idle';
          isGifting.current = false;
          setIsGiftingUI(false);
        }
      }, 6000);
  };

  const handleStartGiftingOptimistic = () => {
    console.log("[gift] start gifting");
    if (isGifting.current) {
      console.log("[DEBUG_GIFT] stale isGifting lock detected, clearing lock before shareContacts");
      isGifting.current = false;
    }

    isGifting.current = true;
    giftUploadAttemptRef.current = false;
    hasAttemptedGift.current = true;
    setGiftingError(null);
    setIsGiftingUI(true);
    pendingShareContactsRef.current = true;
    pauseMiniKitAutoSubscribeRef.current = true;

    const run = async () => {
      try {
        const mk = (await ensureMiniKitLoaded()) ?? getMiniKit() ?? MiniKit;
        const getPermissionsFn = mk?.commandsAsync?.getPermissions;
        const requestPermissionFn = mk?.commandsAsync?.requestPermission;
        const shareContactsAsyncFn = mk?.commandsAsync?.shareContacts;
        const shareContactsCommandFn = mk?.commands?.shareContacts;
        const installed = await isMiniKitInstalled(mk);

        if (!mk || !installed) {
          console.log("[DEBUG_GIFT_CLOUD] MiniKit not installed - skipping shareContacts + upload");
          if (Platform.OS === "web") {
            const miniAppUrl =
              (mk?.getMiniAppUrl || MiniKit?.getMiniAppUrl)?.(APP_ID, "/") ||
              `https://worldcoin.org/mini-app/${encodeURIComponent(APP_ID)}`;
            try {
              window.location.assign(miniAppUrl);
            } catch (e) {
              console.log("[DEBUG_GIFT_CLOUD] Failed to open MiniApp URL:", e);
            }
          }
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : "Cannot send",
            settings.language === "zh" ? "目前裝置未安裝 World App / MiniKit，無法選擇聯絡人錢包" : "World App / MiniKit not installed, cannot pick a contact wallet"
          );
          isGifting.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (useShareContactsAsyncOnly && !shareContactsAsyncFn) {
          console.log("[DEBUG_GIFT_CLOUD] MiniKit async shareContacts missing while async-only enabled");
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : "Cannot send",
            settings.language === "zh"
              ? "無法使用非同步聯絡人分享，請更新 World App"
              : "Async contact sharing is unavailable. Please update World App."
          );
          isGifting.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (!shareContactsAsyncFn && !shareContactsCommandFn) {
          console.log("[DEBUG_GIFT_CLOUD] MiniKit shareContacts missing - skipping upload");
          Alert.alert(settings.language === "zh" ? "無法傳送" : "Cannot send");
          isGifting.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (!useShareContactsAsyncOnly) {
          const subscribed = subscribeMiniKit(mk, handleMiniKitShareContactsEvent);
          if (!subscribed) {
            pendingShareContactsRef.current = false;
            isGifting.current = false;
            setIsGiftingUI(false);
            Alert.alert(
              settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
              settings.language === "zh" ? "選擇朋友失敗，請重試" : "Friend selection failed. Please retry."
            );
            return;
          }
        }

        if (getPermissionsFn) {
          try {
            const permissionsResult: any = await getPermissionsFn();
            const permissionsPayload =
              permissionsResult?.finalPayload ||
              permissionsResult?.response ||
              permissionsResult?.result ||
              permissionsResult;
            const permissions = permissionsPayload?.permissions || {};
            if (permissionsPayload?.status === "error") {
              console.log("[DEBUG_GIFT_CLOUD] getPermissions error:", permissionsPayload);
            }
            if (!permissions?.contacts && requestPermissionFn) {
              console.log("[DEBUG_GIFT_CLOUD] Requesting contacts permission...");
              const permissionResult: any = await requestPermissionFn({ permission: "contacts" });
              const permissionPayload =
                permissionResult?.finalPayload ||
                permissionResult?.response ||
                permissionResult?.result ||
                permissionResult;
              if (permissionPayload?.status === "error") {
                Alert.alert(
                  settings.language === "zh" ? "授權失敗" : "Permission denied",
                  settings.language === "zh"
                    ? "未取得聯絡人授權，無法傳送光球"
                    : "Contacts permission denied, cannot send."
                );
                isGifting.current = false;
                setIsGiftingUI(false);
                return;
              }
            }
          } catch (permissionError) {
            console.warn("[DEBUG_GIFT_CLOUD] Permission check failed:", permissionError);
          }
        }

        if (!walletAddress) {
          const err = new Error("wallet_missing");
          (err as any).code = "wallet_missing";
          throw err;
        }

        setIsGiftingUI(true);
        pendingShareContactsRef.current = true;
        clearShareContactsTimeout();

        let result: any;
        const shareContactsPayload = {
          isMultiSelectEnabled: false,
          inviteMessage:
            settings.language === "zh"
              ? "分享你的錢包聯絡人以贈送光球"
              : "Share a contact wallet to receive a gift orb",
        };

        mk?.install?.(APP_ID);
        const confirmedInstalled = await waitForMiniKitInstalled(mk, 1200, 100);
        if (!confirmedInstalled) {
          console.log("[DEBUG_GIFT_CLOUD] MiniKit not installed after install attempt - skipping shareContacts + upload");
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : "Cannot send",
            settings.language === "zh" ? "目前裝置未安裝 World App / MiniKit，無法選擇聯絡人錢包" : "World App / MiniKit not installed, cannot pick a contact wallet"
          );
          isGifting.current = false;
          setIsGiftingUI(false);
          return;
        }

        console.log("[DEBUG_GIFT_CLOUD] Calling shareContacts...");
        try {
          if (shareContactsAsyncFn) {
            result = await shareContactsAsyncFn(shareContactsPayload);
            console.log("[DEBUG_GIFT] Async shareContacts result:", JSON.stringify(result, null, 2));
          } else if (shareContactsCommandFn) {
            shareContactsCommandFn(shareContactsPayload);
            return;
          }
        } catch (shareError) {
          console.warn("[DEBUG_GIFT_CLOUD] shareContacts failed to open/resolve:", shareError);
          const errorMessage = parseGiftErrorMessage(shareError);
          if (errorMessage) {
            pendingShareContactsRef.current = false;
            clearShareContactsTimeout();
            isGifting.current = false;
            setGiftingError(errorMessage);
            setIsGiftingUI(false);
            return;
          }
          pendingShareContactsRef.current = false;
          isGifting.current = false;
          setIsGiftingUI(false);
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
            settings.language === "zh"
              ? "選擇朋友失敗，請重試"
              : "Friend selection failed. Please retry."
          );
          return;
        }

        console.log("[DEBUG_GIFT] shareContacts full result:", JSON.stringify(result, null, 2));

        const responsePayload = result?.finalPayload || result;
        const contacts = extractContactsFromPayload(result);
        const contact = contacts[0];
        const toWalletAddress = extractContactWalletAddress(contact);

        console.log("[DEBUG_GIFT] responsePayload:", JSON.stringify(responsePayload, null, 2));
        console.log("[DEBUG_GIFT] contacts array:", JSON.stringify(contacts, null, 2));

        if (responsePayload?.status === 'error') {
          console.log("[DEBUG_GIFT] shareContacts error:", responsePayload?.error_code);
          isGifting.current = false;
          setIsGiftingUI(false);
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
            responsePayload?.error_code || "Unknown error"
          );
          return;
        }

        console.log("[DEBUG_GIFT] Selected contact:", JSON.stringify(contact, null, 2));
        console.log("[DEBUG_GIFT] toWalletAddress:", toWalletAddress);

        if (!toWalletAddress) {
          console.log("[DEBUG_GIFT] No walletAddress found in response");
          isGifting.current = false;
          setIsGiftingUI(false);
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
            settings.language === "zh" ? "無法取得朋友的錢包地址" : "Could not get friend's wallet address"
          );
          return;
        }

        pendingShareContactsRef.current = false;
        clearShareContactsTimeout();
        const fromWalletAddress = walletAddress;
        const friendName = formatContactName(contact, toWalletAddress, settings.language);
        console.log("Attempting gift upload", toWalletAddress, fromWalletAddress);

        console.log("[DEBUG_GIFT_CLOUD] Uploading gift orb to Firebase...", {
          hasMiniKit: Boolean(mk),
          hasShareContacts: Boolean(shareContactsAsyncFn || shareContactsCommandFn),
          toWalletPrefix: `${String(toWalletAddress).slice(0, 6)}...`,
          fromWalletPrefix: `${String(fromWalletAddress).slice(0, 6)}...`,
        });
        console.log("[DEBUG_GIFT_CLOUD] Calling attemptGiftUpload...", {
          toWalletPrefix: `${String(toWalletAddress).slice(0, 6)}...`,
          fromWalletPrefix: `${String(fromWalletAddress).slice(0, 6)}...`,
          orbSnapshotId: currentOrbRef.current?.id || "unknown",
        });

        void attemptGiftUpload({
          fromWalletAddress: walletAddress || "missing",
          toWalletAddress: toWalletAddress,
          source: "shareContacts",
        }).catch((uploadErr) => {
          console.error("[gift] upload failed after ui success", uploadErr);
        });

        console.log("[DEBUG_GIFT_CLOUD] Gift upload queued via attemptGiftUpload");
        finishGifting(friendName);
      } catch (e) {
        console.error("[DEBUG_GIFT_CLOUD] shareContacts/upload failed:", e);
        const errorMessage = parseGiftErrorMessage(e);
        if (errorMessage) {
          pendingShareContactsRef.current = false;
          clearShareContactsTimeout();
          isGifting.current = false;
          setGiftingError(errorMessage);
          return;
        }
        Alert.alert(
          settings.language === "zh" ? "選擇朋友失敗" : "Friend selection failed",
          settings.language === "zh"
            ? "選擇朋友失敗，請重試"
            : "Friend selection failed. Please retry."
        );
        isGifting.current = false;
      } finally {
        pauseMiniKitAutoSubscribeRef.current = false;
        setIsGiftingUI(false);
      }
    };

    void run();
  };

  const handleCancelGift = () => {
    console.log("[DEBUG_GIFT] handleCancelGift called. hasAttemptedGift:", hasAttemptedGift.current);
    console.log("[DEBUG_GIFT] Current mode:", interactionState.current.mode, "isGifting:", isGifting.current);

    setShowGiftModal(false);
    setGiftMessage("");
    setGiftingError(null);
    setIsGiftingUI(false);
    
    // CRITICAL: Always reset isGifting when modal closes
    isGifting.current = false;
    hasAttemptedGift.current = false;
    
    // Reset animation mode immediately and after delay for safety
    console.log("[DEBUG_GIFT] Resetting mode to idle from cancel");
    interactionState.current.mode = 'idle';
    
    setTimeout(() => {
      if (interactionState.current.mode !== 'meditating') {
        interactionState.current.mode = 'idle';
        console.log("[DEBUG_GIFT] Safety reset mode to idle (500ms)");
      }
    }, 500);
  };

  const handleSwapOrb = async (orb: any) => {
     // Direct swap without alert for smoother experience
     animateStore(); // Animate current one away
     
     setTimeout(async () => {
       // While swapping, keep mode as store (or 'appear' logic in component will handle init)
       await swapOrb(orb.id);
       
       // Trigger appear
       interactionState.current.mode = 'appear';
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       
       setTimeout(() => {
         interactionState.current.mode = 'idle';
       }, 1500);
     }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>
                {settings.language === 'zh' ? "光球花園" : "Light Orb Garden"}
              </Text>
              {isDev && (
                <TouchableOpacity 
                  style={styles.devButton} 
                  onPress={() => setShowDevMenu(true)}
                >
                  <Text style={styles.devButtonText}>DEV</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.subtitle}>
               {currentOrb.layers.length}/7 Layers • {currentOrb.isAwakened ? "Awakened" : "Growing"}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Dev Menu */}
      {showDevMenu && (
        <View style={styles.devMenuOverlay}>
          <View style={[styles.devMenu, { backgroundColor: currentTheme.surface }]}>
            <ScrollView>
              <Text style={[styles.devMenuTitle, { color: currentTheme.text }]}>Dev Tools</Text>
              <TouchableOpacity style={styles.devMenuItem} onPress={() => { devAddLayer(); setShowDevMenu(false); }}><Text style={{ color: currentTheme.text }}>Dev: +1 layer</Text></TouchableOpacity>
              <TouchableOpacity style={styles.devMenuItem} onPress={() => { devInstantOrb(21); setShowDevMenu(false); }}><Text style={{ color: currentTheme.text }}>Dev: Instant Awakened</Text></TouchableOpacity>
              <TouchableOpacity style={styles.devMenuItem} onPress={() => { devSendOrbToSelf(); setShowDevMenu(false); }}><Text style={{ color: currentTheme.text }}>Dev: Send to Self</Text></TouchableOpacity>
              <TouchableOpacity style={styles.devMenuItem} onPress={() => { devResetOrb(); setShowDevMenu(false); }}><Text style={{ color: currentTheme.text }}>Dev: Reset</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.devMenuItem, { borderBottomWidth: 0 }]} onPress={() => setShowDevMenu(false)}><Text style={{ color: 'red' }}>Close</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Shape Selector Modal */}
      <Modal
        visible={showShapeSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShapeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapeModal, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.shapeModalHeader}>
              <Sparkles size={20} color={currentTheme.primary} />
              <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                {settings.language === 'zh' ? '選擇光球形態' : 'Choose Orb Shape'}
              </Text>
            </View>
            <ScrollView style={styles.shapeList}>
              {shapes.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.shapeItem,
                    orbShape === s.id && { backgroundColor: `${currentTheme.primary}20`, borderColor: currentTheme.primary }
                  ]}
                  onPress={() => {
                    setOrbShape(s.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeout(() => setShowShapeSelector(false), 300);
                  }}
                >
                  {!!s.icon && <Text style={styles.shapeIcon}>{s.icon}</Text>}
                  <Text style={[styles.shapeName, { color: currentTheme.text }]}>
                    {settings.language === 'zh' ? s.nameZh : s.name}
                  </Text>
                  {orbShape === s.id && <Text style={{ color: currentTheme.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.shapeModalClose, { backgroundColor: currentTheme.primary }]}
              onPress={() => setShowShapeSelector(false)}
            >
              <Text style={styles.shapeModalCloseText}>
                {settings.language === 'zh' ? '關閉' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Growth Meditation Modal */}
      <Modal
        visible={showGrowthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGrowthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapeModal, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.shapeModalHeader}>
               <Sparkles size={24} color={currentTheme.primary} />
               <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                 {settings.language === 'zh' ? '培育光球' : 'Grow Orb'}
               </Text>
            </View>

            <Text style={[styles.inputLabel, { color: currentTheme.text, fontSize: 16, marginBottom: 20, textAlign: 'center' }]}>
               {settings.language === 'zh' 
                 ? '準備好進行 7 分鐘的培育冥想了嗎？' 
                 : 'Ready for a 7-minute growth meditation?'}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#333' }]}
                onPress={() => setShowGrowthModal(false)}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? '取消' : 'Cancel'}
                 </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                   setShowGrowthModal(false);
                   // Small delay to allow modal to close smoothly before starting animation/timer
                   setTimeout(() => {
                     startMeditation(7, "Growth");
                   }, 300);
                }}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? '開始 (7分鐘)' : 'Start (7 min)'}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gift Modal */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelGift}
        onDismiss={handleCancelGift}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapeModal, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.shapeModalHeader}>
               <Text style={styles.giftHeart}>💝</Text>
               <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                 {settings.language === 'zh' ? '贈送光球' : 'Gift Orb'}
               </Text>
            </View>

            {/* Heart Orb Preview */}
            <View style={styles.giftOrbPreview}>
              {currentOrb.layers.map((color, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.giftOrbLayer, 
                    { 
                      backgroundColor: color, 
                      width: 20 + (i * 8), 
                      height: 20 + (i * 8),
                      opacity: 0.9
                    } 
                  ]} 
                />
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>
               {settings.language === 'zh' ? '祝福訊息' : 'Blessing Message'}
            </Text>
            <TextInput
               style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border || '#333' }]}
               placeholder={settings.language === 'zh' ? '願這顆光球帶來...' : 'May this orb bring...'}
               placeholderTextColor={currentTheme.textSecondary}
               value={giftMessage}
               onChangeText={setGiftMessage}
               multiline
               numberOfLines={3}
            />
            {!firebaseEnabled && (
              <View style={styles.firebaseWarning}>
                <Text style={styles.firebaseWarningText}>
                  {settings.language === "zh"
                    ? `Firebase 未啟用，可能缺少或配置錯誤的環境變數：${firebaseMissingEnv.join(", ")}`
                    : `Firebase is disabled, likely due to missing or misconfigured environment variables: ${firebaseMissingEnv.join(", ")}`}
                </Text>
              </View>
            )}

            {giftingError && (
              <View style={{ marginTop: 10, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(239, 68, 68, 0.18)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.5)" }}>
                <Text style={{ color: "#fecaca", fontSize: 13, fontWeight: "600" }}>{giftingError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.selectFriendButton, { borderColor: currentTheme.primary, backgroundColor: isGiftingUI ? 'rgba(139, 92, 246, 0.2)' : 'transparent' }]}
              onPress={handleStartGiftingOptimistic}
              disabled={isGiftingUI}
            >
              <Text style={[styles.selectFriendText, { color: currentTheme.primary }]}>
                {isGiftingUI 
                  ? (settings.language === 'zh' ? '贈送中...' : 'Gifting...')
                  : (settings.language === 'zh' ? '選擇朋友並贈送' : 'Select Friend & Gift')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#333' }]}
                onPress={handleCancelGift}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? '取消' : 'Cancel'}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sound Picker Modal */}
      <Modal
        visible={showSoundPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSoundPicker(false)}
      >
        <View style={styles.soundPickerOverlay}>
          <View style={[styles.soundPickerModal, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.soundPickerHeader}>
              <Text style={[styles.soundPickerTitle, { color: currentTheme.text }]}>
                {settings.language === 'zh' ? '環境音' : 'Ambient Sound'}
              </Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
              <TouchableOpacity
                style={[
                  styles.soundOption,
                  selectedAmbientSound === null && styles.soundOptionSelected
                ]}
                onPress={() => {
                  setSelectedAmbientSound(null);
                  setShowSoundPicker(false);
                }}
              >
                <Text style={[
                  styles.soundOptionText,
                  { color: currentTheme.text },
                  selectedAmbientSound === null && styles.soundOptionTextSelected
                ]}>
                  {settings.language === 'zh' ? '無' : 'None'}
                </Text>
                {selectedAmbientSound === null && (
                  <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.primary }]} />
                )}
              </TouchableOpacity>

              {AMBIENT_SOUND_CATEGORIES.map((category) => (
                <View key={category.id}>
                  <Text style={[styles.soundCategoryTitle, { color: currentTheme.primary }]}>
                    {category.name[settings.language as 'zh' | 'en']}
                  </Text>
                  {category.sounds.map((sound) => (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.soundOption,
                        selectedAmbientSound === sound.id && styles.soundOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedAmbientSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.soundOptionText,
                        { color: currentTheme.text },
                        selectedAmbientSound === sound.id && styles.soundOptionTextSelected
                      ]}>
                        {sound.name[settings.language as 'zh' | 'en']}
                      </Text>
                      {selectedAmbientSound === sound.id && (
                        <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.primary }]} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.volumeControl}>
              <VolumeX size={20} color={currentTheme.textSecondary} />
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={ambientVolume}
                onValueChange={setAmbientVolume}
                minimumTrackTintColor={currentTheme.primary}
                maximumTrackTintColor={currentTheme.border || '#444'}
              />
              <Volume2 size={20} color={currentTheme.textSecondary} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Awakened Meditation Modal */}
      <Modal
        visible={showAwakenedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAwakenedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapeModal, { backgroundColor: currentTheme.surface }]}>
            <View style={styles.shapeModalHeader}>
               <Sparkles size={24} color={currentTheme.primary} />
               <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                 {settings.language === 'zh' ? '冥想設定' : 'Meditation Setup'}
               </Text>
            </View>

            <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>
               {settings.language === 'zh' ? '意圖 (可選)' : 'Intention (Optional)'}
            </Text>
            <TextInput
               style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border || '#333' }]}
               placeholder={settings.language === 'zh' ? '例如：平靜、療癒...' : 'e.g., Peace, Healing...'}
               placeholderTextColor={currentTheme.textSecondary}
               value={awakenedIntention}
               onChangeText={setAwakenedIntention}
            />

            <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, marginTop: 16 }]}>
               {settings.language === 'zh' ? '時間 (分鐘)' : 'Duration (Minutes)'}
            </Text>
            <View style={styles.durationSelector}>
               {[5, 10, 15, 20, 30, 60].map(m => (
                 <TouchableOpacity
                   key={m}
                   style={[
                     styles.durationButton, 
                     awakenedDuration === m && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
                   ]}
                   onPress={() => setAwakenedDuration(m)}
                 >
                    <Text style={[
                      styles.durationText, 
                      awakenedDuration === m ? { color: 'white' } : { color: currentTheme.text }
                    ]}>{m}</Text>
                 </TouchableOpacity>
               ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#333' }]}
                onPress={() => setShowAwakenedModal(false)}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? '取消' : 'Cancel'}
                 </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                   setShowAwakenedModal(false);
                   startMeditation(awakenedDuration, awakenedIntention);
                }}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? '開始' : 'Start'}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Interaction Area */}
      <View style={styles.sceneContainer} {...panResponder.panHandlers}>

        <View
          pointerEvents={isOrbDragging ? "none" : "box-none"}
          style={[
            styles.topLeftActionGroup,
            {
              top: Math.max(insets.top, 12) + 12,
            },
          ]}
          testID="garden-top-left-actions"
        >
          <View style={styles.topLeftMorphRow}>
            <TouchableOpacity
              style={[
                styles.topLeftMorphFab,
                !currentOrb.isAwakened && styles.topLeftMorphFabDisabled
              ]}
              onPress={() => {
                if (!currentOrb.isAwakened) {
                  Alert.alert(
                    settings.language === 'zh' ? '尚未覺醒' : 'Not Awakened',
                    settings.language === 'zh' 
                      ? '光球需要覺醒後才能選擇形態' 
                      : 'Orb must be awakened to change shape'
                  );
                  return;
                }
                setShowShapeSelector(true);
              }}
              activeOpacity={0.7}
              disabled={isOrbDragging}
              testID="garden-shape-button"
            >
              <Sparkles size={18} color={currentOrb.isAwakened ? "white" : "rgba(255,255,255,0.4)"} />
            </TouchableOpacity>

            {orbShape !== "default" && (
              <TouchableOpacity
                style={styles.topLeftMorphResetFab}
                onPress={() => {
                  setOrbShape("default");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
                disabled={isOrbDragging}
                testID="garden-shape-reset-button"
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {!isMeditating && interactionState.current.mode !== "meditating" && (
            <View style={styles.topLeftGrowStack} testID="garden-action-group">
              {!currentOrb.isAwakened ? (
                <TouchableOpacity
                  testID="garden-grow-button"
                  activeOpacity={0.85}
                  style={styles.gardenActionTouchable}
                  onPress={() => {
                    console.log("[GARDEN] Grow button pressed");
                    setShowGrowthModal(true);
                  }}
                >
                  <LinearGradient
                    colors={["rgba(139,92,246,0.95)", "rgba(236,72,153,0.85)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gardenActionFab}
                  >
                    <Sprout size={22} color="#fff" />
                    <Text style={styles.gardenActionLabel}>GROW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="garden-meditate-button"
                  activeOpacity={0.85}
                  style={styles.gardenActionTouchable}
                  onPress={() => {
                    console.log("[GARDEN] Meditate button pressed");
                    setShowAwakenedModal(true);
                  }}
                >
                  <LinearGradient
                    colors={["rgba(34,211,238,0.9)", "rgba(139,92,246,0.92)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gardenActionFab}
                  >
                    <Sparkles size={22} color="#fff" />
                    <Text style={styles.gardenActionLabel}>MEDITATE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbParticles 
            layers={currentOrb.layers} 
            interactionState={interactionState}
            shape={orbShape}
          />
        </Canvas>
        
        {/* Minimal Progress UI */}
        <MinimalProgress 
          ref={progressOverlayRef} 
          theme={currentTheme} 
          duration={GATHER_DURATION} 
        />

        
        {/* Sound Button */}
        {!isMeditating && !isFullscreen && (
          <TouchableOpacity
            style={styles.soundButton}
            onPress={() => setShowSoundPicker(true)}
            activeOpacity={0.7}
            testID="garden-sound-button"
          >
            <Music size={20} color={selectedAmbientSound ? currentTheme.primary : "white"} />
          </TouchableOpacity>
        )}

        {/* Fullscreen Button */}
        {!isMeditating && !isFullscreen && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={enterFullscreen}
            activeOpacity={0.7}
            testID="garden-fullscreen-button"
          >
            <Maximize2 size={22} color="white" />
          </TouchableOpacity>
        )}

        {!isMeditating && (
          <View style={styles.instructions}>
             <View style={styles.instructionRow}>
                <ArrowUp size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.instructionText}>
                  {settings.language === 'zh' ? "上滑贈送" : "Swipe Up to Gift"}
                </Text>
             </View>
             
             <View style={styles.instructionRow}>
                <View style={styles.holdDot} />
                <Text style={styles.instructionText}>
                  {settings.language === 'zh' ? "點擊擴散" : "Tap to Diffuse"}
                </Text>
             </View>
             
             <View style={styles.instructionRow}>
                <ArrowDown size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.instructionText}>
                  {settings.language === 'zh' ? "下滑收藏" : "Swipe Down to Store"}
                </Text>
             </View>
          </View>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.infoContainer}>
          <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
             <Clock size={16} color={currentTheme.textSecondary} />
             <Text style={[styles.infoText, { color: currentTheme.text }]}>
               {currentOrb.isAwakened 
                 ? (settings.language === 'zh' ? "已覺醒" : "Awakened")
                 : (settings.language === 'zh' 
                     ? `${7 - currentOrb.layers.length} 天後覺醒`
                     : `${7 - currentOrb.layers.length} days left`)
               }
             </Text>
          </View>
          
          <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
             <Zap size={16} color={hasGrownOrbToday ? currentTheme.primary : currentTheme.textSecondary} />
             <Text style={[styles.infoText, { color: currentTheme.text }]}>
               {hasGrownOrbToday
                 ? (settings.language === 'zh' ? "今日已完成" : "Done Today")
                 : (settings.language === 'zh' ? "每日一次" : "Daily Once")
               }
             </Text>
          </View>
      </View>
      
      {/* Spacer to prevent content from being hidden behind absolute panel */}
      <View style={{ height: collapsedHeight }} />

      {/* Draggable Collection List */}
      <Animated.View 
        style={[
          styles.gardenListContainer, 
          { 
            height: panelHeight,
            backgroundColor: currentTheme.background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 20,
            paddingBottom: Math.max(insets.bottom, 100),
            marginBottom: 0,
            zIndex: 9999
          }
        ]}
      >
        {/* Draggable Header Area (Handle + Title) */}
        <View 
          {...panelPanResponder.panHandlers}
          style={{ width: '100%', backgroundColor: 'transparent' }}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.collectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Archive size={18} color={currentTheme.text} />
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                {settings.language === 'zh' ? "花園收藏" : "Garden Collection"}
              </Text>
            </View>
            <Text style={[styles.progressText, { color: currentTheme.primary }]}>
              {collectedCount}/7
            </Text>
          </View>
        </View>
        
        {/* Chakra Progress Bar */}
        <View style={styles.chakraProgressContainer}>
          {CHAKRA_COLORS.map((color, index) => {
             const isCollected = collectionProgress[index];
             return (
               <View key={index} style={styles.chakraSlot}>
                 <View 
                   style={[
                     styles.chakraDot, 
                     { 
                       backgroundColor: isCollected ? color : 'transparent',
                       borderColor: color,
                       borderWidth: 1,
                       opacity: isCollected ? 1 : 0.3
                     }
                   ]} 
                 >
                   {isCollected && <View style={styles.chakraGlow} />}
                 </View>
               </View>
             );
          })}
        </View>
        
        {isExpanded ? (
          // GRID VIEW (Expanded)
          <ScrollView 
            style={styles.gardenList} 
            contentContainerStyle={{ paddingBottom: 100, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
          >
             {orbHistory.length === 0 ? (
               <Text style={{ color: currentTheme.textSecondary, padding: 20, width: '100%', textAlign: 'center' }}>
                 {settings.language === 'zh' ? "暫無收藏" : "Empty collection"}
               </Text>
             ) : (
               orbHistory.map((orb, index) => {
                 const shapeNameZh = orb.shape && orb.shape !== 'default' 
                    ? shapes.find(s => s.id === orb.shape)?.nameZh 
                    : null;
                 const shapeNameEn = orb.shape && orb.shape !== 'default'
                    ? shapes.find(s => s.id === orb.shape)?.name
                    : null;
                 
                 const displayName = settings.language === 'zh' 
                    ? (shapeNameZh || orb.sender || "我自己")
                    : (shapeNameEn || orb.sender || "Me");

                 return (
                 <TouchableOpacity 
                    key={orb.id || index} 
                    style={[styles.orbCard, { backgroundColor: currentTheme.surface, margin: 8 }]}
                    onPress={() => handleOrbSelect(orb)}
                 >
                   <View style={styles.orbPreview}>
                      {orb.layers.map((color, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.orbLayer, 
                            { 
                              backgroundColor: color, 
                              width: 10 + (i * 4), 
                              height: 10 + (i * 4),
                              opacity: 0.8
                            } 
                          ]} 
                        />
                      ))}
                      {orb.layers.length === 0 && <View style={[styles.orbLayer, { backgroundColor: '#ccc', width: 20, height: 20 }]} />}
                   </View>
                   <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]}>
                     {new Date(orb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </Text>
                   <Text style={[styles.orbSender, { color: currentTheme.text }]} numberOfLines={1}>
                     {displayName}
                   </Text>
                 </TouchableOpacity>
               )})
             )}
          </ScrollView>
        ) : (
          // HORIZONTAL LIST (Collapsed)
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.gardenList}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
             {orbHistory.length === 0 ? (
               <Text style={{ color: currentTheme.textSecondary, padding: 20 }}>
                 {settings.language === 'zh' ? "暫無收藏" : "Empty collection"}
               </Text>
             ) : (
               orbHistory.map((orb, index) => {
                 const shapeNameZh = orb.shape && orb.shape !== 'default' 
                    ? shapes.find(s => s.id === orb.shape)?.nameZh 
                    : null;
                 const shapeNameEn = orb.shape && orb.shape !== 'default'
                    ? shapes.find(s => s.id === orb.shape)?.name
                    : null;
                 
                 const displayName = settings.language === 'zh' 
                    ? (shapeNameZh || orb.sender || "我自己")
                    : (shapeNameEn || orb.sender || "Me");

                 return (
                 <TouchableOpacity 
                    key={orb.id || index} 
                    style={[styles.orbCard, { backgroundColor: currentTheme.surface }]}
                    onPress={() => handleOrbSelect(orb)}
                 >
                   <View style={styles.orbPreview}>
                      {orb.layers.map((color, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.orbLayer, 
                            { 
                              backgroundColor: color, 
                              width: 10 + (i * 4), 
                              height: 10 + (i * 4),
                              opacity: 0.8
                            } 
                          ]} 
                        />
                      ))}
                      {orb.layers.length === 0 && <View style={[styles.orbLayer, { backgroundColor: '#ccc', width: 20, height: 20 }]} />}
                   </View>
                   <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]}>
                     {new Date(orb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </Text>
                   <Text style={[styles.orbSender, { color: currentTheme.text }]} numberOfLines={1}>
                     {displayName}
                   </Text>
                 </TouchableOpacity>
               )})
             )}
          </ScrollView>
        )}
      </Animated.View>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <Animated.View 
          style={[
            styles.fullscreenOverlay,
            { opacity: fullscreenFadeAnim }
          ]}
        >
          <View style={styles.fullscreenTouchable} {...fullscreenPanResponder.panHandlers}>
            <View style={styles.fullscreenCanvasWrapper}>
              <Canvas camera={{ position: [0, 0, 4.8] }} style={styles.fullscreenCanvas}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbParticles 
                  layers={currentOrb.layers} 
                  interactionState={interactionState}
                  shape={orbShape}
                />
              </Canvas>
            </View>
            
            {/* Floating Action Buttons */}
            <View style={styles.fullscreenActionButtons} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.fullscreenActionButton}
                onPress={() => {
                  if (!currentOrb.isAwakened) {
                    Alert.alert(
                      settings.language === 'zh' ? '尚未覺醒' : 'Not Awakened',
                      settings.language === 'zh' 
                        ? '光球需要覺醒後才能選擇形態' 
                        : 'Orb must be awakened to change shape'
                    );
                    return;
                  }
                  setShowShapeSelector(true);
                }}
                activeOpacity={0.7}
              >
                <Sparkles size={20} color="white" />
                <Text style={styles.fullscreenActionText}>
                  {settings.language === 'zh' ? '形態' : 'MORPH'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.fullscreenActionButton, styles.fullscreenMeditateButton]}
                onPress={() => {
                  if (!currentOrb.isAwakened) {
                    setShowGrowthModal(true);
                  } else {
                    setShowAwakenedModal(true);
                  }
                }}
                activeOpacity={0.7}
              >
                <Sprout size={20} color="white" />
                <Text style={styles.fullscreenActionText}>
                  {settings.language === 'zh' ? '冥想' : 'MEDITATE'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Exit Button */}
            <TouchableOpacity
              style={styles.fullscreenExitButton}
              onPress={exitFullscreen}
              activeOpacity={0.7}
            >
              <Minimize2 size={22} color="white" />
            </TouchableOpacity>
            
            {/* Hint Text */}
            <Animated.Text style={[
              styles.fullscreenHint,
              { opacity: fullscreenFadeAnim }
            ]}>
              {settings.language === 'zh' ? '點擊切換擴散' : 'Tap to toggle diffuse'}
            </Animated.Text>
          </View>
        </Animated.View>
      )}

      {/* Moved Meditation Overlay to the very end to ensure it is on top of everything */}
      {isMeditating && (
        <View style={styles.meditationOverlay} pointerEvents="auto">
           <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                 {Math.floor(meditationTimeLeft / 60)}:{(meditationTimeLeft % 60).toString().padStart(2, '0')}
              </Text>
              {awakenedIntention ? (
                 <Text style={styles.intentionText}>{awakenedIntention}</Text>
              ) : null}
           </View>
           
           <TouchableOpacity 
             style={styles.stopButton}
             activeOpacity={0.6}
             hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
             onPress={(e) => {
                e.stopPropagation(); // Prevent propagation
                stopMeditation();
             }}
           >
              <X size={32} color="white" />
           </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500' as const,
    color: '#E0E7FF',
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  shapeButton: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
  },
  cornerProgressContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  ringContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    opacity: 0.3,
  },
  ringProgress: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
  },
  cornerProgressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    opacity: 0.8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  holdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 8,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e0ff',
  },
  chakraProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  chakraSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  chakraDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chakraGlow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    opacity: 0.5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
  },
  gardenListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,92,246,0.2)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: -10, // Pull up to overlap with padding
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#e0e0ff',
    letterSpacing: 0.5,
  },
  gardenList: {
    paddingHorizontal: 15,
  },
  orbCard: {
    width: 90,
    height: 110,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  orbPreview: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  orbLayer: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbDate: {
    fontSize: 10,
    marginBottom: 4,
    color: '#b0b0ff',
  },
  orbSender: {
    fontSize: 11,
    fontWeight: 'bold',
    maxWidth: '100%',
    color: '#e0e0ff',
  },
  devButton: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  devMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  devMenu: {
    width: '80%',
    maxHeight: '70%',
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  devMenuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shapeModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shapeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  shapeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shapeList: {
    marginBottom: 16,
  },
  shapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  shapeIcon: {
    fontSize: 28,
  },
  shapeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  shapeModalClose: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shapeModalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  durationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meditationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20001,
    elevation: 100,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 60,
    fontWeight: '100',
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  intentionText: {
    fontSize: 18,
    color: '#E0E7FF',
    marginTop: 10,
    fontWeight: '500',
    opacity: 0.9,
  },
  stopButton: {
    marginTop: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topLeftActionGroup: {
    position: "absolute",
    left: 14,
    zIndex: 120,
    elevation: 120,
    alignItems: "flex-start",
  },
  topLeftMorphRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  topLeftMorphFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 14,
  },
  topLeftMorphFabDisabled: {
    backgroundColor: "rgba(100, 100, 100, 0.2)",
    borderColor: "rgba(255,255,255,0.2)",
    shadowOpacity: 0.1,
  },
  topLeftMorphResetFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  topLeftGrowStack: {
    alignItems: "flex-start",
  },
  gardenActionTouchable: {
    borderRadius: 999,
  },
  gardenActionFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 14,
  },
  gardenActionLabel: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.92)',
  },
  giftHeart: {
    fontSize: 32,
  },
  giftOrbPreview: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  giftOrbLayer: {
    position: 'absolute',
    borderRadius: 999,
  },
  selectFriendButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  selectFriendText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  firebaseWarning: {
    marginTop: 8,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 100, 100, 0.6)",
    backgroundColor: "rgba(255, 100, 100, 0.12)",
  },
  firebaseWarningText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#ffb3b3",
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 140,
    right: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10000,
    elevation: 50,
  },
  fullscreenTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenCanvas: {
    flex: 1,
  },
  fullscreenCanvasWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenActionButtons: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    gap: 12,
  },
  fullscreenActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fullscreenMeditateButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.35)',
    borderColor: 'rgba(34, 211, 238, 0.5)',
    shadowColor: '#22d3ee',
  },
  fullscreenActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  fullscreenExitButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fullscreenHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  soundButton: {
    position: 'absolute',
    bottom: 80,
    right: 18,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  soundPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  soundPickerModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  soundPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  soundPickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  soundList: {
    maxHeight: 400,
  },
  soundCategoryTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  soundOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  soundOptionSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  soundOptionText: {
    fontSize: 16,
  },
  soundOptionTextSelected: {
    fontWeight: '600' as const,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
});
