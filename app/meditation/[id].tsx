// app/meditation/[id].tsx
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
  Platform,
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
  // ... (保留你原本的聲音清單；為簡潔我省略了這裡的長清單)
  // 請在實際覆蓋時把原本的 AMBIENT_SOUND_CATEGORIES 內容完整貼回來
];

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const sessionFromLibrary = MEDITATION_SESSIONS.find(s => s.id === id);
  const { completeMeditation, customMeditations } = useMeditation();
  const { settings } = useSettings();
  const lang = settings.language;

  const customSession = customMeditations.find(m => m.id === id);
  const isCustom = !!customSession;
  const session = isCustom
    ? {
        id: customSession.id,
        title: customSession.title,
        description: customSession.script.substring(0, 100) + "...",
        duration: customSession.duration,
        narrator: lang === "zh" ? "AI 生成" : "AI Generated",
        category: "custom",
        gradient: ["#8B5CF6", "#6366F1"],
      }
    : sessionFromLibrary;

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session?.duration ? session.duration * 60 : 600);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [breathingMethod, setBreathingMethod] = useState<"4-7-8" | "4-4-4-4" | "5-2-7" | "free">("4-7-8");
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const originalVolume = useRef(0.5);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [showToast, setShowToast] = useState(false);

  // --- helpers ---
  const splitTextIntoChunks = (text: string, maxLen = 300) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g);
    if (!sentences) {
      const parts: string[] = [];
      for (let i = 0; i < text.length; i += maxLen) {
        parts.push(text.slice(i, i + maxLen));
      }
      return parts;
    }
    const chunks: string[] = [];
    let cur = "";
    for (const s of sentences) {
      if ((cur + s).length > maxLen) {
        if (cur.length) chunks.push(cur);
        cur = s;
      } else {
        cur += s;
      }
    }
    if (cur.length) chunks.push(cur);
    return chunks;
  };

  // fade volume over a short duration (ms)
  const fadeVolume = async (from: number, to: number, duration = 400) => {
    if (!soundRef.current) return;
    const steps = 8;
    const stepTime = Math.max(20, Math.floor(duration / steps));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const v = from + (to - from) * t;
      try {
        await soundRef.current.setVolumeAsync(v);
      } catch (e) {
        console.warn("fadeVolume setVolumeAsync failed:", e);
      }
      // small pause between steps
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, stepTime));
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Configure audio conservatively to allow ducking
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error("Error configuring audio:", e);
      }
    };
    configureAudio();

    return () => {
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch (e) {
          console.error("Error unloading sound on unmount:", e);
        }
        if (isSpeaking) {
          try {
            Speech.stop();
          } catch (e) {
            console.warn("Speech.stop on unmount failed:", e);
          }
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCustom && customSession?.breathingMethod) {
      const method = customSession.breathingMethod;
      if (method === "4-7-8" || method === "4-4-4-4" || method === "5-2-7" || method === "free") {
        setBreathingMethod(method);
      }
    }
  }, [isCustom, customSession]);

  // load ambient sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch (e) {
            console.warn("Error unloading previous sound:", e);
          }
          soundRef.current = null;
        }

        if (selectedSound) {
          let soundUrl: string | null = null;
          for (const category of AMBIENT_SOUND_CATEGORIES) {
            const sound = category.sounds.find((s) => s.id === selectedSound);
            if (sound) {
              soundUrl = sound.url;
              break;
            }
          }

          if (soundUrl) {
            try {
              await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
                interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
                playThroughEarpieceAndroid: false,
              });
            } catch (e) {
              console.warn("setAudioModeAsync failed on loadSound:", e);
            }

            const { sound: audioSound } = await Audio.Sound.createAsync(
              { uri: soundUrl },
              { shouldPlay: isPlaying, isLooping: true, volume }
            );
            soundRef.current = audioSound;
            originalVolume.current = volume;
          }
        }
      } catch (error) {
        console.error("Error loading sound:", error);
      }
    };

    loadSound();
  }, [selectedSound]);

  // play/pause ambient sound when isPlaying toggles
  useEffect(() => {
    const updateSound = async () => {
      if (soundRef.current) {
        try {
          if (isPlaying) {
            await soundRef.current.playAsync();
          } else {
            await soundRef.current.pauseAsync();
          }
        } catch (e) {
          console.warn("updateSound error:", e);
        }
      }
    };
    updateSound();
  }, [isPlaying]);

  useEffect(() => {
    originalVolume.current = volume;
  }, [volume]);

  // ensure ambient volume reacts to isSpeaking
  useEffect(() => {
    const updateVolume = async () => {
      if (soundRef.current) {
        try {
          const targetVolume = isSpeaking ? volume * 0.3 : volume;
          await soundRef.current.setVolumeAsync(targetVolume);
        } catch (e) {
          console.warn("updateVolume error:", e);
        }
      }
    };
    updateVolume();
  }, [volume, isSpeaking]);

  // ---------- NEW robust TTS flow (calls /api/tts and plays MP3 blob) ----------
  const handleVoiceGuidance = async () => {
    if (!isCustom || !customSession) return;

    // If already speaking -> stop
    if (isSpeaking) {
      try {
        // stop HTML audio if exists (we store reference on window)
        // @ts-ignore
        if (globalThis.__CURRENT_TTS_AUDIO__) {
          try {
            // @ts-ignore
            globalThis.__CURRENT_TTS_AUDIO__.pause();
            // @ts-ignore
            globalThis.__CURRENT_TTS_AUDIO__.src = "";
            // @ts-ignore
            globalThis.__CURRENT_TTS_AUDIO__ = null;
          } catch (e) {
            // ignore
          }
        }
        Speech.stop();
      } catch (e) {
        console.warn("Speech.stop() error:", e);
      }
      setIsSpeaking(false);
      if (soundRef.current) {
        try {
          await soundRef.current.setVolumeAsync(originalVolume.current);
        } catch (e) {
          console.warn("restore volume after stop failed:", e);
        }
      }
      return;
    }

    const script =
      customSession.script ||
      (lang === "zh" ? "歡迎來到您的專屬冥想時光。請深呼吸，放鬆身心。" : "Welcome to your personal meditation session. Take a deep breath and relax.");

    if (!customSession.script) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }

    setIsSpeaking(true);

    const voiceLanguage = (customSession.language || lang) === "zh" ? "zh-CN" : "en-US";

    // fade ambient down (attempt)
    try {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          const currentVol =
            status && typeof status.volume === "number" && status.isLoaded ? status.volume : volume;
          await fadeVolume(currentVol, currentVol * 0.3, 300);
        } catch (e) {
          console.warn("fade down failed:", e);
          try {
            await soundRef.current.setVolumeAsync(volume * 0.3);
          } catch {}
        }
      }
    } catch (e) {
      console.warn("ambient fade down overall failed:", e);
    }

    // Request TTS from backend
    let blobUrl: string | null = null;
    let audioPlayed = false;

    try {
      const ttsResp = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          languageCode: voiceLanguage,
          // optionally voiceName: "en-US-Wavenet-D"
        }),
      });

      if (!ttsResp.ok) {
        const txt = await ttsResp.text();
        console.error("TTS API non-ok:", ttsResp.status, txt);
        throw new Error("TTS API failed");
      }

      const arrayBuffer = await ttsResp.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      blobUrl = URL.createObjectURL(blob);

      // --- Strategy 1: Use HTMLAudioElement when available (best for WebView hybrid environments) ---
      try {
        if (typeof window !== "undefined" && typeof (window as any).Audio === "function") {
          const htmlAudio = new (window as any).Audio();
          // store ref globally so we can stop on repeated presses
          // @ts-ignore
          globalThis.__CURRENT_TTS_AUDIO__ = htmlAudio;

          htmlAudio.src = blobUrl;
          htmlAudio.preload = "auto";
          htmlAudio.autoplay = false;
          htmlAudio.onended = async () => {
            audioPlayed = true;
            // cleanup
            try {
              htmlAudio.pause();
              htmlAudio.src = "";
            } catch (e) {}
            // fade ambient up
            try {
              if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                const curr = status && typeof status.volume === "number" && status.isLoaded ? status.volume : volume * 0.3;
                await fadeVolume(curr, originalVolume.current, 400);
              }
            } catch (e) {
              try { if (soundRef.current) await soundRef.current.setVolumeAsync(originalVolume.current); } catch {}
            }
            setIsSpeaking(false);
            try { URL.revokeObjectURL(blobUrl); } catch {}
            // clear global ref
            // @ts-ignore
            globalThis.__CURRENT_TTS_AUDIO__ = null;
          };

          htmlAudio.onerror = async (ev: any) => {
            console.warn("HTMLAudio playback error:", ev);
            try {
              htmlAudio.pause();
              htmlAudio.src = "";
            } catch (e) {}
            // fallback to expo-av if available
          };

          // Attempt to play - many WebViews require this to be in response to a user gesture (we are in onPress)
          const playPromise = htmlAudio.play();
          if (playPromise && typeof playPromise.then === "function") {
            try {
              await playPromise;
              audioPlayed = true;
              // wait for ended (handled by onended)
            } catch (e) {
              console.warn("HTMLAudio play() rejected:", e);
              // fallback
              audioPlayed = false;
            }
          } else {
            // some browsers return undefined - treat as success and rely on onended
            audioPlayed = true;
          }

          // If html audio played, we return early (onended will restore ambient)
          if (audioPlayed) {
            return;
          }
        }
      } catch (htmlErr) {
        console.warn("HTMLAudio strategy failed:", htmlErr);
      }

      // --- Strategy 2: fallback to expo-av Audio.Sound (if native) ---
      try {
        if (!audioPlayed) {
          // Create a Sound from the blobUrl (this works in many WebView setups and native)
          // expo-av accepts a uri pointing to an accessible URL. blobUrl may or may not work depending on environment.
          const { sound } = await Audio.Sound.createAsync(
            { uri: blobUrl },
            { shouldPlay: true, isLooping: false, volume: 1.0 }
          );
          // keep a reference to be able to stop if user taps again
          // (we won't override ambient soundRef)
          // Wait until sound finishes
          const finished = await new Promise<void>((resolve) => {
            let done = false;
            const checkStatus = async () => {
              try {
                const status = await sound.getStatusAsync();
                if (status.didJustFinish || !status.isLoaded) {
                  if (!done) {
                    done = true;
                    resolve();
                  }
                } else {
                  // poll
                  setTimeout(checkStatus, 300);
                }
              } catch (e) {
                if (!done) {
                  done = true;
                  resolve();
                }
              }
            };
            checkStatus();
          });

          try {
            await sound.unloadAsync();
          } catch (e) {}
          audioPlayed = true;
          // fade ambient up
          try {
            if (soundRef.current) {
              const status = await soundRef.current.getStatusAsync();
              const curr = status && typeof status.volume === "number" && status.isLoaded ? status.volume : volume * 0.3;
              await fadeVolume(curr, originalVolume.current, 400);
            }
          } catch (e) {
            try { await soundRef.current?.setVolumeAsync(originalVolume.current); } catch {}
          }
          setIsSpeaking(false);
          try { URL.revokeObjectURL(blobUrl); } catch {}
          return;
        }
      } catch (expoErr) {
        console.warn("expo-av fallback failed:", expoErr);
      }

      // --- Strategy 3: last-resort: use expo-speech (if previously working on this env) ---
      try {
        if (!audioPlayed) {
          // This may not produce sound in World App; still try as last resort
          const chunks = splitTextIntoChunks(script, 300);
          for (const chunk of chunks) {
            await new Promise<void>((resolve, reject) => {
              let done = false;
              Speech.speak(chunk, {
                language: voiceLanguage,
                rate: 0.95,
                pitch: 1.0,
                onDone: () => {
                  if (!done) {
                    done = true;
                    resolve();
                  }
                },
                onError: (e: any) => {
                  if (!done) {
                    done = true;
                    reject(e);
                  }
                },
              });
              // safety
              setTimeout(() => {
                if (!done) {
                  done = true;
                  resolve();
                }
              }, Math.max(9000, chunk.length * 50));
            });
          }
          // restore ambient
          try {
            if (soundRef.current) {
              const status = await soundRef.current.getStatusAsync();
              const curr = status && typeof status.volume === "number" && status.isLoaded ? status.volume : volume * 0.3;
              await fadeVolume(curr, originalVolume.current, 400);
            }
          } catch (e) {
            try { await soundRef.current?.setVolumeAsync(originalVolume.current); } catch {}
          }
          setIsSpeaking(false);
          return;
        }
      } catch (speechErr) {
        console.warn("expo-speech fallback failed:", speechErr);
      }
    } catch (err) {
      console.error("TTS & playback overall error:", err);
      // attempt restore ambient
      try {
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(originalVolume.current);
        }
      } catch (e) {
        console.warn("restore ambient after error failed:", e);
      }
      setIsSpeaking(false);
    } finally {
      // cleanup: revoke blob if not already done
      try {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  };

  useEffect(() => {
    if (isPlaying) {
      let breathingAnimation: Animated.CompositeAnimation;
      let phaseInterval: ReturnType<typeof setInterval>;

      if (breathingMethod === "4-7-8") {
        let cycleTime = 0;
        const totalCycleTime = 19000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 4000) {
            setBreathingPhase("inhale");
          } else if (cycleTime < 11000) {
            setBreathingPhase("hold");
          } else {
            setBreathingPhase("exhale");
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
      } else if (breathingMethod === "4-4-4-4") {
        let cycleTime = 0;
        const totalCycleTime = 16000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 4000) {
            setBreathingPhase("inhale");
          } else if (cycleTime < 8000) {
            setBreathingPhase("hold");
          } else if (cycleTime < 12000) {
            setBreathingPhase("exhale");
          } else {
            setBreathingPhase("rest");
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
      } else if (breathingMethod === "5-2-7") {
        let cycleTime = 0;
        const totalCycleTime = 14000;
        phaseInterval = setInterval(() => {
          cycleTime = (cycleTime + 100) % totalCycleTime;
          if (cycleTime < 5000) {
            setBreathingPhase("inhale");
          } else if (cycleTime < 7000) {
            setBreathingPhase("hold");
          } else {
            setBreathingPhase("exhale");
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
            setBreathingPhase("inhale");
          } else {
            setBreathingPhase("exhale");
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
      setBreathingPhase("inhale");
    }
  }, [isPlaying, breathingMethod]);

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
    <LinearGradient colors={session.gradient as any} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View pointerEvents="box-none" style={[styles.content, { opacity: fadeAnimation }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} testID="close-meditation">
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionNarrator}>with {session.narrator}</Text>

            <View style={styles.breathingMethodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === "4-7-8" && styles.methodButtonActive]}
                onPress={() => setBreathingMethod("4-7-8")}
              >
                <Text style={[styles.methodText, breathingMethod === "4-7-8" && styles.methodTextActive]}>
                  {lang === "zh" ? "4-7-8 呼吸法" : "4-7-8 Breathing"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === "4-4-4-4" && styles.methodButtonActive]}
                onPress={() => setBreathingMethod("4-4-4-4")}
              >
                <Text style={[styles.methodText, breathingMethod === "4-4-4-4" && styles.methodTextActive]}>
                  {lang === "zh" ? "箱式呼吸" : "Box Breathing"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, breathingMethod === "5-2-7" && styles.methodButtonActive]}
                onPress={() => setBreathingMethod("5-2-7")}
              >
                <Text style={[styles.methodText, breathingMethod === "5-2-7" && styles.methodTextActive]}>
                  {lang === "zh" ? "腹式慢呼吸" : "Deep Belly"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodButton, breathingMethod === "free" && styles.methodButtonActive]} onPress={() => setBreathingMethod("free")}>
                <Text style={[styles.methodText, breathingMethod === "free" && styles.methodTextActive]}>{lang === "zh" ? "自由呼吸" : "Free Breathing"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.breathingContainer}>
              <Animated.View style={[styles.breathingCircle, { transform: [{ scale: breathAnimation }] }]}>
                <View style={styles.innerCircle}>
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  {isPlaying && (
                    <Text style={styles.breathText}>
                      {breathingPhase === "inhale" && (lang === "zh" ? "吸氣" : "Inhale")}
                      {breathingPhase === "hold" && (lang === "zh" ? "屏氣" : "Hold")}
                      {breathingPhase === "exhale" && (lang === "zh" ? "呼氣" : "Exhale")}
                      {breathingPhase === "rest" && (lang === "zh" ? "屏氣" : "Hold")}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            {isCustom && customSession ? (
              <ScrollView style={styles.scriptScrollView} contentContainerStyle={styles.scriptContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.scriptText} selectable>
                  {customSession.script}
                </Text>
              </ScrollView>
            ) : (
              <Text style={styles.description}>{session.description}</Text>
            )}
          </View>

          <View style={styles.controls}>
            {isCustom && (
              <TouchableOpacity
                style={[styles.secondaryButton, isSpeaking && styles.speakingButton]}
                onPress={async () => {
                  try {
                    await handleVoiceGuidance();
                  } catch (err) {
                    console.error("handleVoiceGuidance top-level error:", err);
                    setIsSpeaking(false);
                  }
                }}
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
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowSoundPicker(true)} testID="sound-picker-button">
              <Music size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)} testID="play-pause-button">
              {isPlaying ? <Pause size={32} color="#FFFFFF" /> : <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setVolume((v) => (v > 0 ? 0 : 0.5))} testID="volume-button">
              {volume === 0 ? <VolumeX size={24} color="#FFFFFF" /> : <Volume2 size={24} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>

      <Modal visible={showSoundPicker} transparent animationType="slide" onRequestClose={() => setShowSoundPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.soundPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === "zh" ? "環境音" : "Ambient Sound"}</Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
              <TouchableOpacity style={[styles.soundOption, selectedSound === null && styles.soundOptionSelected]} onPress={() => { setSelectedSound(null); setShowSoundPicker(false); }}>
                <Text style={[styles.soundOptionText, selectedSound === null && styles.soundOptionTextSelected]}>{lang === "zh" ? "無" : "None"}</Text>
                {selectedSound === null && <View style={styles.selectedIndicator} />}
              </TouchableOpacity>

              {AMBIENT_SOUND_CATEGORIES.map((category) => (
                <View key={category.id}>
                  <Text style={styles.categoryTitle}>{category.name[lang]}</Text>
                  {category.sounds.map((sound) => (
                    <TouchableOpacity key={sound.id} style={[styles.soundOption, selectedSound === sound.id && styles.soundOptionSelected]} onPress={() => { setSelectedSound(sound.id); setShowSoundPicker(false); }}>
                      <Text style={[styles.soundOptionText, selectedSound === sound.id && styles.soundOptionTextSelected]}>{sound.name[lang]}</Text>
                      {selectedSound === sound.id && <View style={styles.selectedIndicator} />}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.volumeControl}>
              <VolumeX size={20} color="#6B7280" />
              <Slider style={styles.volumeSlider} minimumValue={0} maximumValue={1} value={volume} onValueChange={setVolume} minimumTrackTintColor="#8B5CF6" maximumTrackTintColor="#E5E7EB" />
              <Volume2 size={20} color="#6B7280" />
            </View>
          </View>
        </View>
      </Modal>

      {showToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{lang === "zh" ? "腳本載入中，請重試" : "Script loading, try again"}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  /* styles: 把你原本的 styles 完整貼回來 - 為了避免省略導致錯誤，請使用你 repo 中原本的 styles block */
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "flex-end", paddingTop: 20 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.2)", justifyContent: "center", alignItems: "center" },
  mainContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  sessionTitle: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  sessionNarrator: { fontSize: 16, color: "#E0E7FF", marginBottom: 40 },
  breathingContainer: { width: width * 0.7, height: width * 0.7, justifyContent: "center", alignItems: "center", marginVertical: 40 },
  breathingCircle: { width: "100%", height: "100%", borderRadius: width * 0.35, backgroundColor: "rgba(255, 255, 255, 0.1)", justifyContent: "center", alignItems: "center", shadowColor: "#FFFFFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20 },
  innerCircle: { width: "70%", height: "70%", borderRadius: width * 0.35, backgroundColor: "rgba(255, 255, 255, 0.15)", justifyContent: "center", alignItems: "center" },
  timerText: { fontSize: 48, fontWeight: "bold", color: "#FFFFFF" },
  breathText: { fontSize: 16, color: "#E0E7FF", marginTop: 8 },
  description: { fontSize: 16, color: "#E0E7FF", textAlign: "center", paddingHorizontal: 20, lineHeight: 24 },
  scriptScrollView: { flex: 1, width: "100%", marginBottom: 20 },
  scriptContent: { paddingHorizontal: 32, paddingVertical: 10 },
  scriptText: { fontSize: 16, color: "#E0E7FF", lineHeight: 26, textAlign: "left" },
  speakingButton: { backgroundColor: "rgba(255, 215, 0, 0.3)" },
  speakingIndicator: { justifyContent: "center", alignItems: "center" },
  speakingText: { fontSize: 24, color: "#FFD700" },
  breathingMethodSelector: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 20, paddingHorizontal: 10 },
  methodButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.15)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" },
  methodButtonActive: { backgroundColor: "rgba(255, 255, 255, 0.3)", borderColor: "rgba(255, 255, 255, 0.5)" },
  methodText: { fontSize: 12, color: "rgba(255, 255, 255, 0.7)", fontWeight: "500" },
  methodTextActive: { color: "#FFFFFF", fontWeight: "700" },
  controls: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 40 },
  playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255, 255, 255, 0.3)", justifyContent: "center", alignItems: "center" },
  secondaryButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255, 255, 255, 0.2)", justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  soundPickerModal: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  soundList: { maxHeight: 400 },
  categoryTitle: { fontSize: 14, fontWeight: "700", color: "#8B5CF6", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: "#F9FAFB" },
  soundOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  soundOptionSelected: { backgroundColor: "#F3F4F6" },
  soundOptionText: { fontSize: 16, color: "#4B5563" },
  soundOptionTextSelected: { color: "#8B5CF6", fontWeight: "600" },
  selectedIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#8B5CF6" },
  volumeControl: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  volumeSlider: { flex: 1, height: 40 },
  toastContainer: { position: "absolute", bottom: 100, left: 20, right: 20, backgroundColor: "rgba(0, 0, 0, 0.8)", padding: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  toastText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
