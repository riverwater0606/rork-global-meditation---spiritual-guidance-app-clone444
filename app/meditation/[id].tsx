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
  FlatList,
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
import { Orb3DPreview } from "@/components/Orb3DPreview";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

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
  const { completeMeditation, customMeditations, currentOrb, orbHistory } = useMeditation();
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
    gradient: customSession.gradient || ['#8B5CF6', '#6366F1'],
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
  const [showOrbCollection, setShowOrbCollection] = useState(false);
  const [selectedMeditationOrb, setSelectedMeditationOrb] = useState<string>(currentOrb.id);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectionSlideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const switchingOrbAnim = useRef(new Animated.Value(1)).current;

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
      if (isSpeaking) {
        Speech.stop();
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

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
  }, [selectedSound]);

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

  const handleVoiceGuidance = () => {
    if (!isCustom || !customSession) return;
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    console.log("TTS triggered", { language: lang, script: customSession.script.substring(0, 50) });
    
    Speech.speak(customSession.script, {
      language: lang.startsWith('zh') ? 'zh-CN' : 'en-US',
      rate: 0.9,
      pitch: 1.0,
      onStart: () => {
        console.log("TTS onStart callback");
      },
      onDone: () => {
        console.log("TTS finished");
        setIsSpeaking(false);
      },
      onStopped: () => {
        console.log("TTS stopped");
        setIsSpeaking(false);
      },
      onError: (e) => {
        console.log("TTS ERROR:", e);
        setIsSpeaking(false);
      },
    });
  };

  useEffect(() => {
    console.log("Breathing animation effect triggered", { isPlaying, breathingMethod, isCustom });
    if (isPlaying) {
      let breathingAnimation: Animated.CompositeAnimation;
      let phaseInterval: ReturnType<typeof setInterval>;
      
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
              toValue: 1.3,
              duration: 4000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.3,
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
              toValue: 1.3,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.3,
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
              toValue: 1.3,
              duration: 5000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breathAnimation, {
              toValue: 1.3,
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
              toValue: 1.3,
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
            setIsPlaying(false);
            completeMeditation(session?.id || "", session?.duration || 10);
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
  }, [isPlaying, breathingMethod]);

  useEffect(() => {
    Animated.timing(collectionSlideAnim, {
      toValue: showOrbCollection ? 0 : height * 0.4,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showOrbCollection]);

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowOrbCollection(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 2000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleOrbSwitch = (orbId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(switchingOrbAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(switchingOrbAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setSelectedMeditationOrb(orbId);
      setShowOrbCollection(false);
    }, 300);
  };

  const allOrbs = [currentOrb, ...orbHistory].filter(o => o.layers.length > 0);
  const selectedOrb = allOrbs.find(o => o.id === selectedMeditationOrb) || currentOrb;

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

          <View 
            style={styles.mainContent}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
            <Text style={styles.sessionTitle}>{session.title}</Text>

            <View style={styles.breathingMethodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '4-7-8' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('4-7-8')}
              >
                <Text style={[styles.methodText, breathingMethod === '4-7-8' && styles.methodTextActive]}>
                  {lang === 'zh' ? '4-7-8 呼吸法' : '4-7-8 Breathing'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '4-4-4-4' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('4-4-4-4')}
              >
                <Text style={[styles.methodText, breathingMethod === '4-4-4-4' && styles.methodTextActive]}>
                  {lang === 'zh' ? '箱式呼吸' : 'Box Breathing'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === '5-2-7' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('5-2-7')}
              >
                <Text style={[styles.methodText, breathingMethod === '5-2-7' && styles.methodTextActive]}>
                  {lang === 'zh' ? '腹式慢呼吸' : 'Deep Belly'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === 'free' && styles.methodButtonActive]}
                onPress={() => setBreathingMethod('free')}
              >
                <Text style={[styles.methodText, breathingMethod === 'free' && styles.methodTextActive]}>
                  {lang === 'zh' ? '自由呼吸' : 'Free Breathing'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.breathingContainer}>
              <Animated.View
                style={[
                  styles.orbWrapper,
                  {
                    transform: [{ scale: switchingOrbAnim }],
                    opacity: switchingOrbAnim,
                  },
                ]}
              >
                <Orb3DPreview orb={selectedOrb} size={width * 0.7} />
              </Animated.View>
              
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breathAnimation }],
                  },
                ]}
              >
                <View style={styles.innerCircle}>
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  {isPlaying && (
                    <Text style={styles.breathText}>
                      {breathingPhase === 'inhale' && (lang === 'zh' ? '吸氣' : 'Inhale')}
                      {breathingPhase === 'hold' && (lang === 'zh' ? '屏氣' : 'Hold')}
                      {breathingPhase === 'exhale' && (lang === 'zh' ? '呼氣' : 'Exhale')}
                      {breathingPhase === 'rest' && (lang === 'zh' ? '屏氣' : 'Hold')}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            {isCustom && customSession ? (
              <ScrollView 
                style={styles.scriptScrollView}
                contentContainerStyle={styles.scriptContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.scriptText} selectable>{customSession.script}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.description}>{session.description}</Text>
            )}
          </View>

          <View style={styles.controls}>
            {isCustom && (
              <TouchableOpacity 
                style={[styles.secondaryButton, isSpeaking && styles.speakingButton]}
                onPress={handleVoiceGuidance}
                testID="voice-guidance-button"
              >
                {isSpeaking ? (
                  <View style={styles.speakingIndicator}>
                    <Text style={styles.speakingText}>⏸</Text>
                  </View>
                ) : (
                  <MessageSquare size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
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
              <Text style={styles.modalTitle}>{lang === 'zh' ? '環境音' : 'Ambient Sound'}</Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
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
                  {lang === 'zh' ? '無' : 'None'}
                </Text>
                {selectedSound === null && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>

              {AMBIENT_SOUND_CATEGORIES.map((category) => (
                <View key={category.id}>
                  <Text style={styles.categoryTitle}>{category.name[lang]}</Text>
                  {category.sounds.map((sound) => (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.soundOption,
                        selectedSound === sound.id && styles.soundOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.soundOptionText,
                        selectedSound === sound.id && styles.soundOptionTextSelected
                      ]}>
                        {sound.name[lang]}
                      </Text>
                      {selectedSound === sound.id && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </TouchableOpacity>
                  ))}
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

      <Animated.View 
        style={[
          styles.orbCollectionContainer,
          {
            transform: [{ translateY: collectionSlideAnim }],
          },
        ]}
        pointerEvents={showOrbCollection ? 'auto' : 'none'}
      >
        <View style={styles.collectionHeader}>
          <Text style={styles.collectionTitle}>
            {lang === 'zh' ? '切換光球' : 'Change Orb'}
          </Text>
          <TouchableOpacity onPress={() => setShowOrbCollection(false)}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={allOrbs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.orbList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.miniOrbContainer,
                selectedMeditationOrb === item.id && styles.miniOrbSelected,
              ]}
              onPress={() => handleOrbSwitch(item.id)}
            >
              <View style={styles.miniOrbWrapper}>
                <Orb3DPreview orb={item} size={80} />
              </View>
              {item.shape && (
                <View style={styles.orbBadge}>
                  <Text style={styles.orbBadgeText}>
                    {item.shape === 'earth' ? '🌍' : 
                     item.shape === 'merkaba' ? '🔯' :
                     item.shape === 'mudra' ? '🙏' :
                     item.shape === 'flower-of-life' ? '🌸' :
                     item.shape === 'star-of-david' ? '✡️' : '⭕'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </Animated.View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  sessionTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },

  breathingContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
    position: "relative" as const,
  },
  orbWrapper: {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    zIndex: 1,
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
    zIndex: 10,
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
  scriptScrollView: {
    flex: 1,
    width: "100%",
    marginHorizontal: 20,
  },
  scriptContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  scriptText: {
    fontSize: 17,
    color: "#E0E7FF",
    lineHeight: 30,
    textAlign: "left",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 20,
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
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
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
  soundOptionSelected: {
    backgroundColor: "#F3F4F6",
  },
  soundOptionText: {
    fontSize: 16,
    color: "#4B5563",
  },
  soundOptionTextSelected: {
    color: "#8B5CF6",
    fontWeight: "600",
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
  orbCollectionContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 100,
    zIndex: 1000,
  },
  collectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  collectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  orbList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  miniOrbContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden" as const,
    position: "relative" as const,
  },
  miniOrbSelected: {
    borderColor: "#8B5CF6",
    borderWidth: 4,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  miniOrbWrapper: {
    width: "100%",
    height: "100%",
  },
  orbBadge: {
    position: "absolute" as const,
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  orbBadgeText: {
    fontSize: 12,
  },
});
