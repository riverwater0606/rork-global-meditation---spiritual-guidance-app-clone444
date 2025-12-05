import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  PanResponder,
  Platform,
  Animated,
  LayoutRectangle,
  useWindowDimensions,
} from "react-native";
import * as THREE from "three";
import { Svg, Circle } from "react-native-svg";
import Modal from "react-native-modal";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import type { RootState } from "@react-three/fiber";
import {
  useMeditation,
  CHAKRA_COLORS,
  OrbStage,
  Orb,
} from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import {
  Send,
  RotateCcw,
  Plus,
  Zap,
  Star,
  Gift,
  Merge,
  Sparkles,
  Compass,
  Activity,
  PlayCircle,
} from "lucide-react-native";
import { CanvasComponent, useFrame } from "@/components/orb/FiberBridge";

const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";
const INFUSION_AUDIO = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_b5d0c49038.mp3?filename=healing-ambient-9801.mp3";

interface StageVisualConfig {
  coreColor: string;
  haloColor: string;
  nebulaColor: string;
  particleCount: number;
  sacredDetail: number;
  auraGradient: [string, string];
  shardBoost: number;
}

const STAGE_VISUALS: Record<OrbStage, StageVisualConfig> = {
  seed: {
    coreColor: "#FF6B6B",
    haloColor: "#FDE68A",
    nebulaColor: "#FFEDD5",
    particleCount: 2400,
    sacredDetail: 0,
    auraGradient: ["#050307", "#1b0b2a"],
    shardBoost: 6,
  },
  radiant: {
    coreColor: "#FACC15",
    haloColor: "#FDD835",
    nebulaColor: "#FFE680",
    particleCount: 3200,
    sacredDetail: 1,
    auraGradient: ["#050307", "#062637"],
    shardBoost: 8,
  },
  legendary: {
    coreColor: "#C77DFF",
    haloColor: "#7C3AED",
    nebulaColor: "#D8B4FE",
    particleCount: 4200,
    sacredDetail: 2,
    auraGradient: ["#050307", "#0b1c33"],
    shardBoost: 10,
  },
  eternal: {
    coreColor: "#F472B6",
    haloColor: "#FDE1FF",
    nebulaColor: "#FFF8E1",
    particleCount: 5200,
    sacredDetail: 3,
    auraGradient: ["#050307", "#04060f"],
    shardBoost: 12,
  },
};

const STAGE_MILESTONES: Record<OrbStage, { label: string; description: string; min: number; next?: number }> = {
  seed: { label: "Seed", description: "Igniting first spark", min: 0, next: 21 },
  radiant: { label: "Awakened", description: "Auric bloom", min: 21, next: 49 },
  legendary: { label: "Legendary", description: "Mythic resonance", min: 49, next: 108 },
  eternal: { label: "Eternal", description: "World Chain icon", min: 108, next: 144 },
};

interface ContactOption {
  id: string;
  name: string;
  address: string;
  blessing: string;
}

const CONTACTS: ContactOption[] = [
  { id: "world-ally", name: "Aman · World ID", address: "0x8fa...1b0", blessing: "願你日日光明" },
  { id: "guardian", name: "Lena · Guardian", address: "0x2c4...88d", blessing: "巡守於光" },
  { id: "sage", name: "Kai · Sage", address: "0x9f1...ab3", blessing: "願心無所住" },
];

const useCosmicPulse = () => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(value, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ]),
    ).start();
  }, [value]);
  return value;
};

const EnergyInfusionOverlay = ({ trigger }: { trigger?: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) {
      return;
    }
    opacity.setValue(0.9);
    Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }).start();
  }, [trigger, opacity]);
  return <Animated.View pointerEvents="none" style={[styles.infusionOverlay, { opacity }]} />;
};

const ProgressRing = ({ progress }: { progress: number }) => {
  const size = 88;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;
  return (
    <Svg width={size} height={size} style={styles.progressSvg}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="transparent" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#FACC15"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
      />
    </Svg>
  );
};

const isPointInside = (x: number, y: number, zone?: LayoutRectangle | null) => {
  if (!zone) {
    return false;
  }
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
};

