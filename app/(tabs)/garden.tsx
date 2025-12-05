import React, { useState, useEffect, useCallback, Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas } from "@/lib/r3f";
import { useMeditation, CHAKRA_COLORS, type Orb } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Plus, Zap, Star, Gift, RotateCcw, X } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import Modal from "react-native-modal";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { Gyroscope, type GyroscopeMeasurement } from "expo-sensors";
import { BlurView } from "expo-blur";
import { GardenScene } from "@/components/garden/GardenScene";

const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";
type InteractionMode = "idle" | "gather" | "charge";
type DevAction = "add_10_min" | "instant_awakened" | "instant_legendary" | "instant_eternal" | "send_self" | "reset";

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  onFailure: (error: Error) => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log("[Garden] Canvas crashed", error, errorInfo);
    this.props.onFailure(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, updateOrbState, updateOrbHistory, mergeOrb } = useMeditation();
  const { walletAddress } = useUser();
  const [showDevMenu, setShowDevMenu] = useState<boolean>(false);
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<string>("");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("idle");
  const [gyroData, setGyroData] = useState<GyroscopeMeasurement>({ x: 0, y: 0, z: 0, timestamp: Date.now() });
  const [canvasFailed, setCanvasFailed] = useState<boolean>(false);
  const isWeb = Platform.OS === "web";
  const shouldUseGyroscope = !isWeb;

  useEffect(() => {
    if (!shouldUseGyroscope) {
      console.log("[Garden] Gyroscope disabled on web");
      return;
    }
    let subscription: ReturnType<typeof Gyroscope.addListener> | null = null;
    try {
      Gyroscope.setUpdateInterval(16);
      subscription = Gyroscope.addListener((data: GyroscopeMeasurement) => {
        setGyroData(data);
      });
      console.log("[Garden] Gyroscope listener attached");
    } catch (error) {
      console.log("[Garden] Gyroscope listener error", error);
      setGyroData({ x: 0, y: 0, z: 0, timestamp: Date.now() });
    }
    return () => {
      subscription?.remove?.();
    };
  }, [shouldUseGyroscope]);

  const handleCanvasFailure = useCallback((error: Error) => {
    console.log("[Garden] Falling back to 2D backdrop", error);
    setCanvasFailed(true);
  }, []);

  const handleDevAction = useCallback(async (action: DevAction) => {
    setShowDevMenu(false);
    console.log("[Garden] Dev action", action);
    switch (action) {
      case "add_10_min": {
        const minutes = (currentOrb.accumulatedMinutes || 0) + 10;
        let status: Orb["status"] = currentOrb.status;
        if (minutes >= 108) {
          status = "eternal";
        } else if (minutes >= 49) {
          status = "legendary";
        } else if (minutes >= 21) {
          status = "awakened";
        }
        const newLayers = [...currentOrb.layers];
        if (newLayers.length < 7 && minutes % 10 === 0) {
          newLayers.push(CHAKRA_COLORS[newLayers.length % 7]);
        }
        await updateOrbState({
          ...currentOrb,
          accumulatedMinutes: minutes,
          status,
          layers: newLayers,
        });
        break;
      }
      case "instant_awakened": {
        await updateOrbState({
          ...currentOrb,
          level: 3,
          accumulatedMinutes: 21,
          status: "awakened",
          layers: CHAKRA_COLORS.slice(0, 3),
        });
        break;
      }
      case "instant_legendary": {
        await updateOrbState({
          ...currentOrb,
          level: 5,
          accumulatedMinutes: 49,
          status: "legendary",
          layers: CHAKRA_COLORS.slice(0, 5),
        });
        break;
      }
      case "instant_eternal": {
        await updateOrbState({
          ...currentOrb,
          level: 7,
          accumulatedMinutes: 108,
          status: "eternal",
          layers: CHAKRA_COLORS,
        });
        break;
      }
      case "send_self": {
        const mockOrb: Orb = {
          ...currentOrb,
          id: `orb-mock-${Date.now()}`,
          sender: "Me (Dev)",
          message: "From the void.",
          createdAt: new Date().toISOString(),
          accumulatedMinutes: 30,
          status: "awakened",
        };
        await updateOrbHistory([mockOrb, ...orbHistory]);
        break;
      }
      case "reset": {
        const freshOrb: Orb = {
          id: `orb-${Date.now()}`,
          level: 0,
          accumulatedMinutes: 0,
          status: "seed",
          layers: [],
          createdAt: new Date().toISOString(),
        };
        await updateOrbState(freshOrb);
        break;
      }
      default:
        break;
    }
  }, [currentOrb, orbHistory, updateOrbHistory, updateOrbState]);

  const handleSendOrb = useCallback(() => {
    if ((currentOrb.accumulatedMinutes || 0) < 21) {
      Alert.alert(
        settings.language === "zh" ? "能量不足" : "Not Enough Energy",
        settings.language === "zh" ? "需積累 21 分鐘能量才能喚醒光球。" : "Need 21 minutes of accumulated energy to awaken the orb."
      );
      return;
    }
    setShowSendModal(true);
  }, [currentOrb.accumulatedMinutes, settings.language]);

  const handleSendConfirm = useCallback(async () => {
    setShowSendModal(false);
    try {
      if (MiniKit && MiniKit.isInstalled()) {
        await MiniKit.commands.transferNft({
          collectionAddress: "0x1234567890123456789012345678901234567890",
          tokenId: "1",
          recipient: recipient || "0x000",
        });
      }
    } catch (error) {
      console.log("[Garden] MiniKit transfer fallback", error);
    }
    await sendOrb(recipient || "friend", "May light guide you.");
    Alert.alert("Sent!", "Your orb is on its way.");
    setRecipient("");
  }, [recipient, sendOrb]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(5000)
    .onStart(() => {
      if (walletAddress === DEV_WALLET) {
        runOnJS(setShowDevMenu)(true);
      }
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      runOnJS(setInteractionMode)("gather");
    })
    .onFinalize(() => {
      runOnJS(setInteractionMode)("idle");
    });

  const composedGestures = Gesture.Simultaneous(longPressGesture, tapGesture);

  function runOnJS<T extends (...args: any[]) => void>(fn: T) {
    return (...args: Parameters<T>) => fn(...args);
  }

  const mins = currentOrb.accumulatedMinutes || 0;
  let nextMilestone = 21;
  let prevMilestone = 0;
  let statusLabel = "Seed";

  if (mins >= 108) {
    nextMilestone = 9999;
    prevMilestone = 108;
    statusLabel = "Eternal";
  } else if (mins >= 49) {
    nextMilestone = 108;
    prevMilestone = 49;
    statusLabel = "Legendary";
  } else if (mins >= 21) {
    nextMilestone = 49;
    prevMilestone = 21;
    statusLabel = "Awakened";
  }

  const progressPercent = Math.min(100, Math.max(0, ((mins - prevMilestone) / (nextMilestone - prevMilestone)) * 100));
  const currentLayerIndex = (currentOrb.level ?? currentOrb.layers.length ?? 0) % CHAKRA_COLORS.length;
  const progressColor = CHAKRA_COLORS[currentLayerIndex] ?? "#FFFFFF";
  const shouldRender3D = !isWeb && !canvasFailed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={StyleSheet.absoluteFill}>
          {shouldRender3D ? (
            <CanvasErrorBoundary onFailure={handleCanvasFailure}>
              <Canvas style={{ flex: 1 }}>
                <GardenScene
                  orb={currentOrb}
                  collectedOrbs={orbHistory}
                  gyro={gyroData}
                  interactionMode={interactionMode}
                  onMerge={mergeOrb}
                />
              </Canvas>
            </CanvasErrorBoundary>
          ) : (
            <WebGardenBackdrop orb={currentOrb} interactionMode={interactionMode} />
          )}
        </View>

        <GestureDetector gesture={composedGestures}>
          <View style={styles.touchLayer} testID="garden-gesture-layer" />
        </GestureDetector>

        <View style={styles.header}>
          <BlurView intensity={20} style={styles.blurHeader}>
            <Text style={[styles.title, { color: "#FFF" }]}>
              {settings.language === "zh" ? "光球花園" : "Light Orb Garden"}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </BlurView>
        </View>

        <View style={styles.footer}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {mins} / {nextMilestone === 9999 ? "∞" : nextMilestone} min
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: progressColor }]} />
            </View>
            <Text style={styles.progressSub}>
              {settings.language === "zh" ? "距離下一階段" : "To next evolution"}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendOrb} testID="gift-orb-button">
              <Send color="#000" size={24} />
              <Text style={styles.sendButtonText}>
                {settings.language === "zh" ? "贈送" : "Gift"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.collectionContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionContent}>
            {orbHistory.map((orb) => (
              <TouchableOpacity key={orb.id} style={styles.miniOrb}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: orb.layers[orb.layers.length - 1] || "#FFF",
                    opacity: 0.8,
                  }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Modal isVisible={showDevMenu} onBackdropPress={() => setShowDevMenu(false)}>
          <View style={[styles.devMenu, { backgroundColor: currentTheme.surface }]}
            testID="dev-menu">
            <Text style={[styles.devTitle, { color: currentTheme.text }]}>Dev Access</Text>
            <ScrollView>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("add_10_min")} testID="dev-action-add-10">
                <Plus size={20} color={currentTheme.text} />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>+10 Minutes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("instant_awakened")} testID="dev-action-awakened">
                <Zap size={20} color="#F59E0B" />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Awakened</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("instant_legendary")} testID="dev-action-legendary">
                <Star size={20} color="#8B5CF6" />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Legendary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("instant_eternal")} testID="dev-action-eternal">
                <Star size={20} color="#EC4899" />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Eternal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("send_self")} testID="dev-action-send-self">
                <Gift size={20} color={currentTheme.text} />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Send Mock Orb to Me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction("reset")} testID="dev-action-reset">
                <RotateCcw size={20} color={currentTheme.text} />
                <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        <Modal isVisible={showSendModal} onBackdropPress={() => setShowSendModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.surface }]}
            testID="send-orb-modal">
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                {settings.language === "zh" ? "贈送光球" : "Send Orb"}
              </Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <X color={currentTheme.text} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
              {settings.language === "zh" ? "輸入朋友的 World ID 或名字" : "Enter friend's World ID or name"}
            </Text>

            <TextInput
              style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
              placeholder="0x..."
              placeholderTextColor={currentTheme.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
              testID="recipient-input"
            />

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: currentTheme.primary }]}
              onPress={handleSendConfirm}
              testID="confirm-send-orb"
            >
              <Text style={styles.confirmButtonText}>
                {settings.language === "zh" ? "確認發送" : "Send Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchLayer: {
    flex: 1,
    zIndex: 10,
  },
  header: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  blurHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(20,20,30,0.4)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 20,
    alignItems: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  progressText: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    opacity: 0.8,
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 4,
  },
  controls: {
    flexDirection: "row",
    gap: 20,
  },
  sendButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  sendButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  collectionContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 20,
  },
  collectionContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  miniOrb: {
    padding: 5,
  },
  devMenu: {
    padding: 20,
    borderRadius: 16,
  },
  devTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  devOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  devOptionText: {
    fontSize: 16,
  },
  modalContent: {
    padding: 24,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  webOrbContainer: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: "center",
    alignItems: "center",
  },
  webOrbRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  webOrbCore: {
    width: 150,
    height: 150,
    borderRadius: 75,
    shadowColor: "#FFF",
    shadowOpacity: 0.6,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 8 },
  },
});

function WebGardenBackdrop({ orb, interactionMode }: { orb: Orb; interactionMode: InteractionMode }) {
  const layers = orb.layers.length > 0 ? orb.layers : ["#8B5CF6"];
  const baseScale = interactionMode === "gather" ? 0.9 : 1;

  return (
    <LinearGradient
      colors={["#020307", "#080B18", "#121F33"]}
      style={styles.webBackdrop}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.webOrbContainer}>
        {layers.map((color, index) => (
          <View
            key={`${color}-${index}`}
            style={[
              styles.webOrbRing,
              {
                borderColor: color,
                opacity: 0.25 + index * 0.1,
                transform: [{ scale: baseScale + index * 0.12 }],
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.webOrbCore,
            {
              backgroundColor: layers[layers.length - 1],
              transform: [{ scale: baseScale }],
            },
          ]}
        />
      </View>
    </LinearGradient>
  );
}
