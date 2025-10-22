import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Pause, Play, Volume2, VolumeX, Waves, Wind, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  getAmbientSoundById,
  getLocalizedContent,
  MeditationSession,
  SupportedLanguage,
} from "@/constants/meditations";
import { useMeditation, CustomMeditationSession } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";

const isCustomSession = (
  session?: MeditationSession | CustomMeditationSession | null
): session is CustomMeditationSession => {
  return !!session && (session as CustomMeditationSession).source !== undefined;
};

const toSeconds = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.round(numeric));
};

const minutesToSeconds = (value: unknown) => {
  const minutes = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(minutes)) {
    return 0;
  }
  return Math.max(0, Math.round(minutes * 60));
};

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const { getSessionById, completeMeditation } = useMeditation();
  const { settings } = useSettings();
  const language = settings.language as SupportedLanguage;

  const session = useMemo(() => {
    if (!id || Array.isArray(id)) return undefined;
    return getSessionById(String(id));
  }, [getSessionById, id]);

  const localized = session ? getLocalizedContent(session, language) : null;

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(() => !!session?.defaultAmbientSoundId);
  const [isNarrating, setIsNarrating] = useState(false);

  const baseDurationSeconds = useMemo(() => minutesToSeconds(session?.duration), [session?.duration, session?.id]);
  const [durationSeconds, setDurationSeconds] = useState<number>(baseDurationSeconds);
  const [timeRemaining, setTimeRemaining] = useState<number>(baseDurationSeconds);
  const breathAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const ambientSource = useMemo(() => getAmbientSoundById(session?.defaultAmbientSoundId), [session]);

  useEffect(() => {
    setDurationSeconds(baseDurationSeconds);
    setTimeRemaining(baseDurationSeconds);
  }, [baseDurationSeconds, session?.id]);

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimation]);

  const resetSpeech = useCallback(() => {
    Speech.stop();
    setIsNarrating(false);
  }, []);

  const unloadSounds = useCallback(async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    if (ambientSound) {
      await ambientSound.unloadAsync();
      setAmbientSound(null);
    }
  }, [ambientSound, sound]);

  useEffect(() => {
    return () => {
      resetSpeech();
      void unloadSounds();
    };
  }, [resetSpeech, unloadSounds]);

  const onPlaybackStatusUpdate = useCallback(
    async (status: Audio.AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const derivedFromStatus =
        typeof status.durationMillis === "number"
          ? toSeconds(status.durationMillis / 1000)
          : 0;
      const fallbackDuration = baseDurationSeconds;
      const totalSeconds = derivedFromStatus > 0 ? derivedFromStatus : fallbackDuration;

      if (totalSeconds !== durationSeconds) {
        setDurationSeconds(totalSeconds);
      }

      if (typeof status.positionMillis === "number") {
        const remainingRaw = totalSeconds - status.positionMillis / 1000;
        setTimeRemaining(toSeconds(remainingRaw));
      }
      if ((status as Audio.AVPlaybackStatusSuccess).didJustFinish) {
        setIsPlaying(false);
        const completedMinutes = Number.isFinite(Number(session?.duration))
          ? Math.ceil(Number(session?.duration))
          : Math.ceil(totalSeconds / 60);
        await completeMeditation(session?.id ?? "", completedMinutes);
        resetSpeech();
      }
    },
    [baseDurationSeconds, completeMeditation, durationSeconds, resetSpeech, session]
  );

  const loadMainAudio = useCallback(async (): Promise<Audio.Sound | null> => {
    if (!session?.audioUrl) return null;
    if (sound) return sound;

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: session.audioUrl },
      {
        shouldPlay: false,
        volume: isMuted ? 0 : 1,
        isLooping: false,
      }
    );
    await newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setSound(newSound);
    return newSound;
  }, [isMuted, onPlaybackStatusUpdate, session, sound]);

  const ensureAmbientLoaded = useCallback(async (): Promise<Audio.Sound | null> => {
    if (!ambientSource) return null;
    if (ambientSound) return ambientSound;
    const { sound: newAmbient } = await Audio.Sound.createAsync(
      { uri: ambientSource.url },
      { shouldPlay: false, isLooping: true, volume: 0.5 }
    );
    setAmbientSound(newAmbient);
    return newAmbient;
  }, [ambientSound, ambientSource]);

  useEffect(() => {
    if (!session) return;
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: false,
    });
    void loadMainAudio();
    if (isAmbientEnabled) {
      void ensureAmbientLoaded();
    }
  }, [ensureAmbientLoaded, isAmbientEnabled, loadMainAudio, session]);

  useEffect(() => {
    if (!sound) return;
    sound.setVolumeAsync(isMuted ? 0 : 1).catch(() => {});
  }, [isMuted, sound]);

  useEffect(() => {
    if (!isPlaying) return;
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnimation, {
          toValue: 1.2,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnimation, {
          toValue: 0.8,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimation.start();

    return () => breathingAnimation.stop();
  }, [breathAnimation, isPlaying]);

  const togglePlayback = useCallback(async () => {
    if (!session) return;

    try {
      const activeSound = await loadMainAudio();
      if (!activeSound) {
        Alert.alert(language === "zh" ? "音訊載入失敗" : "Audio unavailable");
        return;
      }

      if (isPlaying) {
        await activeSound.pauseAsync();
        if (ambientSound) await ambientSound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (!Number.isFinite(timeRemaining) || timeRemaining <= 0) {
        setTimeRemaining(durationSeconds);
      }

      await activeSound.playAsync();
      if (isAmbientEnabled) {
        const loadedAmbient = await ensureAmbientLoaded();
        await loadedAmbient?.playAsync();
      }
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to toggle playback", error);
      Alert.alert(language === "zh" ? "播放失敗" : "Playback error", language === "zh" ? "請稍後再試" : "Please try again shortly");
      setIsPlaying(false);
    }
  }, [
    ambientSound,
    ensureAmbientLoaded,
    isAmbientEnabled,
    isPlaying,
    language,
    loadMainAudio,
    session,
    timeRemaining,
    durationSeconds,
  ]);

  const toggleAmbient = useCallback(async () => {
    if (!ambientSource) {
      Alert.alert(language === "zh" ? "無背景音" : "Ambient unavailable");
      return;
    }
    const next = !isAmbientEnabled;
    setIsAmbientEnabled(next);
    if (next) {
      const loadedAmbient = await ensureAmbientLoaded();
      if (isPlaying) {
        await loadedAmbient?.playAsync();
      }
    } else {
      await ambientSound?.stopAsync();
    }
  }, [ambientSound, ambientSource, ensureAmbientLoaded, isAmbientEnabled, isPlaying, language]);

  const toggleNarration = useCallback(() => {
    if (!isCustomSession(session) || !session.script?.length) {
      Alert.alert(language === "zh" ? "無可朗讀腳本" : "No script available");
      return;
    }

    if (isNarrating) {
      resetSpeech();
      return;
    }

    const voiceLanguage = language === "zh" ? "zh-TW" : "en-US";
    Speech.speak(session.script.join(" "), {
      language: voiceLanguage,
      rate: 0.95,
      onDone: resetSpeech,
      onStopped: resetSpeech,
      onError: resetSpeech,
    });
    setIsNarrating(true);
  }, [isNarrating, language, resetSpeech, session]);

  const formatTime = (seconds: number) => {
    const safe = toSeconds(seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!session || !localized) {
    return (
      <View style={styles.container}>
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={session.gradient as [string, string]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} testID="close-meditation">
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.sessionTitle}>{localized.title}</Text>
            <Text style={styles.sessionNarrator}>{language === "zh" ? `由 ${session.narrator} 引導` : `with ${session.narrator}`}</Text>

            <View style={styles.breathingContainer}>
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
                      {Math.floor(timeRemaining % 8) < 4
                        ? language === "zh" ? "吸氣" : "Breathe In"
                        : language === "zh" ? "呼氣" : "Breathe Out"}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            <ScrollView style={styles.descriptionContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.description}>{localized.description}</Text>
              {isCustomSession(session) && session.script?.length > 0 && (
                <View style={styles.scriptContainer}>
                  <Text style={styles.scriptTitle}>
                    {language === "zh" ? "引導腳本" : "Guided Script"}
                  </Text>
                  {session.script.map((segment, index) => (
                    <Text key={index} style={styles.scriptLine}>
                      {segment}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsMuted((prev) => !prev)} testID="volume-button">
              {isMuted ? <VolumeX size={24} color="#FFFFFF" /> : <Volume2 size={24} color="#FFFFFF" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={togglePlayback} testID="play-pause-button">
              {isPlaying ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleAmbient} testID="ambient-toggle">
              <Waves size={24} color={isAmbientEnabled ? "#FFFFFF" : "rgba(255,255,255,0.6)"} />
            </TouchableOpacity>
          </View>

          {isCustomSession(session) && (
            <View style={styles.scriptActions}>
              <TouchableOpacity style={styles.scriptButton} onPress={toggleNarration}>
                <Wind size={18} color="#FFFFFF" />
                <Text style={styles.scriptButtonText}>
                  {isNarrating
                    ? language === "zh" ? "停止引導" : "Stop Narration"
                    : language === "zh" ? "AI 語音引導" : "AI Voice Guide"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  sessionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sessionNarrator: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.85,
    textAlign: "center",
  },
  breathingContainer: {
    alignItems: "center",
  },
  breathingCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  timerText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  breathText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  descriptionContainer: {
    maxHeight: 200,
    width: "100%",
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 24,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  scriptContainer: {
    marginTop: 24,
    gap: 12,
  },
  scriptTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scriptLine: {
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.85,
    lineHeight: 22,
    textAlign: "center",
  },
  scriptActions: {
    alignItems: "center",
    marginBottom: 16,
  },
  scriptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  scriptButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