const CrystalOrb = ({
  layers,
  stage,
  interactionState,
}: {
  layers: string[];
  stage: OrbStage;
  interactionState: React.MutableRefObject<{ mode: string; spinVelocity: number; orbitTilt: { x: number; y: number } }>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const sacredRef = useRef<THREE.LineSegments>(null);
  const config = STAGE_VISUALS[stage];

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.95, config.sacredDetail), [config.sacredDetail]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, config.sacredDetail + 1)), [config.sacredDetail]);
  const haloGeometry = useMemo(
    () => new THREE.SphereGeometry(stage === "eternal" ? 1.45 : 1.3, 64, 64),
    [stage],
  );
  const colorStops = layers.length ? layers[layers.length - 1] : config.coreColor;
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: colorStops,
        metalness: 0.8,
        roughness: 0.2,
        transmission: 0.8,
        thickness: 1,
        clearcoat: 0.6,
        envMapIntensity: 1.2,
      }),
    [colorStops],
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: config.haloColor,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      }),
    [config.haloColor],
  );
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#FFFFFF",
        transparent: true,
        opacity: 0.4,
      }),
    [],
  );

  useFrame((state: RootState) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003 + interactionState.current.spinVelocity * 0.5;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        interactionState.current.orbitTilt.y * 0.2,
        0.1,
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        interactionState.current.orbitTilt.x * 0.2,
        0.1,
      );
    }
    if (haloRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      haloRef.current.scale.setScalar(pulse + (stage === "eternal" ? 0.2 : 0));
    }
    if (sacredRef.current) {
      sacredRef.current.rotation.y += 0.002;
    }
  });

  return React.createElement(
    "group",
    null,
    React.createElement("mesh", { ref: meshRef, geometry, material: coreMaterial }),
    React.createElement("mesh", { ref: haloRef, geometry: haloGeometry, material: haloMaterial }),
    React.createElement("lineSegments", { ref: sacredRef, geometry: edges, material: lineMaterial }),
    React.createElement(NebulaParticles, { stage, layers }),
    React.createElement(StarField, null),
  );
};

const NebulaParticles = ({ stage, layers }: { stage: OrbStage; layers: string[] }) => {
  const points = useRef<THREE.Points>(null);
  const config = STAGE_VISUALS[stage];

  const data = useMemo(() => {
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorRefs = layers.length ? layers.map((hex) => new THREE.Color(hex)) : [new THREE.Color(config.nebulaColor)];

    for (let i = 0; i < count; i += 1) {
      const radius = 1.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const color = colorRefs[i % colorRefs.length];
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [config, layers]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(data.colors, 3));
    return geo;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.012 + STAGE_VISUALS[stage].particleCount / 200000,
        transparent: true,
        opacity: 0.7 + STAGE_VISUALS[stage].particleCount / 10000,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      }),
    [stage],
  );

  useFrame((state: RootState) => {
    if (!points.current) {
      return;
    }
    points.current.rotation.y += 0.0008;
    const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    points.current.scale.setScalar(pulse);
  });

  return React.createElement("points", { ref: points, geometry, material });
};

const StarField = () => {
  const points = useRef<THREE.Points>(null);

  const data = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(data, 3));
    return geo;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.01,
        color: "#FFFFFF",
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state: RootState) => {
    if (!points.current) {
      return;
    }
    points.current.rotation.y += 0.0002;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    points.current.scale.setScalar(breathe);
  });

  return React.createElement("points", { ref: points, geometry, material });
};

const FallbackOrb = ({ stage, layers }: { stage: OrbStage; layers: string[] }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ]),
    ).start();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });
  const shadow = pulse.interpolate({ inputRange: [0, 1], outputRange: [20, 60] });
  const gradient = STAGE_VISUALS[stage].auraGradient;
  return (
    <Animated.View
      style={[styles.fallbackOrb, { transform: [{ scale }], shadowRadius: shadow, shadowColor: STAGE_VISUALS[stage].haloColor }]}
      testID="fallback-orb"
    >
      <View style={[styles.fallbackGlow, { backgroundColor: gradient[0] }]} />
      <View style={[styles.fallbackGlowSecondary, { backgroundColor: gradient[1] }]} />
      <Text style={styles.fallbackGlyph}>{layers.length ? "✦" : "•"}</Text>
    </Animated.View>
  );
};

