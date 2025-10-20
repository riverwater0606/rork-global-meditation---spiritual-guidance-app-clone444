import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, X, Volume2, VolumeX, Music } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { SOUND_EFFECTS } from "@/constants/soundEffects";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";

const { width } = Dimensions.get("window");

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const session = MEDITATION_SESSIONS.find(s => s.id === id);
  const { completeMeditation } = useMeditation();
  const { settings } = useSettings();
  const lang = settings.language;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session?.duration ? session.duration * 60 : 600);
  const [showSoundPicker, setShowSoundPicker] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const breathAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

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
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
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
        breathingAnimation.stop();
      };
    }
  }, [isPlaying, session]);

  useEffect(() => {
    if (selectedSound && isPlaying) {
      playBackgroundSound(selectedSound);
    } else if (soundRef.current) {
      soundRef.current.pauseAsync();
    }
  }, [selectedSound, isPlaying]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(soundVolume);
    }
  }, [soundVolume]);

  const playBackgroundSound = async (soundId: string) => {
    try {
      const sound = SOUND_EFFECTS.find(s => s.id === soundId);
      if (!sound) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: sound.url },
        { shouldPlay: true, isLooping: true, volume: soundVolume }
      );

      soundRef.current = audioSound;
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              testID="close-meditation"
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.sessionTitle}>
              {lang === "zh" ? session.titleZh : session.title}
            </Text>

            {/* Breathing Circle */}
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
                      {lang === "zh" 
                        ? (Math.floor(timeRemaining % 8) < 4 ? "吸氣" : "呼氣")
                        : (Math.floor(timeRemaining % 8) < 4 ? "Breathe In" : "Breathe Out")
                      }
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            <Text style={styles.description}>
              {lang === "zh" ? session.descriptionZh : session.description}
            </Text>
          </View>

          {/* Sound Effects Section */}
          {selectedSound && (
            <View style={styles.soundControlContainer}>
              <Text style={styles.soundLabel}>
                {SOUND_EFFECTS.find(s => s.id === selectedSound)?.icon}{" "}
                {lang === "zh" 
                  ? SOUND_EFFECTS.find(s => s.id === selectedSound)?.nameZh
                  : SOUND_EFFECTS.find(s => s.id === selectedSound)?.name
                }
              </Text>
              <View style={styles.soundVolumeControl}>
                <VolumeX size={16} color="#FFFFFF" />
                <View style={styles.sliderWrapper}>
                  {Platform.OS === "web" ? (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(parseFloat((e.target as HTMLInputElement).value))}
                      style={{
                        flex: 1,
                        margin: "0 8px",
                        accentColor: "#FFFFFF",
                      } as React.CSSProperties}
                    />
                  ) : (
                    <View style={styles.volumeBarContainer}>
                      {[...Array(10)].map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.volumeBar,
                            i < Math.floor(soundVolume * 10) && styles.volumeBarActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
                <Volume2 size={16} color="#FFFFFF" />
              </View>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowSoundPicker(true)}
              testID="sound-button"
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
              onPress={() => {
                if (selectedSound) {
                  if (soundRef.current) {
                    soundRef.current.unloadAsync();
                  }
                  setSelectedSound(null);
                }
              }}
              disabled={!selectedSound}
              testID="clear-sound-button"
            >
              <X size={24} color={selectedSound ? "#FFFFFF" : "#FFFFFF50"} />
            </TouchableOpacity>
          </View>

          {/* Sound Picker Modal */}
          <Modal
            visible={showSoundPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSoundPicker(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {lang === "zh" ? "選擇背景音效" : "Choose Background Sound"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                    <X size={24} color="#1E293B" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.soundList}>
                  {SOUND_EFFECTS.map((sound) => (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.soundItem,
                        selectedSound === sound.id && styles.soundItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                    >
                      <Text style={styles.soundIcon}>{sound.icon}</Text>
                      <Text style={styles.soundName}>
                        {lang === "zh" ? sound.nameZh : sound.name}
                      </Text>
                      {selectedSound === sound.id && (
                        <View style={styles.selectedBadge} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
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
  sessionNarrator: {
    fontSize: 16,
    color: "#E0E7FF",
    marginBottom: 40,
  },
  breathingContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  breathingCircle: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
  soundControlContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  soundLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center" as const,
  },
  soundVolumeControl: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  sliderWrapper: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  volumeBarContainer: {
    flexDirection: "row" as const,
    gap: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  volumeBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  volumeBarActive: {
    backgroundColor: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end" as const,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "70%" as any,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1E293B",
  },
  soundList: {
    paddingHorizontal: 20,
  },
  soundItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  soundItemSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F3E8FF",
  },
  soundIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  soundName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E293B",
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
  },
});