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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Pause, X, Volume2, VolumeX, Music } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MEDITATION_SESSIONS } from "@/constants/meditations";
import { useMeditation } from "@/providers/MeditationProvider";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";

const { width } = Dimensions.get("window");

const AMBIENT_SOUNDS = [
  { id: "none", name: "None", url: null },
  { id: "tibetan", name: "Tibetan Bowl", url: "https://cdn.freesound.org/previews/270/270156_5123851-lq.mp3" },
  { id: "rain", name: "Rain", url: "https://cdn.freesound.org/previews/523/523537_5674468-lq.mp3" },
  { id: "ocean", name: "Ocean Waves", url: "https://cdn.freesound.org/previews/233/233156_4168150-lq.mp3" },
  { id: "forest", name: "Forest Birds", url: "https://cdn.freesound.org/previews/449/449066_7037284-lq.mp3" },
  { id: "whitenoise", name: "White Noise", url: "https://cdn.freesound.org/previews/334/334236_5121236-lq.mp3" },
  { id: "hz432", name: "432Hz Tone", url: "https://cdn.freesound.org/previews/411/411090_5121236-lq.mp3" },
];

export default function MeditationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const session = MEDITATION_SESSIONS.find(s => s.id === id);
  const { completeMeditation } = useMeditation();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session?.duration ? session.duration * 60 : 600);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState("none");
  const [volume, setVolume] = useState(0.5);
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
    const loadSound = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        const sound = AMBIENT_SOUNDS.find(s => s.id === selectedSound);
        if (sound && sound.url) {
          const { sound: audioSound } = await Audio.Sound.createAsync(
            { uri: sound.url },
            { shouldPlay: isPlaying, isLooping: true, volume }
          );
          soundRef.current = audioSound;
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
    const updateVolume = async () => {
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(volume);
      }
    };
    updateVolume();
  }, [volume]);

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
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionNarrator}>with {session.narrator}</Text>

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
                      {Math.floor(timeRemaining % 8) < 4 ? "Breathe In" : "Breathe Out"}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>

            <Text style={styles.description}>{session.description}</Text>
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
              <Text style={styles.modalTitle}>Ambient Sound</Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
              {AMBIENT_SOUNDS.map((sound) => (
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
                    {sound.name}
                  </Text>
                  {selectedSound === sound.id && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
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
    maxHeight: 300,
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
});