const FragmentShard = ({
  index,
  dropZone,
  onFuse,
}: {
  index: number;
  dropZone: LayoutRectangle | null;
  onFuse: () => void;
}) => {
  const translate = useRef(new Animated.ValueXY()).current;
  const [active, setActive] = useState(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setActive(true);
          translate.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: translate.x, dy: translate.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          setActive(false);
          translate.setValue({ x: 0, y: 0 });
          if (isPointInside(gesture.moveX, gesture.moveY, dropZone)) {
            onFuse();
          }
        },
      }),
    [dropZone, translate, onFuse],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.fragmentChip, active && styles.fragmentChipActive, { transform: translate.getTranslateTransform() }]}
      testID={`orb-fragment-${index}`}
    >
      <Merge size={16} color="#FFFFFF" />
      <Text style={styles.fragmentChipText}>Shard {index + 1}</Text>
    </Animated.View>
  );
};

const ContactModal = ({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: ContactOption) => void;
}) => (
  <Modal isVisible={visible} onBackdropPress={onClose} onBackButtonPress={onClose} backdropOpacity={0.6}>
    <View style={styles.contactModal}>
      <Text style={styles.modalTitle}>Choose Recipient</Text>
      <ScrollView>
        {CONTACTS.map((contact) => (
          <TouchableOpacity key={contact.id} style={styles.contactRow} onPress={() => onSelect(contact)}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>{contact.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactSubtitle}>{contact.blessing}</Text>
            </View>
            <Compass color="#fff" size={18} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#1F2937" }]} onPress={onClose}>
        <Text style={styles.modalButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const HistoryModal = ({
  orb,
  onClose,
  replay,
}: {
  orb: Orb | null;
  onClose: () => void;
  replay: () => void;
}) => (
  <Modal isVisible={!!orb} onBackdropPress={onClose} onBackButtonPress={onClose} backdropOpacity={0.8}>
    <View style={styles.historyModal}>
      <Text style={styles.modalTitle}>Orb Blessing</Text>
      {orb && (
        <>
          <Text style={styles.historySender}>{orb.sender || "Friend"}</Text>
          <Text style={styles.historyDate}>{new Date(orb.createdAt).toLocaleString()}</Text>
          <Text style={styles.historyMessage}>{orb.message || "Silent light"}</Text>
          <View style={styles.historyBadgeRow}>
            <View style={styles.historyBadge}>
              <Sparkles size={16} color="#FACC15" />
              <Text style={styles.historyBadgeText}>{orb.stage.toUpperCase()}</Text>
            </View>
            <View style={styles.historyBadge}>
              <Activity size={16} color="#38BDF8" />
              <Text style={styles.historyBadgeText}>{orb.layers.length} layers</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#2563EB" }]} onPress={replay}>
            <PlayCircle size={18} color="white" />
            <Text style={styles.modalButtonText}>Replay Transmission</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  </Modal>
);

const GardenScreen = () => {
  const { settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, boostOrbProgress, updateOrbState } = useMeditation();
  const { walletAddress } = useUser();

  const [showDevMenu, setShowDevMenu] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [selectedHistoryOrb, setSelectedHistoryOrb] = useState<Orb | null>(null);
  const [fusionHint, setFusionHint] = useState<string | null>(null);

  const cosmicPulse = useCosmicPulse();
  const infusionSound = useRef<Audio.Sound | null>(null);
  const windowSize = useWindowDimensions();

  useEffect(() => {
    return () => {
      if (infusionSound.current) {
        infusionSound.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const play = async () => {
      if (!currentOrb.lastInfusionAt) {
        return;
      }
      try {
        if (!infusionSound.current) {
          const sound = await Audio.Sound.createAsync({ uri: INFUSION_AUDIO });
          infusionSound.current = sound.sound;
        }
        await infusionSound.current.replayAsync();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log("infusion audio error", error);
      }
    };
    play();
  }, [currentOrb.lastInfusionAt]);

  const interactionState = useRef({ mode: "idle", spinVelocity: 0, orbitTilt: { x: 0, y: 0 } });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropZone, setDropZone] = useState<LayoutRectangle | null>(null);
  const orbAreaRef = useRef<View>(null);
  const segmentRef = useRef(currentOrb.energySegments ?? 0);
  const [segmentToast, setSegmentToast] = useState<string | null>(null);

  const stageMeta = STAGE_MILESTONES[currentOrb.stage];
  const nextTarget = stageMeta.next ?? currentOrb.milestoneTarget;
  const stageSpan = Math.max(1, nextTarget - stageMeta.min);
  const milestoneProgress = Math.min(1, (currentOrb.progressMinutes - stageMeta.min) / stageSpan);
  const minutesRemaining = Math.max(0, nextTarget - currentOrb.progressMinutes);

  useEffect(() => {
    if ((currentOrb.energySegments ?? 0) > segmentRef.current) {
      segmentRef.current = currentOrb.energySegments ?? 0;
      setSegmentToast(settings.language === "zh" ? "能量 +10 分鐘" : "+10 minute surge");
      setTimeout(() => setSegmentToast(null), 2000);
    }
  }, [currentOrb.energySegments, settings.language]);

  useEffect(() => {
    if (!orbAreaRef.current) {
      return;
    }
    const measure = () => {
      orbAreaRef.current?.measureInWindow((x, y, width, height) => {
        setDropZone({ x, y, width, height });
      });
    };
    const timeout = setTimeout(measure, 200);
    return () => clearTimeout(timeout);
  }, [windowSize.width, windowSize.height]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        interactionState.current.mode = "gather";
        longPressTimer.current = setTimeout(() => {
          if (walletAddress?.toLowerCase() === DEV_WALLET.toLowerCase()) {
            setShowDevMenu(true);
          }
        }, 5000);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      },
      onPanResponderMove: (_, gesture) => {
        interactionState.current.spinVelocity = gesture.vx * 0.03;
        interactionState.current.orbitTilt = {
          x: THREE.MathUtils.clamp(gesture.dx / 200, -1, 1),
          y: THREE.MathUtils.clamp(-gesture.dy / 200, -1, 1),
        };
        if (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10) {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
      },
      onPanResponderRelease: () => {
        interactionState.current.mode = "explode";
        interactionState.current.spinVelocity = 0;
        interactionState.current.orbitTilt = { x: 0, y: 0 };
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setTimeout(() => {
          interactionState.current.mode = "idle";
        }, 600);
      },
    }),
  ).current;

  const shardsArray = useMemo(() => Array.from({ length: Math.min(currentOrb.fragments, 5) }, (_, idx) => idx), [currentOrb.fragments]);

  const handleFuse = async () => {
    if (currentOrb.fragments <= 0) {
      return;
    }
    const boost = STAGE_VISUALS[currentOrb.stage].shardBoost;
    await boostOrbProgress(boost, 1);
    setFusionHint(settings.language === "zh" ? `融合 +${boost} 分鐘` : `Fusion +${boost} min`);
    setTimeout(() => setFusionHint(null), 1800);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleSend = async (contact: ContactOption) => {
    setSendModal(false);
    try {
      await sendOrb(contact.name, contact.blessing, contact.address);
      Alert.alert(settings.language === "zh" ? "已贈送" : "Sent", settings.language === "zh" ? "光球已傳遞" : "Orb transferred");
    } catch (error) {
      console.log("send orb fail", error);
    }
  };

  const handleDevAction = async (action: string) => {
    setShowDevMenu(false);
    switch (action) {
      case "add_layer": {
        await boostOrbProgress(5, 0);
        break;
      }
      case "instant_awakened": {
        await updateOrbState({
          ...currentOrb,
          progressMinutes: 30,
          milestoneTarget: 49,
          stage: "radiant",
          layers: CHAKRA_COLORS,
          level: CHAKRA_COLORS.length,
          fragments: 3,
          brightness: 0.8,
          isAwakened: true,
        });
        break;
      }
      case "instant_legendary": {
        await updateOrbState({
          ...currentOrb,
          progressMinutes: 60,
          milestoneTarget: 108,
          stage: "legendary",
          layers: CHAKRA_COLORS,
          level: CHAKRA_COLORS.length,
          fragments: 5,
          brightness: 0.9,
          isAwakened: true,
        });
        break;
      }
      case "instant_eternal": {
        await updateOrbState({
          ...currentOrb,
          progressMinutes: 120,
          milestoneTarget: 144,
          stage: "eternal",
          layers: CHAKRA_COLORS,
          level: CHAKRA_COLORS.length,
          fragments: 7,
          brightness: 1,
          isAwakened: true,
        });
        break;
      }
      case "send_self": {
        await sendOrb("Dev Copy", "Debug blessing", walletAddress ?? "0xdev");
        break;
      }
      case "reset": {
        await updateOrbState({
          ...currentOrb,
          progressMinutes: 0,
          milestoneTarget: 21,
          stage: "seed",
          layers: [],
          level: 0,
          fragments: 0,
          brightness: 0.5,
          isAwakened: false,
          lastInfusionAt: undefined,
        });
        break;
      }
    }
  };

  const shouldUse3D = Platform.OS !== "web";

  const headerTitle = settings.language === "zh" ? "光球花園" : "Light Orb Garden";

  const handleReplay = () => {
    setFusionHint(settings.language === "zh" ? "重播傳送" : "Transmission replay");
    setTimeout(() => setFusionHint(null), 1500);
  };

  return (
    <View style={styles.screen} testID="light-orb-garden-screen">
      <Animated.View
        style={[
          styles.cosmicBackdrop,
          {
            backgroundColor: cosmicPulse.interpolate({
              inputRange: [0, 1],
              outputRange: STAGE_VISUALS[currentOrb.stage].auraGradient,
            }) as unknown as string,
          },
        ]}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>
            {stageMeta.label} • {currentOrb.layers.length}/7 layers
          </Text>
        </View>
        <ProgressRing progress={milestoneProgress} />
      </View>

      <View
        ref={orbAreaRef}
        style={styles.sceneContainer}
        {...panResponder.panHandlers}
        testID="orb-scene"
        onLayout={() => {
          orbAreaRef.current?.measureInWindow((x, y, width, height) => setDropZone({ x, y, width, height }));
        }}
      >
        {shouldUse3D && CanvasComponent ? (
          <CanvasComponent camera={{ position: [0, 0, 4] }}>
            {React.createElement("ambientLight", { intensity: 0.4 })}
            {React.createElement("directionalLight", { position: [3, 3, 2], intensity: 1.2 })}
            <CrystalOrb layers={currentOrb.layers} stage={currentOrb.stage} interactionState={interactionState} />
          </CanvasComponent>
        ) : (
          <FallbackOrb stage={currentOrb.stage} layers={currentOrb.layers} />
        )}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {settings.language === "zh"
              ? "長按聚光 • 放手綻放 • 雙指合十祈願"
              : "Hold to gather • Release to bloom • Two-finger prayer"}
          </Text>
        </View>
        <EnergyInfusionOverlay trigger={currentOrb.lastInfusionAt} />
      </View>

      <View style={styles.progressPanel}>
        <View>
          <Text style={styles.progressLabel}>{settings.language === "zh" ? "下一里程" : "Next milestone"}</Text>
          <Text style={styles.progressValue}>
            {minutesRemaining <= 0
              ? settings.language === "zh" ? "已達成" : "Reached"
              : `${minutesRemaining} min`}
          </Text>
        </View>
        <View>
          <Text style={styles.progressLabel}>{settings.language === "zh" ? "階段" : "Phase"}</Text>
          <Text style={styles.progressValue}>{stageMeta.description}</Text>
        </View>
        <View>
          <Text style={styles.progressLabel}>{settings.language === "zh" ? "碎片" : "Shards"}</Text>
          <Text style={styles.progressValue}>{currentOrb.fragments}</Text>
        </View>
      </View>

      {segmentToast && (
        <View style={styles.segmentToast}>
          <Sparkles size={16} color="#FACC15" />
          <Text style={styles.segmentToastText}>{segmentToast}</Text>
        </View>
      )}

      <View style={styles.fusionRow}>
        <Text style={styles.sectionTitle}>{settings.language === "zh" ? "拖曳合成" : "Drag to fuse"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {shardsArray.length === 0 ? (
            <Text style={styles.emptyShards}>{settings.language === "zh" ? "完成 10 分鐘獲得碎片" : "Earn shards every 10 minutes"}</Text>
          ) : (
            shardsArray.map((index) => (
              <FragmentShard key={index} index={index} dropZone={dropZone} onFuse={handleFuse} />
            ))
          )}
        </ScrollView>
      </View>

      {fusionHint && (
        <View style={styles.fusionHint}>
          <Text style={styles.fusionHintText}>{fusionHint}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setSendModal(true)} testID="orb-send-button">
          <Send color="white" size={18} />
          <Text style={styles.buttonText}>{settings.language === "zh" ? "贈送" : "Send"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleFuse}>
          <Merge color="#FACC15" size={18} />
          <Text style={styles.secondaryText}>{settings.language === "zh" ? "快速融合" : "Quick fuse"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.collectionContainer}>
        <Text style={styles.sectionTitle}>{settings.language === "zh" ? "收藏球" : "Received orbs"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {orbHistory.length === 0 ? (
            <Text style={styles.emptyCollection}>{settings.language === "zh" ? "尚未收到光球" : "No gifts yet"}</Text>
          ) : (
            orbHistory.map((orb) => (
              <TouchableOpacity key={orb.id} style={[styles.orbCard, { borderColor: orb.layers[orb.layers.length - 1] ?? "#fff" }]} onPress={() => setSelectedHistoryOrb(orb)}>
                <View style={[styles.orbSwatch, { backgroundColor: orb.layers[orb.layers.length - 1] ?? "#fff" }]} />
                <Text style={styles.orbCardTitle}>{orb.sender || "Friend"}</Text>
                <Text style={styles.orbCardSubtitle}>{new Date(orb.createdAt).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <Modal isVisible={showDevMenu} onBackdropPress={() => setShowDevMenu(false)} onBackButtonPress={() => setShowDevMenu(false)}>
        <View style={styles.devMenu}>
          <Text style={styles.modalTitle}>Dev Controls</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("add_layer")}>
              <Plus size={16} color="#fff" />
              <Text style={styles.devText}>Dev: +1 layer boost</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("instant_awakened")}>
              <Zap size={16} color="#FBBF24" />
              <Text style={styles.devText}>Dev: Awakened</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("instant_legendary")}>
              <Star size={16} color="#C084FC" />
              <Text style={styles.devText}>Dev: Legendary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("instant_eternal")}>
              <Star size={16} color="#EC4899" />
              <Text style={styles.devText}>Dev: Eternal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("send_self")}>
              <Gift size={16} color="#fff" />
              <Text style={styles.devText}>Dev: Send to self</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.devRow} onPress={() => handleDevAction("reset")}>
              <RotateCcw size={16} color="#fff" />
              <Text style={styles.devText}>Dev: Reset orb</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <ContactModal visible={sendModal} onClose={() => setSendModal(false)} onSelect={handleSend} />
      <HistoryModal orb={selectedHistoryOrb} onClose={() => setSelectedHistoryOrb(null)} replay={handleReplay} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#01030A",
  },
  cosmicBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    color: "white",
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
    fontSize: 16,
  },
  progressSvg: {
    transform: [{ rotate: "-90deg" }],
  },
  sceneContainer: {
    margin: 20,
    borderRadius: 28,
    overflow: "hidden",
    height: 360,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  instructions: {
    position: "absolute",
    bottom: 18,
    width: "100%",
    alignItems: "center",
  },
  instructionText: {
    color: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    fontSize: 13,
  },
  progressPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  progressLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 4,
  },
  progressValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  fusionRow: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  fragmentChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  fragmentChipActive: {
    backgroundColor: "rgba(250,204,21,0.2)",
  },
  fragmentChipText: {
    color: "white",
    fontSize: 14,
    marginLeft: 8,
  },
  emptyShards: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
  fusionHint: {
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: "rgba(250,204,21,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  fusionHintText: {
    color: "#FACC15",
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    color: "#FACC15",
    fontSize: 16,
    fontWeight: "600",
  },
  collectionContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  emptyCollection: {
    color: "rgba(255,255,255,0.5)",
  },
  orbCard: {
    width: 120,
    padding: 14,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  orbSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  orbCardTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  orbCardSubtitle: {
    color: "rgba(255,255,255,0.6)",
  },
  devMenu: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  devText: {
    color: "white",
    fontSize: 16,
  },
  contactModal: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: {
    color: "white",
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  contactSubtitle: {
    color: "rgba(255,255,255,0.6)",
  },
  modalButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  historyModal: {
    backgroundColor: "#0b1120",
    padding: 24,
    borderRadius: 28,
  },
  historySender: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  historyDate: {
    color: "rgba(255,255,255,0.6)",
    marginVertical: 6,
  },
  historyMessage: {
    color: "white",
    fontSize: 16,
    marginBottom: 16,
  },
  historyBadgeRow: {
    flexDirection: "row",
    gap: 10,
  },
  historyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  historyBadgeText: {
    color: "white",
    fontSize: 12,
  },
  fallbackOrb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  fallbackGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.2,
  },
  fallbackGlowSecondary: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.1,
  },
  fallbackGlyph: {
    color: "white",
    fontSize: 48,
  },
  infusionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(244,114,182,0.18)",
  },
  segmentToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: "rgba(250,204,21,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentToastText: {
    color: "#FACC15",
    fontWeight: "600",
  },
});

export default GardenScreen;
