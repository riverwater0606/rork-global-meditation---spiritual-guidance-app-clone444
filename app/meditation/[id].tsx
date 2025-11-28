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

// 你的 29 個音頻保持不變（我沒動）

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
      setBreathingMethod(method);
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

  // 關鍵修復：語音引導直接呼叫（web 環境必須）
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

  // 你的其他 useEffect（音效、timer、volume）全部保持不變

  // return JSX 完全不變

  return (
    // 你的 UI 完全不變
  );
}

// styles 完全不變
