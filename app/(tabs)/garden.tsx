/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Dimensions, Animated, Easing, TextInput, PanResponder, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, Orb, OrbShape } from "@/providers/MeditationProvider";
import { CHAKRA_COLORS } from "@/constants/chakras";
import { type GiftHistoryEntry } from "@/lib/firebaseGifts";
import { getFirebaseDiagnostics as getFirebaseDiagnosticsFn, getFirebaseMissingEnv, isFirebaseEnabled } from "@/constants/firebase";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { generateMerkabaData, generateEarthData, generateMarsData, generateVenusData, generateJupiterData, generateSaturnData, generateNeptuneData, generateAkashicGalaxyData, generateSoulNebulaData, generateLotusGalaxyData, generateOracleConstellationData, generateAscensionSpiralData, generateFlowerOfLifeData, generateFlowerOfLifeCompleteData, generateTreeOfLifeData, generateGridOfLifeData, generateSriYantraData, generateStarOfDavidData, generateTriquetraData, generateRingTorusData, generateGoldenRectanglesData, generateDoubleHelixDNAData, generateVortexRingData, generateFractalTreeData, generateWaveInterferenceData, generateQuantumOrbitalsData, generateCelticKnotData, generateStarburstNovaData, generateLatticeWaveData, generateSacredFlameData, generateMetatronsCubeData, generateTorusFlowerData, generateLotusMandalaData, generatePhoenixSpiralData, generateVesicaPiscisData, generateCrownChakraData, generateCosmicSerpentData, generatePrismFieldData, generateHaloBloomData, generateInfinityPrayerData, generateSeedOfLifeData, generateEggOfLifeData, generateFruitOfLifeData, generateGoldenSpiralData, generateVectorEquilibriumData, generateCurvedMerkabaData, generateCurvedMetatronData, generateUnicursalHexagramData, generateYinYangFlowData, generateSevenWavesData, generateSnowflakeMandalaData, generateGoldenCirclesData, generateSphereOfCirclesData, generateCaduceusData, generateOctagramStarData, PARTICLE_COUNT } from "@/constants/sacredGeometry";
import { Clock, Zap, Archive, Gift, ArrowUp, ArrowDown, Sparkles, X, Sprout, Maximize2, Minimize2, Music, Volume2, VolumeX } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { ensureMiniKitLoaded, getMiniKit, isMiniKitInstalled } from "@/components/worldcoin/IDKitWeb";
import { MiniKit, ResponseEvent } from "@/constants/minikit";
import { APP_ID } from "@/constants/world";
import * as firebaseDiagnostics from "@/constants/firebase";
import * as Haptics from "expo-haptics";
import { IS_DEV_FULL_MOCK, IS_LOCAL_DEV } from "@/constants/env";
import { OrbFallback } from "@/components/OrbFallback";
import { Orb3DPreview } from "@/components/Orb3DPreview";
import { getPreferredIdentityLabel } from "@/lib/identity";
import { getMiniKitUnavailableMessage, getWorldAppUpdateRequiredMessage } from "@/lib/worldcoin/messages";
import { canUseWebGL } from "@/lib/webglSupport";
import { FREE_AMBIENT_SOUND_IDS } from "@/constants/vip";
import { RESONANCE_AMBIENT_PASS_COST, RESONANCE_BLESSING_BOOST_COST, RESONANCE_ORB_AURA_COST } from "@/constants/resonance";
import CustomModal from "@/components/CustomModal";
import {
  blessingHasResonanceMark,
  getSentBlessingStatusLabel,
  type GiftOrbSnapshot,
  useSentBlessingHistory,
} from "@/hooks/useSentBlessingHistory";
import { createGardenDrawerConfig, useGardenDrawer } from "@/hooks/useGardenDrawer";
import { uploadGiftWithFallback } from "@/lib/giftUploadFlow";
import {
  extractContactsFromPayload,
  formatContactName,
  resolveContactWalletAddress,
  sanitizeResolvedRecipientAddress,
  extractContactUsername,
  getSelfGiftErrorMessage,
  isSelfGiftTarget,
  looksLikeWalletAddress,
  useGardenGifting,
} from "@/hooks/useGardenGifting";

interface AmbientSound {
  id: string;
  name: { zh: string; en: string; es?: string };
  url: string;
}

interface SoundCategory {
  id: string;
  name: { zh: string; en: string; es?: string };
  sounds: AmbientSound[];
}

const FREE_AMBIENT_SOUND_ID_SET = new Set<string>(FREE_AMBIENT_SOUND_IDS as readonly string[]);
const isAmbientSoundFree = (soundId: string) => FREE_AMBIENT_SOUND_ID_SET.has(soundId);
const WEB_GESTURE_SURFACE_STYLE =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        WebkitUserDrag: "none",
        touchAction: "none",
      } as any)
    : null;
const WEB_CONTEXT_MENU_PROPS =
  Platform.OS === "web"
    ? ({
        onContextMenu: (event: any) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
        },
      } as any)
    : {};

const AMBIENT_SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: "bowls",
    name: { zh: "頌缽與梵唱", en: "Bowls & Chants", es: "Cuencos y cantos" },
    sounds: [
      { id: "crystal-bowl", name: { zh: "頂級水晶頌缽聲", en: "Crystal Singing Bowl", es: "Cuenco de cristal" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A1%B6%E7%BA%A7%E6%B0%B4%E6%99%B6%E9%92%B5%E9%A2%82%E9%9F%B3.mp3" },
      { id: "bowl-long", name: { zh: "頌缽長音", en: "Tibetan Bowl Long", es: "Cuenco tibetano largo" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
      { id: "bowl-meditation-1", name: { zh: "頌缽冥想音樂1", en: "Tibetan Bowl Meditation 1", es: "Meditación con cuenco 1" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E6%A8%82.mp3" },
      { id: "bowl-meditation-2", name: { zh: "頌缽冥想音樂2", en: "Tibetan Bowl Meditation 2", es: "Meditación con cuenco 2" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
      { id: "bowl-stream-birds", name: { zh: "頌缽聲與流水鳥鳴", en: "Bowl + Stream & Birds", es: "Cuenco, arroyo y aves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E5%A3%B0.%E6%95%B2%E4%B8%8E%E7%A3%A8.%E6%BD%AA%E6%BD%AA%E6%B5%81%E6%B0%B4.%E9%B8%9F%E9%B8%A3.mp3" },
      { id: "bowl-water-birds", name: { zh: "頌缽聲水聲鳥叫", en: "Bowl + Water & Birds", es: "Cuenco, agua y aves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E9%9F%B3%2B%E6%B0%B4%E5%A3%B0%2B%E9%B8%9F%E5%8F%AB%E8%87%AA%E7%84%B6%E5%A3%B0.mp3" },
      { id: "bowl-pure", name: { zh: "頌缽聲", en: "Tibetan Bowl Pure", es: "Cuenco tibetano puro" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%92%B5%E9%9F%B3.mp3" },
      { id: "deep-om", name: { zh: "Deep OM Chants", en: "Deep OM Chants", es: "Cantos OM profundos" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/deep-om-chants-with-reverb-229614.mp3" },
      { id: "wind-chime", name: { zh: "風鈴缽聲清脆", en: "Wind Chime Bowl", es: "Campana de viento y cuenco" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A3%8E%E9%93%83%E9%93%9B%2C%E6%B8%85%E8%84%86%E6%82%A6%E8%80%B3.mp3" },
    ],
  },
  {
    id: "nature",
    name: { zh: "大自然", en: "Nature", es: "Naturaleza" },
    sounds: [
      { id: "ocean-waves", name: { zh: "海洋浪潮", en: "Ocean Waves", es: "Olas del océano" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%8F%E5%A4%A9%E7%9A%84%E6%B8%85%E6%99%A8%2C%E5%B1%B1%E6%9D%91%E9%87%8C%E5%85%AC%E9%B8%A1%E6%89%93%E9%B8%A3%2C%E5%A5%BD%E5%90%AC%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "pure-ocean", name: { zh: "海浪聲", en: "Pure Ocean Waves", es: "Olas puras del océano" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BA%AF%E6%B5%B7%E6%B5%AA%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "gentle-stream", name: { zh: "緩緩流水", en: "Gentle Stream", es: "Arroyo suave" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BC%93%E7%BC%93%E6%B5%81%E6%B0%B4.mp3" },
      { id: "waterfall", name: { zh: "瀑布聲", en: "Waterfall", es: "Cascada" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%BC%93%E7%BC%93%E6%B5%81%E6%B0%B4.mp3" },
      { id: "rain-meditation", name: { zh: "雨聲冥想音樂", en: "Rain Meditation", es: "Meditación con lluvia" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E6%A8%82.mp3" },
      { id: "thunder-rain", name: { zh: "雷雨夜", en: "Thunder & Rain", es: "Trueno y lluvia" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%89%93%E9%9B%B7%E4%B8%8B%E9%9B%A8.mp3" },
      { id: "forest-insects", name: { zh: "森林蟲鳴鳥叫", en: "Forest Insects & Birds", es: "Bosque, insectos y aves" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%A7%E8%87%AA%E7%84%B6%E5%86%A5%E6%83%B3%E9%9F%B3%E4%B9%90.mp3" },
      { id: "starry-crickets", name: { zh: "星夜蟲鳴", en: "Starry Night Crickets", es: "Grillos de noche estrellada" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%98%9F%E5%A4%9C%20%E5%8E%9F%E7%94%9F%E6%80%81%E8%87%AA%E7%84%B6%E4%B9%8B%E5%A3%B0.mp3" },
      { id: "summer-morning", name: { zh: "夏日清晨公雞鳥鳴", en: "Summer Morning Birds", es: "Aves de mañana de verano" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%A4%8F%E5%A4%A9%E7%9A%84%E6%B8%85%E6%99%A8%2C%E5%B1%B1%E6%9D%91%E9%87%8C%E5%85%AC%E9%B8%A1%E6%89%93%E9%B8%A3%2C%E5%A5%BD%E5%90%AC%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "mountain-birds", name: { zh: "深山清脆鳥叫", en: "Mountain Bird Calls", es: "Cantos de aves de montaña" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%9D%9E%E5%B8%B8%E9%9A%BE%E5%BE%97%E7%9A%84%E6%B8%85%E8%84%96%E9%B8%9F%E5%8F%AB%2C%E6%B7%B1%E5%B1%B1%E9%87%8C%E5%BD%95%E5%88%B6.mp3" },
      { id: "ethereal-birds", name: { zh: "空靈鳥叫", en: "Ethereal Birds", es: "Aves etéreas" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E7%A9%BA%E7%81%B5%E7%9A%84%E9%B8%9F%E5%8F%AB.mp3" },
      { id: "seagulls-waves", name: { zh: "海鷗與海浪", en: "Seagulls & Waves", es: "Gaviotas y olas" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B5%B7%E9%B8%A5%E7%9A%84%E5%8F%AB%E5%A3%B0%2C%E6%B5%B7%E6%B5%AA%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "lakeside-campfire", name: { zh: "湖邊篝火流水鳥鳴", en: "Lakeside Campfire", es: "Fogata junto al lago" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B2%B3%E8%BE%B9%E7%82%B9%E7%87%83%E7%AF%9D%E7%81%AB%20%E6%B0%B4%E5%A3%B0%E5%92%8C%E6%B8%85%E8%84%96%E7%9A%84%E9%B8%9F%E9%B8%A3.mp3" },
      { id: "underwater-bubbles", name: { zh: "水底冒泡滴答", en: "Underwater Bubbles", es: "Burbujas submarinas" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%B0%B4%E5%BA%95%E5%86%92%E6%B3%A1%2C%E5%92%95%E5%98%9F%E5%92%95%E5%98%9F%E5%92%95%E5%98%9F.mp3" },
    ],
  },
  {
    id: "frequencies",
    name: { zh: "療癒頻率", en: "Healing Frequencies", es: "Frecuencias de sanación" },
    sounds: [
      { id: "brainwave-1", name: { zh: "極度冥想通靈腦波1", en: "Deep Meditation Brainwave 1", es: "Onda cerebral profunda 1" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%9E%81%E5%BA%A6%E5%86%A5%E6%83%B3%2C%E9%80%9A%E7%81%B5%E8%84%91%E7%94%B5%E6%B3%A21.mp3" },
      { id: "brainwave-2", name: { zh: "極度冥想通靈腦波2", en: "Deep Meditation Brainwave 2", es: "Onda cerebral profunda 2" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E6%9E%81%E5%BA%A6%E5%86%A5%E6%83%B3%2C%E9%80%9A%E7%81%B5%E8%84%91%E7%94%B5%E6%B3%A22.mp3" },
      { id: "hz432", name: { zh: "432Hz 療癒", en: "432Hz Healing", es: "Sanación 432Hz" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%86%A5%E6%83%B3%E7%91%9C%E4%BC%BD%E9%9F%B3%E4%B9%902.mp3" },
    ],
  },
  {
    id: "daily",
    name: { zh: "生活音", en: "Daily Sounds", es: "Sonidos cotidianos" },
    sounds: [
      { id: "rowing-boat", name: { zh: "划船聲音", en: "Rowing Boat", es: "Remo en bote" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E8%8D%A1%E8%B5%B7%E5%8F%8C%E6%A1%A8%2C%E5%88%92%E8%88%B9%E7%9A%84%E5%A3%B0%E9%9F%B3.mp3" },
      { id: "temple-bell", name: { zh: "寺院鐘聲", en: "Temple Bell", es: "Campana del templo" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E5%B9%BD%E9%9D%99%E5%AF%BA%E9%99%A2%E7%9A%84%E9%92%9F%E5%A3%B0.mp3" },
      { id: "wind-chime-daily", name: { zh: "風鈴缽聲清脆", en: "Wind Chime Bowl", es: "Campana de viento y cuenco" }, url: "https://pub-c6f93b2bc3f54d2c8e44831dcf28a96c.r2.dev/%E9%A3%8E%E9%93%83%E9%93%9B%2C%E6%B8%85%E8%84%86%E6%82%A6%E8%80%B3.mp3" },
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

const SHAPE_VIEW_PRESETS: Partial<Record<OrbShape, { x: number; z: number; gestureScale?: number }>> = {
  'vortex-ring': { x: 0.48, z: 0.08, gestureScale: 0.28 },
  'quantum-orbitals': { x: 0.42, z: 0.22, gestureScale: 0.22 },
  'ring-torus': { x: 0.72, z: 0, gestureScale: 0.35 },
  'grid-of-life': { x: 0.54, z: 0.2, gestureScale: 0.25 },
  'cosmic-serpent': { x: 0.24, z: -0.14, gestureScale: 0.18 },
  'halo-bloom': { x: 0.44, z: 0.12, gestureScale: 0.2 },
  'seven-waves': { x: 0.32, z: -0.1, gestureScale: 0.16 },
};

// Orb Component with Sacred Geometry
const OrbParticles = ({ layers, interactionState, shape }: { layers: string[], interactionState: any, shape: OrbShape }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const colorAttributeRef = useRef<THREE.BufferAttribute>(null!);
  
  // Pre-calculate positions for Sacred Geometry
  const { positions, colors, targetPositions, heartPositions, groups } = useMemo(() => {
    const particleCount = PARTICLE_COUNT;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3); // The destination shape
    const heartPositions = new Float32Array(particleCount * 3); // Heart shape for sending
    const groups = new Float32Array(particleCount); // Group ID for animation
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    // Helper: Random point in sphere
    const setRandomSphere = (i: number) => {
      const r = 1.0 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Default colors
      const layerIndex = Math.floor(Math.random() * layers.length);
      const c = colorObjects[layerIndex] || new THREE.Color("#ffffff");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    };

    // --- GEOMETRY GENERATORS ---

    // 0. Default Sphere
    const generateSphere = () => {
      for(let i=0; i<particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.0 + Math.random() * 0.2; // Natural sphere with slight fuzziness
        
        targetPositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        targetPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        targetPositions[i*3+2] = r * Math.cos(phi);
        
        // Reset colors to layers
        const layerIndex = Math.floor(Math.random() * layers.length);
        const c = colorObjects[layerIndex] || new THREE.Color("#ffffff");
        colors[i*3] = c.r;
        colors[i*3+1] = c.g;
        colors[i*3+2] = c.b;
      }
    };

    // 1. Flower of Life (3D with sacred geometry points)
    const generateFlowerOfLife = () => {
      const data = generateFlowerOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 1.5 Flower of Life Complete
    const generateFlowerOfLifeComplete = () => {
      const data = generateFlowerOfLifeCompleteData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 2. Star of David (Interlocking Triangles) with Light Beams
    const generateStarOfDavid = () => {
      const data = generateStarOfDavidData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 3. Merkaba (Star Tetrahedron)
    const generateMerkaba = () => {
      const data = generateMerkabaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 4. Tree of Life
    const generateTreeOfLife = () => {
      const data = generateTreeOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 6. Grid of Life (64 Tetrahedron)
    const generateGridOfLife = () => {
      const data = generateGridOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 7. Sri Yantra
    const generateSriYantra = () => {
      const data = generateSriYantraData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 8. Triquetra
    const generateTriquetra = () => {
      const data = generateTriquetraData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateRingTorus = () => {
      const data = generateRingTorusData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 9. Golden Rectangles
    const generateGoldenRectangles = () => {
      const data = generateGoldenRectanglesData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 10. Double Helix DNA
    const generateDoubleHelixDNA = () => {
      const data = generateDoubleHelixDNAData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 11. Vortex Ring
    const generateVortexRing = () => {
      const data = generateVortexRingData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 12. Fractal Tree
    const generateFractalTree = () => {
      const data = generateFractalTreeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 13. Wave Interference
    const generateWaveInterference = () => {
      const data = generateWaveInterferenceData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 14. Quantum Orbitals
    const generateQuantumOrbitals = () => {
      const data = generateQuantumOrbitalsData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 15. Celtic Knot
    const generateCelticKnot = () => {
      const data = generateCelticKnotData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 16. Starburst Nova
    const generateStarburstNova = () => {
      const data = generateStarburstNovaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 17. Lattice Wave
    const generateLatticeWave = () => {
      const data = generateLatticeWaveData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 18. Sacred Flame
    const generateSacredFlame = () => {
      const data = generateSacredFlameData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateMetatronsCube = () => {
      const data = generateMetatronsCubeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateTorusFlower = () => {
      const data = generateTorusFlowerData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateLotusMandala = () => {
      const data = generateLotusMandalaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generatePhoenixSpiral = () => {
      const data = generatePhoenixSpiralData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateVesicaPiscis = () => {
      const data = generateVesicaPiscisData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateCrownChakra = () => {
      const data = generateCrownChakraData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateCosmicSerpent = () => {
      const data = generateCosmicSerpentData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generatePrismField = () => {
      const data = generatePrismFieldData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateHaloBloom = () => {
      const data = generateHaloBloomData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateInfinityPrayer = () => {
      const data = generateInfinityPrayerData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSeedOfLife = () => {
      const data = generateSeedOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateEggOfLife = () => {
      const data = generateEggOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateFruitOfLife = () => {
      const data = generateFruitOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateGoldenSpiral = () => {
      const data = generateGoldenSpiralData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateVectorEquilibrium = () => {
      const data = generateVectorEquilibriumData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateCurvedMerkaba = () => {
      const data = generateCurvedMerkabaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateCurvedMetatron = () => {
      const data = generateCurvedMetatronData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateUnicursalHexagram = () => {
      const data = generateUnicursalHexagramData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateYinYangFlow = () => {
      const data = generateYinYangFlowData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSevenWaves = () => {
      const data = generateSevenWavesData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSnowflakeMandala = () => {
      const data = generateSnowflakeMandalaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateGoldenCircles = () => {
      const data = generateGoldenCirclesData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSphereOfCircles = () => {
      const data = generateSphereOfCirclesData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateCaduceus = () => {
      const data = generateCaduceusData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateOctagramStar = () => {
      const data = generateOctagramStarData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 5. Earth
    const generateEarth = () => {
      const data = generateEarthData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateMars = () => {
      const data = generateMarsData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateVenus = () => {
      const data = generateVenusData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateJupiter = () => {
      const data = generateJupiterData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSaturn = () => {
      const data = generateSaturnData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateNeptune = () => {
      const data = generateNeptuneData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateAkashicGalaxy = () => {
      const data = generateAkashicGalaxyData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateSoulNebula = () => {
      const data = generateSoulNebulaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateLotusGalaxy = () => {
      const data = generateLotusGalaxyData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateOracleConstellation = () => {
      const data = generateOracleConstellationData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    const generateAscensionSpiral = () => {
      const data = generateAscensionSpiralData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 6. Heart (For Sending)
    const generateHeart = () => {
      for(let i=0; i<particleCount; i++) {
        // Parametric Heart
        // x = 16 sin^3(t)
        // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
        
        // We want a filled heart, so we can vary the "radius" or just layer multiple curves
        // Or simply distribute points along the curve with some noise
        
        const t = Math.random() * Math.PI * 2;
        const scale = 0.05;
        
        // Base curve
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        
        // Add thickness/volume
        // Random point inside unit sphere * thickness
        const thickness = 0.2;
        
        // Pull towards center to make it solid?
        // Let's keep it as a thick shell for better definition
        
        heartPositions[i*3] = hx * scale + (Math.random()-0.5)*thickness;
        heartPositions[i*3+1] = hy * scale + (Math.random()-0.5)*thickness + 0.2; // Shift up slightly
        heartPositions[i*3+2] = (Math.random()-0.5) * 0.5; // Depth
      }
    };

    // Initialize random sphere positions first (start state)
    for(let i=0; i<particleCount; i++) setRandomSphere(i);
    
    // Generate Target Shape based on prop
    if (shape === 'flower-of-life') generateFlowerOfLife();
    else if (shape === 'flower-of-life-complete') generateFlowerOfLifeComplete();
    else if (shape === 'star-of-david') generateStarOfDavid();
    else if (shape === 'merkaba') generateMerkaba();
    else if (shape === 'tree-of-life') generateTreeOfLife();
    else if (shape === 'earth') generateEarth();
    else if (shape === 'mars') generateMars();
    else if (shape === 'venus') generateVenus();
    else if (shape === 'jupiter') generateJupiter();
    else if (shape === 'saturn') generateSaturn();
    else if (shape === 'neptune') generateNeptune();
    else if (shape === 'akashic-galaxy') generateAkashicGalaxy();
    else if (shape === 'soul-nebula') generateSoulNebula();
    else if (shape === 'lotus-galaxy') generateLotusGalaxy();
    else if (shape === 'oracle-constellation') generateOracleConstellation();
    else if (shape === 'ascension-spiral') generateAscensionSpiral();
    else if (shape === 'grid-of-life') generateGridOfLife();
    else if (shape === 'sri-yantra') generateSriYantra();
    else if (shape === 'triquetra') generateTriquetra();
    else if (shape === 'ring-torus') generateRingTorus();
    else if (shape === 'golden-rectangles') generateGoldenRectangles();
    else if (shape === 'double-helix-dna') generateDoubleHelixDNA();
    else if (shape === 'vortex-ring') generateVortexRing();
    else if (shape === 'fractal-tree') generateFractalTree();
    else if (shape === 'wave-interference') generateWaveInterference();
    else if (shape === 'quantum-orbitals') generateQuantumOrbitals();
    else if (shape === 'celtic-knot') generateCelticKnot();
    else if (shape === 'starburst-nova') generateStarburstNova();
    else if (shape === 'lattice-wave') generateLatticeWave();
    else if (shape === 'sacred-flame') generateSacredFlame();
    else if (shape === 'metatrons-cube') generateMetatronsCube();
    else if (shape === 'torus-flower') generateTorusFlower();
    else if (shape === 'lotus-mandala') generateLotusMandala();
    else if (shape === 'phoenix-spiral') generatePhoenixSpiral();
    else if (shape === 'vesica-piscis') generateVesicaPiscis();
    else if (shape === 'crown-chakra') generateCrownChakra();
    else if (shape === 'cosmic-serpent') generateCosmicSerpent();
    else if (shape === 'prism-field') generatePrismField();
    else if (shape === 'halo-bloom') generateHaloBloom();
    else if (shape === 'infinity-prayer') generateInfinityPrayer();
    else if (shape === 'seed-of-life') generateSeedOfLife();
    else if (shape === 'egg-of-life') generateEggOfLife();
    else if (shape === 'fruit-of-life') generateFruitOfLife();
    else if (shape === 'golden-spiral') generateGoldenSpiral();
    else if (shape === 'vector-equilibrium') generateVectorEquilibrium();
    else if (shape === 'curved-merkaba') generateCurvedMerkaba();
    else if (shape === 'curved-metatron') generateCurvedMetatron();
    else if (shape === 'unicursal-hexagram') generateUnicursalHexagram();
    else if (shape === 'yin-yang-flow') generateYinYangFlow();
    else if (shape === 'seven-waves') generateSevenWaves();
    else if (shape === 'snowflake-mandala') generateSnowflakeMandala();
    else if (shape === 'golden-circles') generateGoldenCircles();
    else if (shape === 'sphere-of-circles') generateSphereOfCircles();
    else if (shape === 'caduceus') generateCaduceus();
    else if (shape === 'octagram-star') generateOctagramStar();
    else generateSphere(); // Default
    
    // Always generate heart positions so they are ready
    generateHeart();
    
    return { positions, colors, targetPositions, heartPositions, groups };
  }, [layers, shape]);

  // Use a buffer attribute for current positions to interpolate
  const currentPositions = useMemo(() => {
    // Start with random sphere positions (from useMemo above)
    // We clone positions to be the mutable current state
    return new Float32Array(positions);
  }, [positions]); // Reset when positions (shape source) changes

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const { mode, spinVelocity, progress } = interactionState.current;
    
    // Friction for spin - REMOVED per user request (perpetual spin)
    // if (Math.abs(spinVelocity) > 0.0001) {
    //    interactionState.current.spinVelocity *= 0.98; 
    // } else {
    //    interactionState.current.spinVelocity = 0;
    // }
    
    // Cap max speed to avoid dizziness
    if (Math.abs(interactionState.current.spinVelocity) > 2.0) {
      interactionState.current.spinVelocity = 2.0 * Math.sign(interactionState.current.spinVelocity);
    }

    // Rotation Logic
    let rotationSpeed = 0.001 + spinVelocity;
    
    // Earth: 90s rotation (approx 0.0011 rad/frame at 60fps) + User Control
    if (shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'saturn' || shape === 'neptune') {
       // Auto rotation: 1 rev / 90s (Clockwise from North = Negative Y)
       // 2PI / (90 * 60) ~= 0.00116
       const autoSpeed = -0.00116; 
       rotationSpeed = autoSpeed + spinVelocity;
    }
    
    if (mode === 'gather') rotationSpeed = 0.02 + (progress * 0.1); 
    if (mode === 'meditating') rotationSpeed = 0.005; // Gentle rotation during meditation
    pointsRef.current.rotation.y += rotationSpeed;
    
    // Apply X rotation (vertical tilt from gestures)
    const rotationSpeedX = interactionState.current.spinVelocityX || 0;
    
    // Merkaba needs to stay upright (no Z tilt from gestures if we supported them)
    // Actually standard rotation is only Y.
    // If we want to allow user to tilt earth? 
    // For now keep Y rotation.
    
    if (shape === 'merkaba' || shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'saturn' || shape === 'neptune') {
       pointsRef.current.rotation.z = 0;
       // Planets need to be upright
       pointsRef.current.rotation.x = 0; 
    } else {
      const viewPreset = SHAPE_VIEW_PRESETS[shape];
      if (viewPreset) {
        pointsRef.current.rotation.x = viewPreset.x + rotationSpeedX * (viewPreset.gestureScale ?? 0);
        pointsRef.current.rotation.z = viewPreset.z;
      } else {
        pointsRef.current.rotation.x = rotationSpeedX;
        pointsRef.current.rotation.z = 0;
      }
    }
    
    // Access geometry attributes
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    
    // Time-based animations
    const t = state.clock.elapsedTime;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      const g = groups[i];
      
      let tx = targetPositions[ix];
      let ty = targetPositions[iy];
      let tz = targetPositions[iz];
      
      // SHAPE ANIMATIONS
      if (shape === 'flower-of-life' || shape === 'flower-of-life-complete') {
         const g = groups[i];
         // Gentle pulse for all particles
         const pulse = 1.0 + Math.sin(t * 2) * 0.03;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         if (shape === 'flower-of-life-complete') {
            // For complete version:
            // Group 1: Circles -> Subtle breathing
            if (g === 1) {
              const breath = 1.0 + Math.sin(t * 1.5 + ix * 0.0001) * 0.01;
              tx *= breath; ty *= breath;
            }
            // Group 2: Outer Circle -> Slow rotation or shine?
            if (g === 2) {
               // Make outer ring shimmer
               const shimmer = 1.0 + Math.sin(t * 3 + Math.atan2(ty, tx)*5) * 0.02;
               tx *= shimmer; ty *= shimmer;
            }
         } else {
             // Old logic
             // Key intersection points (g=0) glow brighter
             if (g === 0) {
               const glow = 1.0 + Math.sin(t * 4 + i * 0.01) * 0.08;
               tx *= glow; ty *= glow; tz *= glow;
             }
             // Outer ring (g=2) subtle wave
             if (g === 2) {
               const wave = Math.sin(t * 1.5 + Math.atan2(ty, tx) * 3) * 0.02;
               tx += wave; ty += wave;
             }
         }
      } else if (shape === 'merkaba') {
         const g = groups[i];
         if (g === 2) {
           // Center pulse
           const s = 1 + Math.pow(Math.sin(t * 3), 2) * 0.1; // Faster, sharp pulse
           tx *= s; ty *= s; tz *= s;
         } else {
           // Rotation
           // T1 (Gold, g=0): Left 12s -> 2PI/12 rad/s
           // T2 (Silver, g=1): Right 15s -> -2PI/15 rad/s
           
           let ang = 0;
           if (g === 0) {
              ang = t * (Math.PI * 2 / 12);
           } else {
              ang = -t * (Math.PI * 2 / 15);
           }
           
           const cos = Math.cos(ang);
           const sin = Math.sin(ang);
           
           // Rotate around Y axis
           const rx = tx * cos - tz * sin;
           const rz = tx * sin + tz * cos;
           tx = rx; tz = rz;
         }
      } else if (shape === 'grid-of-life') {
         const g = groups[i];
         // Pulsing effect for the entire structure
         const pulse = 1.0 + Math.sin(t * 1.5) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Vertex nodes (g=0) - bright pulsing glow
         if (g === 0) {
           const glow = 1.0 + Math.sin(t * 3 + i * 0.02) * 0.1;
           tx *= glow; ty *= glow; tz *= glow;
         }
         // Edge lines (g=1) - flowing energy along edges
         else if (g === 1) {
           const flow = Math.sin(t * 2 + i * 0.005) * 0.015;
           tx += flow; ty += flow; tz += flow;
         }
         // Inner grid (g=2) - subtle breathing
         else if (g === 2) {
           const breath = 1.0 + Math.sin(t * 2.5 + i * 0.01) * 0.06;
           tx *= breath; ty *= breath; tz *= breath;
         }
         // Outer boundary (g=3) - wave effect
         else if (g === 3) {
           const wave = Math.sin(t * 1.2 + Math.atan2(ty, tx) * 4) * 0.03;
           tx += wave; ty += wave;
         }
      } else if (shape === 'star-of-david') {
         const g = groups[i];
         // Sacred pulsing for entire star
         const pulse = 1.0 + Math.sin(t * 2) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Triangle 1 edges (g=0) - blue waves flowing
         if (g === 0) {
           const wave = Math.sin(t * 2.5 + i * 0.008) * 0.025;
           tx += wave; ty += wave;
         }
         // Triangle 2 edges (g=1) - gold waves flowing
         else if (g === 1) {
           const wave = Math.sin(t * 2.3 + i * 0.008) * 0.025;
           tx += wave; ty += wave;
         }
         // Vertex nodes (g=2) - bright pulsing star points
         else if (g === 2) {
           const pointGlow = 1.0 + Math.sin(t * 4 + i * 0.05) * 0.15;
           tx *= pointGlow; ty *= pointGlow; tz *= pointGlow;
         }
         // Center core (g=3) - sacred center bright pulse
         else if (g === 3) {
           const coreGlow = 1.0 + Math.sin(t * 3.5) * 0.18;
           tx *= coreGlow; ty *= coreGlow; tz *= coreGlow;
         }
         // Center hexagon (g=4) - rotating energy ring
         else if (g === 4) {
           const hexRotation = Math.sin(t * 2 + Math.atan2(ty, tx) * 6) * 0.04;
           tx += hexRotation * Math.cos(Math.atan2(ty, tx));
           ty += hexRotation * Math.sin(Math.atan2(ty, tx));
           
           const hexGlow = 1.0 + Math.sin(t * 3.2 + Math.atan2(ty, tx) * 6) * 0.08;
           tx *= hexGlow; ty *= hexGlow;
         }
         // Outer ambient glow (g=5) - radiating energy
         else if (g === 5) {
           const radialPulse = Math.sin(t * 1.8 + Math.sqrt(tx*tx + ty*ty) * 3) * 0.035;
           const angle = Math.atan2(ty, tx);
           tx += radialPulse * Math.cos(angle);
           ty += radialPulse * Math.sin(angle);
         }
      } else if (shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'neptune') {
          // Earth Animation: 
          // 1. Slow rotation of the "texture" (points) relative to the frame?
          // No, we rotate the whole group in the standard rotation logic below.
          // But user asked for "Unlock rotation... let user control".
          // And also "90s slow rotation".
          
          // If we want the particles to move *on* the sphere while the sphere is static?
          // No, usually we rotate the sphere container.
          
          // Planet rotation is handled in the main rotation logic (outside loop)
      } else if (shape === 'saturn') {
          if (g === 2) {
            const ringWave = Math.sin(t * 2.2 + Math.atan2(tz, tx) * 6) * 0.022;
            tx += ringWave * Math.cos(Math.atan2(tz, tx));
            tz += ringWave * Math.sin(Math.atan2(tz, tx));
          }
      } else if (shape === 'akashic-galaxy') {
         const spin = Math.atan2(tz, tx);
         const orbit = Math.sin(t * 1.6 + spin * 5) * 0.02;
         tx += orbit * Math.cos(spin);
         tz += orbit * Math.sin(spin);
         if (g === 2) {
           const coreGlow = 1.0 + Math.sin(t * 3.8) * 0.14;
           tx *= coreGlow; ty *= coreGlow; tz *= coreGlow;
         }
      } else if (shape === 'soul-nebula') {
         const drift = Math.sin(t * 1.4 + (tx + ty + tz) * 2.5) * 0.018;
         tx += drift;
         ty += drift * 0.75;
         tz += Math.cos(t * 1.1 + i * 0.003) * 0.016;
         if (g === 2) {
           const heartGlow = 1.0 + Math.sin(t * 3.1) * 0.12;
           tx *= heartGlow; ty *= heartGlow; tz *= heartGlow;
         }
      } else if (shape === 'lotus-galaxy') {
         const angle = Math.atan2(tz, tx);
         const bloom = Math.sin(t * 1.8 + angle * 4) * 0.024;
         tx += bloom * Math.cos(angle);
         tz += bloom * Math.sin(angle);
         ty += Math.sin(t * 2.2 + i * 0.01) * 0.012;
      } else if (shape === 'oracle-constellation') {
         if (g === 0) {
           const nodeGlow = 1.0 + Math.sin(t * 4 + i * 0.02) * 0.14;
           tx *= nodeGlow; ty *= nodeGlow; tz *= nodeGlow;
         } else if (g === 1) {
           const thread = Math.sin(t * 2 + i * 0.004) * 0.014;
           tx += thread;
           tz += thread * 0.7;
         }
      } else if (shape === 'ascension-spiral') {
         ty += Math.sin(t * 2.6 + i * 0.006) * 0.018;
         const radius = Math.sqrt(tx * tx + tz * tz) || 1;
         if (g === 2) {
           const beam = 1.0 + Math.sin(t * 3.5 + ty * 3) * 0.1;
           tx *= beam; tz *= beam;
         } else {
           const flare = 1.0 + Math.sin(t * 1.7 + radius * 5) * 0.04;
           tx *= flare; tz *= flare;
         }
      } else if (shape === 'sri-yantra') {
         const g = groups[i];
         // Sacred pulsing for entire yantra
         const pulse = 1.0 + Math.sin(t * 2.5) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Bindu (g=0) - central point bright pulsing
         if (g === 0) {
           const binduGlow = 1.0 + Math.sin(t * 4) * 0.15;
           tx *= binduGlow; ty *= binduGlow; tz *= binduGlow;
         }
         // Triangles (g=1-9) - alternating wave based on group
         else if (g >= 1 && g <= 9) {
           const triangleWave = Math.sin(t * 3 + g * 0.5) * 0.03;
           tx += triangleWave; ty += triangleWave;
         }
         // Intersection nodes (g=10) - bright glow
         else if (g === 10) {
           const nodeGlow = 1.0 + Math.sin(t * 5 + i * 0.03) * 0.12;
           tx *= nodeGlow; ty *= nodeGlow; tz *= nodeGlow;
         }
         // Outer circles (g=11) - rotating wave
         else if (g === 11) {
           const outerWave = Math.sin(t * 2 + Math.atan2(ty, tx) * 3) * 0.04;
           tx += outerWave; ty += outerWave;
         }
      } else if (shape === 'triquetra') {
         const g = groups[i];
         // Extremely subtle unified breathing - entire form breathes as one eternal presence
         const breath = 1.0 + Math.sin(t * 0.8) * 0.015;
         tx *= breath; ty *= breath; tz *= breath;
         
         // Arc particles (g=0,1,2) - the three sacred strands flow with barely perceptible energy
         if (g === 0 || g === 1 || g === 2) {
           const subtleFlow = Math.sin(t * 1.5 + i * 0.003) * 0.008;
           const angle = Math.atan2(ty, tx);
           tx += subtleFlow * Math.cos(angle);
           ty += subtleFlow * Math.sin(angle);
         }
         // Center luminescence (g=4) - soft eternal light
         else if (g === 4) {
           const coreGlow = 1.0 + Math.sin(t * 2.0) * 0.08;
           tx *= coreGlow; ty *= coreGlow; tz *= coreGlow;
         }
         // Ambient halo (g=5) - slow ethereal presence
         else if (g === 5) {
           const drift = Math.sin(t * 0.6 + Math.atan2(ty, tx) * 2) * 0.015;
           const angle = Math.atan2(ty, tx);
           tx += drift * Math.cos(angle);
           ty += drift * Math.sin(angle);
         }
      } else if (shape === 'ring-torus') {
         const angle = Math.atan2(tz, tx);
         const breath = 1.0 + Math.sin(t * 1.6 + angle * 2) * 0.015;
         if (g === 0) {
           tx *= breath;
           tz *= breath;
           ty += Math.sin(t * 1.8 + angle * 3) * 0.008;
         } else if (g === 1) {
           const torusFlow = Math.sin(t * 2.2 + angle * 3) * 0.018;
           tx += torusFlow * Math.cos(angle + Math.PI / 2);
           tz += torusFlow * Math.sin(angle + Math.PI / 2);
           ty += Math.cos(t * 1.7 + angle * 4) * 0.01;
         }
         if (g === 2) {
           const corePulse = 1.0 + Math.sin(t * 4.1) * 0.11;
           tx *= corePulse;
           tz *= corePulse;
         }
      } else if (shape === 'golden-rectangles') {
         const g = groups[i];
         // Divine proportion breathing for entire structure
         const pulse = 1.0 + Math.sin(t * 1.8) * 0.035;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Rectangle edges (g=0,1,2) - flowing golden energy
         if (g === 0) {
           // XY plane rectangle - horizontal wave
           const wave = Math.sin(t * 2.2 + tx * 3) * 0.02;
           tx += wave; ty += wave * 0.5;
         }
         else if (g === 1) {
           // YZ plane rectangle - vertical wave
           const wave = Math.sin(t * 2.0 + ty * 3) * 0.02;
           ty += wave; tz += wave * 0.5;
         }
         else if (g === 2) {
           // ZX plane rectangle - depth wave
           const wave = Math.sin(t * 2.4 + tz * 3) * 0.02;
           tz += wave; tx += wave * 0.5;
         }
         // Intersection nodes (g=3) - bright golden glow
         else if (g === 3) {
           const nodeGlow = 1.0 + Math.sin(t * 3.5 + i * 0.03) * 0.12;
           tx *= nodeGlow; ty *= nodeGlow; tz *= nodeGlow;
         }
         // Sacred center (g=4) - phi ratio pulse
         else if (g === 4) {
           const phiPulse = 1.0 + Math.sin(t * 2.618) * 0.15; // 2.618 ≈ φ + 1
           tx *= phiPulse; ty *= phiPulse; tz *= phiPulse;
         }
         // Outer aura (g=5) - radiating divine proportion
         else if (g === 5) {
           const radialPulse = Math.sin(t * 1.618 + Math.sqrt(tx*tx + ty*ty + tz*tz) * 2) * 0.025;
           const dist = Math.sqrt(tx*tx + ty*ty + tz*tz);
           if (dist > 0.001) {
             tx += radialPulse * (tx / dist);
             ty += radialPulse * (ty / dist);
             tz += radialPulse * (tz / dist);
           }
         }
      } else if (shape === 'double-helix-dna') {
         const g = groups[i];
         // Gentle pulse for entire DNA structure
         const pulse = 1.0 + Math.sin(t * 1.5) * 0.03;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Strand 1 (g=0) - flowing cyan energy upward
         if (g === 0) {
           const flow = Math.sin(t * 2.5 + ty * 4) * 0.02;
           tx += flow * Math.cos(ty * 3);
           tz += flow * Math.sin(ty * 3);
         }
         // Strand 2 (g=1) - flowing teal energy downward
         else if (g === 1) {
           const flow = Math.sin(t * 2.3 - ty * 4) * 0.02;
           tx += flow * Math.cos(ty * 3 + Math.PI);
           tz += flow * Math.sin(ty * 3 + Math.PI);
         }
         // Base pair connections (g=2) - pulsing bridges
         else if (g === 2) {
           const connectionPulse = 1.0 + Math.sin(t * 4 + i * 0.05) * 0.08;
           tx *= connectionPulse;
           tz *= connectionPulse;
         }
         // Trail particles (g=3) - floating around helix
         else if (g === 3) {
           const drift = Math.sin(t * 1.2 + i * 0.01) * 0.04;
           tx += drift;
           tz += drift * 0.5;
         }
         // Ambient particles (g=4) - subtle cosmic drift
         else if (g === 4) {
           const cosmicDrift = Math.sin(t * 0.8 + i * 0.005) * 0.02;
           tx += cosmicDrift;
           ty += cosmicDrift * 0.3;
         }
      } else if (shape === 'vortex-ring') {
         const g = groups[i];
         // Gentle breathing pulse for the torus
         const pulse = 1.0 + Math.sin(t * 1.8) * 0.025;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Torus surface (g=0) - swirling motion around the ring
         if (g === 0) {
           const angle = Math.atan2(tz, tx);
           const swirl = Math.sin(t * 2 + angle * 3) * 0.025;
           tx += swirl * Math.cos(angle + Math.PI / 2);
           tz += swirl * Math.sin(angle + Math.PI / 2);
         }
         // Flow lines (g=1) - spiraling energy
         else if (g === 1) {
           const spiral = Math.sin(t * 3 + i * 0.01) * 0.03;
           const angle = Math.atan2(tz, tx);
           tx += spiral * Math.cos(angle);
           tz += spiral * Math.sin(angle);
           ty += Math.sin(t * 2.5 + i * 0.02) * 0.015;
         }
         // Core ring (g=2) - bright pulsing center
         else if (g === 2) {
           const coreGlow = 1.0 + Math.sin(t * 4) * 0.12;
           tx *= coreGlow;
           tz *= coreGlow;
         }
         // Outer vortex (g=3) - particles being drawn in
         else if (g === 3) {
           const inwardPull = Math.sin(t * 1.5 + i * 0.008) * 0.04;
           const angle = Math.atan2(tz, tx);
           tx -= inwardPull * Math.cos(angle);
           tz -= inwardPull * Math.sin(angle);
         }
         // Ambient dust (g=4) - slow cosmic drift
         else if (g === 4) {
           const drift = Math.sin(t * 0.7 + i * 0.003) * 0.015;
           tx += drift;
           tz += drift * 0.5;
         }
      } else if (shape === 'fractal-tree') {
         const g = groups[i];
         // Gentle swaying motion like wind through branches
         const sway = Math.sin(t * 0.8 + ty * 2) * 0.02;
         tx += sway;
         tz += sway * 0.5;
         
         // Branch particles (g=0) - subtle breathing
         if (g === 0) {
           const breath = 1.0 + Math.sin(t * 1.5 + ty * 3) * 0.015;
           tx *= breath;
           tz *= breath;
         }
         // Leaf particles (g=1) - glowing pulse at endpoints
         else if (g === 1) {
           const leafGlow = 1.0 + Math.sin(t * 3 + i * 0.02) * 0.1;
           tx *= leafGlow;
           ty *= leafGlow;
           tz *= leafGlow;
         }
         // Glow particles (g=2) - floating ambient
         else if (g === 2) {
           const floatY = Math.sin(t * 1.2 + i * 0.01) * 0.03;
           ty += floatY;
         }
         // Ambient particles (g=3) - gentle drift
         else if (g === 3) {
           const drift = Math.sin(t * 0.6 + i * 0.005) * 0.02;
           tx += drift;
           tz += drift * 0.3;
         }
      } else if (shape === 'wave-interference') {
         const g = groups[i];
         // Global wave motion
         const globalWave = Math.sin(t * 1.5) * 0.02;
         ty += globalWave;
         
         // Wave 1 (g=0) - horizontal oscillation
         if (g === 0) {
           const oscillate = Math.sin(t * 2.5 + tx * 5) * 0.03;
           ty += oscillate;
         }
         // Wave 2 (g=1) - vertical oscillation
         else if (g === 1) {
           const oscillate = Math.sin(t * 2.3 + tx * 5) * 0.03;
           tz += oscillate;
         }
         // Interference surface (g=2) - rippling effect
         else if (g === 2) {
           const ripple = Math.sin(t * 2 + Math.sqrt(tx*tx + tz*tz) * 4) * 0.025;
           ty += ripple;
         }
         // Node particles (g=3) - bright pulsing
         else if (g === 3) {
           const nodePulse = 1.0 + Math.sin(t * 4 + i * 0.03) * 0.12;
           tx *= nodePulse;
           ty *= nodePulse;
           tz *= nodePulse;
         }
         // Ambient particles (g=4) - slow drift
         else if (g === 4) {
           const drift = Math.sin(t * 0.8 + i * 0.004) * 0.015;
           tx += drift;
           tz += drift * 0.5;
         }
      } else if (shape === 'vesica-piscis') {
         const pulse = 1.0 + Math.sin(t * 1.8) * 0.025;
         tx *= pulse;
         ty *= pulse;
         if (g === 2) {
           const gateGlow = 1.0 + Math.sin(t * 3.8 + Math.abs(ty) * 5) * 0.09;
           tx *= gateGlow;
           ty *= gateGlow;
           tz *= gateGlow;
         }
      } else if (shape === 'yin-yang-flow') {
         const angle = Math.atan2(ty, tx);
         const polarity = g === 0 || g === 3 ? -1 : 1;
         const phase = polarity > 0 ? 0 : Math.PI;
         const tide = Math.sin(t * 1.65 + angle * 2 + phase) * 0.02;
         tx += tide * Math.cos(angle + Math.PI / 2);
         ty += tide * Math.sin(angle + Math.PI / 2);
         if (g === 4) {
           tz += Math.sin(t * 1.4 + angle * 4) * 0.004;
         } else {
           tz += polarity * Math.sin(t * 2.2 + angle * 3 + phase) * 0.018;
           const breath = 1.0 + Math.sin(t * 1.35 + phase) * 0.022;
           tx *= breath;
           ty *= breath;
         }
         if (g === 2 || g === 3) {
           const seedGlow = 1.0 + Math.sin(t * 4.1) * 0.1;
           tx *= seedGlow;
           ty *= seedGlow;
           tz *= seedGlow;
         }
      } else if (shape === 'infinity-prayer') {
         const sweep = Math.sin(t * 2.1 + Math.abs(tx) * 4) * 0.018;
         ty += sweep;
         tz += Math.cos(t * 1.8 + Math.abs(tx) * 5) * 0.015;
         if (g === 2) {
           const knotGlow = 1.0 + Math.sin(t * 4.5) * 0.1;
           tx *= knotGlow;
           ty *= knotGlow;
           tz *= knotGlow;
         }
      } else if (shape === 'curved-merkaba') {
         if (g === 2) {
           const corePulse = 1.0 + Math.pow(Math.sin(t * 3), 2) * 0.12;
           tx *= corePulse;
           ty *= corePulse;
           tz *= corePulse;
         } else if (g === 3) {
           const halo = 1.0 + Math.sin(t * 2.3 + Math.atan2(ty, tx) * 3) * 0.05;
           tx *= halo;
           ty *= halo;
           tz *= 1.0 + Math.cos(t * 1.8 + Math.atan2(tz, tx) * 2) * 0.04;
         } else {
           const dir = g === 0 ? 1 : -1;
           const angle = dir * t * (Math.PI * 2 / 14);
           const cos = Math.cos(angle);
           const sin = Math.sin(angle);
           const rx = tx * cos - tz * sin;
           const rz = tx * sin + tz * cos;
           tx = rx;
           tz = rz;
         }
      } else if (shape === 'vector-equilibrium') {
         const radius = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
         if (g === 2) {
           const nodeGlow = 1.0 + Math.sin(t * 4.1 + radius * 4) * 0.12;
           tx *= nodeGlow;
           ty *= nodeGlow;
           tz *= nodeGlow;
         } else {
           const breathe = 1.0 + Math.sin(t * 1.6) * 0.022;
           tx *= breathe;
           ty *= breathe;
           tz *= breathe;
         }
      } else if (shape === 'curved-metatron') {
         const angle = Math.atan2(ty, tx);
         const sway = Math.sin(t * 2 + angle * 6) * 0.018;
         tx += sway * Math.cos(angle);
         ty += sway * Math.sin(angle);
         if (g === 0) {
           const nodeGlow = 1.0 + Math.sin(t * 3.8 + i * 0.01) * 0.1;
           tx *= nodeGlow;
           ty *= nodeGlow;
         }
      } else if (shape === 'sphere-of-circles') {
         const latPulse = 1.0 + Math.sin(t * 1.7 + ty * 5) * 0.025;
         tx *= latPulse;
         tz *= latPulse;
      } else if (shape === 'octagram-star') {
         const burst = 1.0 + Math.sin(t * 2.6 + Math.atan2(ty, tx) * 4) * 0.05;
         tx *= burst;
         ty *= burst;
         if (g === 0) {
           tz += Math.sin(t * 3.8 + i * 0.02) * 0.035;
         }
      } else if (shape === 'golden-circles') {
         const theta = Math.atan2(ty, tx);
         const ringWave = Math.sin(t * 1.618 + theta * 3) * 0.016;
         tx += ringWave * Math.cos(theta);
         ty += ringWave * Math.sin(theta);
      } else if (shape === 'metatrons-cube' || shape === 'halo-bloom' || shape === 'seed-of-life' || shape === 'fruit-of-life' || shape === 'curved-metatron' || shape === 'unicursal-hexagram' || shape === 'golden-circles' || shape === 'sphere-of-circles' || shape === 'octagram-star') {
         const pulse = 1.0 + Math.sin(t * 2.1 + i * 0.001) * 0.035;
         const ringAngle = Math.atan2(ty, tx);
         tx *= pulse;
         ty *= pulse;
         if (g === 0 || g === 2) {
           const glow = 1.0 + Math.sin(t * 4 + i * 0.01) * 0.08;
           tx *= glow;
           ty *= glow;
           tz *= 1.0 + Math.sin(t * 3.2 + i * 0.008) * 0.05;
         } else if (g === 1 || g === 3) {
           const orbitWave = Math.sin(t * 1.8 + ringAngle * 6) * 0.022;
           tx += orbitWave * Math.cos(ringAngle);
           ty += orbitWave * Math.sin(ringAngle);
         } else {
           tz += Math.sin(t * 1.2 + i * 0.004) * 0.012;
         }
      } else if (shape === 'torus-flower' || shape === 'lotus-mandala' || shape === 'crown-chakra' || shape === 'egg-of-life' || shape === 'vector-equilibrium' || shape === 'snowflake-mandala' || shape === 'curved-merkaba') {
         const angle = Math.atan2(ty, tx);
         const radius = Math.sqrt(tx * tx + ty * ty + tz * tz);
         const bloom = Math.sin(t * 1.7 + angle * 4) * 0.02;
         tx += bloom * Math.cos(angle);
         ty += bloom * Math.sin(angle);
         tz += Math.sin(t * 2 + i * 0.005) * 0.015;
         if (g === 0 || g === 2) {
           const petalPulse = 1.0 + Math.sin(t * 3.3 + radius * 5) * 0.06;
           tx *= petalPulse;
           ty *= petalPulse;
         } else {
           const halo = Math.sin(t * 1.4 + angle * 8) * 0.018;
           tx += halo * Math.cos(angle + Math.PI / 2);
           ty += halo * Math.sin(angle + Math.PI / 2);
         }
      } else if (shape === 'phoenix-spiral' || shape === 'cosmic-serpent' || shape === 'golden-spiral' || shape === 'seven-waves' || shape === 'caduceus') {
         const ascend = Math.sin(t * 2.5 + i * 0.006) * 0.02;
         ty += ascend;
         tx += Math.cos(t * 1.8 + ty * 2) * 0.018;
         tz += Math.sin(t * 1.6 + ty * 2) * 0.018;
         if (shape === 'golden-spiral') {
           const radialLift = 1.0 + Math.sin(t * 1.618 + Math.sqrt(tx * tx + tz * tz) * 4) * 0.05;
           tx *= radialLift;
           tz *= radialLift;
         } else if (g === 0 || g === 2) {
           const ember = 1.0 + Math.sin(t * 4.2 + i * 0.012) * 0.07;
           tx *= ember;
           ty *= ember;
         }
      } else if (shape === 'prism-field') {
         const shimmer = Math.sin(t * 2.8 + (tx + ty + tz) * 3) * 0.022;
         tx += shimmer;
         ty += shimmer * 0.8;
         tz += shimmer * 0.6;
      } 

      // Modifiers based on mode
      if (mode === 'gather') {
        const tighten = 1.0 - (progress * 0.8); 
        tx *= tighten; ty *= tighten; tz *= tighten;
        
        const jitter = 0.05 * progress;
        tx += (Math.random() - 0.5) * jitter;
        ty += (Math.random() - 0.5) * jitter;
        tz += (Math.random() - 0.5) * jitter;
      } 
      else if (mode === 'heart') {
         tx = heartPositions[ix];
         ty = heartPositions[iy];
         tz = heartPositions[iz];

         const beat = 1.0 + Math.sin(state.clock.elapsedTime * 15) * 0.05;
         tx *= beat; ty *= beat; tz *= beat;
      }
      else if (mode === 'store') {
        tx *= 0.01;
        ty = ty * 0.01 - 3.0; 
        tz *= 0.01;
      }
      else if (mode === 'explode') {
         // Heart flying away effect (Gift sent)
         tx = heartPositions[ix];
         ty = heartPositions[iy];
         tz = heartPositions[iz];
         
         const flyScale = 2.0;
         tx *= flyScale + (Math.random() - 0.5) * 0.5;
         ty = ty * flyScale + 5.0; // Fly UP off screen
         tz *= flyScale + (Math.random() - 0.5) * 0.5;
      }
      else if (mode === 'diffused') {
         // Scatter outward like a cloud/nebula
         // We use the original position but scale it up and add some sine wave movement
         const scatter = 1.5 + Math.sin(t + i * 0.1) * 0.2;
         tx *= scatter;
         ty *= scatter;
         tz *= scatter;
      }
      else if (mode === 'meditating') {
         // Gentle breathing effect
         const breath = 1.0 + Math.sin(t * 0.5) * 0.05;
         tx *= breath;
         ty *= breath;
         tz *= breath;
      }
      
      const lerpFactor = 0.1;
      currentPositions[ix] += (tx - currentPositions[ix]) * lerpFactor;
      currentPositions[iy] += (ty - currentPositions[iy]) * lerpFactor;
      currentPositions[iz] += (tz - currentPositions[iz]) * lerpFactor;
    }
    
    positionAttribute.array.set(currentPositions);
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          ref={colorAttributeRef}
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const { COLLAPSED_DRAWER_HEIGHT, EXPANDED_DRAWER_HEIGHT } = createGardenDrawerConfig(SCREEN_HEIGHT);
const ORB_SCENE_HEIGHT = SCREEN_HEIGHT < 760
  ? Math.min(SCREEN_HEIGHT * 0.48, 420)
  : Math.min(SCREEN_HEIGHT * 0.58, 520);
const IS_COMPACT_GARDEN_VIEW = SCREEN_HEIGHT < 760;

const shapes: { id: OrbShape, name: string, nameZh: string, nameEs: string, icon: string }[] = [
  { id: 'flower-of-life-complete', name: 'Flower of Life', nameZh: '生命之花', nameEs: 'Flor de la Vida', icon: '' },
  { id: 'star-of-david', name: 'Star of David', nameZh: '六芒星', nameEs: 'Estrella de David', icon: '' },
  { id: 'merkaba', name: 'Merkaba', nameZh: '梅爾卡巴', nameEs: 'Merkaba', icon: '' },
  { id: 'tree-of-life', name: 'Tree of Life', nameZh: '生命之樹', nameEs: 'Árbol de la Vida', icon: '' },
  { id: 'grid-of-life', name: 'Grid of Life', nameZh: '生命之格', nameEs: 'Red de la Vida', icon: '' },
  { id: 'sri-yantra', name: 'Sri Yantra', nameZh: '吉祥之輪', nameEs: 'Sri Yantra', icon: '' },
  { id: 'ring-torus', name: 'Ring Torus', nameZh: '環形托羅斯', nameEs: 'Toro anular', icon: '' },
  { id: 'golden-rectangles', name: 'Golden Rectangles', nameZh: '黃金矩形', nameEs: 'Rectángulos áureos', icon: '' },
  { id: 'double-helix-dna', name: 'Double Helix DNA', nameZh: 'DNA雙螺旋', nameEs: 'ADN de doble hélice', icon: '' },
  { id: 'vortex-ring', name: 'Vortex Ring', nameZh: '漩渦環', nameEs: 'Anillo de vórtice', icon: '' },
  { id: 'fractal-tree', name: 'Fractal Tree', nameZh: '分形樹', nameEs: 'Árbol fractal', icon: '' },
  { id: 'wave-interference', name: 'Wave Interference', nameZh: '波干涉', nameEs: 'Interferencia de ondas', icon: '' },
  { id: 'quantum-orbitals', name: 'Quantum Orbitals', nameZh: '量子軌道', nameEs: 'Orbitales cuánticos', icon: '' },
  { id: 'celtic-knot', name: 'Celtic Knot', nameZh: '凱爾特結', nameEs: 'Nudo celta', icon: '' },
  { id: 'starburst-nova', name: 'Starburst Nova', nameZh: '星爆新星', nameEs: 'Nova estelar', icon: '' },
  { id: 'lattice-wave', name: 'Lattice Wave', nameZh: '晶格波', nameEs: 'Onda reticular', icon: '' },
  { id: 'sacred-flame', name: 'Sacred Flame', nameZh: '聖火', nameEs: 'Llama sagrada', icon: '' },
  { id: 'metatrons-cube', name: "Metatron's Cube", nameZh: '梅塔特隆立方', nameEs: 'Cubo de Metatrón', icon: '' },
  { id: 'torus-flower', name: 'Torus Flower', nameZh: '花環流形', nameEs: 'Flor toroidal', icon: '' },
  { id: 'lotus-mandala', name: 'Lotus Mandala', nameZh: '蓮華曼陀羅', nameEs: 'Mandala de loto', icon: '' },
  { id: 'phoenix-spiral', name: 'Phoenix Spiral', nameZh: '鳳凰螺旋', nameEs: 'Espiral fénix', icon: '' },
  { id: 'vesica-piscis', name: 'Vesica Piscis', nameZh: '魚泡聖門', nameEs: 'Vesica Piscis', icon: '' },
  { id: 'crown-chakra', name: 'Crown Chakra', nameZh: '頂輪光冠', nameEs: 'Chakra corona', icon: '' },
  { id: 'cosmic-serpent', name: 'Cosmic Serpent', nameZh: '宇宙靈蛇', nameEs: 'Serpiente cósmica', icon: '' },
  { id: 'prism-field', name: 'Prism Field', nameZh: '稜鏡結界', nameEs: 'Campo prismático', icon: '' },
  { id: 'halo-bloom', name: 'Halo Bloom', nameZh: '光環綻放', nameEs: 'Floración de halo', icon: '' },
  { id: 'infinity-prayer', name: 'Infinity Prayer', nameZh: '無限祈禱', nameEs: 'Oración infinita', icon: '' },
  { id: 'seed-of-life', name: 'Seed of Life', nameZh: '生命之種', nameEs: 'Semilla de la Vida', icon: '' },
  { id: 'egg-of-life', name: 'Egg of Life', nameZh: '生命之卵', nameEs: 'Huevo de la Vida', icon: '' },
  { id: 'fruit-of-life', name: 'Fruit of Life', nameZh: '生命之果', nameEs: 'Fruto de la Vida', icon: '' },
  { id: 'golden-spiral', name: 'Golden Spiral', nameZh: '黃金螺旋', nameEs: 'Espiral áurea', icon: '' },
  { id: 'vector-equilibrium', name: 'Vector Equilibrium', nameZh: '向量平衡體', nameEs: 'Equilibrio vectorial', icon: '' },
  { id: 'curved-merkaba', name: 'Curved Merkaba', nameZh: '曲線梅爾卡巴', nameEs: 'Merkaba curvo', icon: '' },
  { id: 'curved-metatron', name: "Curved Metatron", nameZh: '曲線梅塔特隆', nameEs: 'Metatrón curvo', icon: '' },
  { id: 'unicursal-hexagram', name: 'Unicursal Hexagram', nameZh: '一筆六芒星', nameEs: 'Hexagrama unicursal', icon: '' },
  { id: 'yin-yang-flow', name: 'Yin and Yang', nameZh: '陰陽', nameEs: 'Yin y Yang', icon: '' },
  { id: 'seven-waves', name: 'Seven Waves', nameZh: '七重波', nameEs: 'Siete olas', icon: '' },
  { id: 'snowflake-mandala', name: 'Snowflake Mandala', nameZh: '雪晶曼陀羅', nameEs: 'Mandala de copo de nieve', icon: '' },
  { id: 'golden-circles', name: 'Golden Circles', nameZh: '黃金圓環', nameEs: 'Círculos áureos', icon: '' },
  { id: 'sphere-of-circles', name: 'Sphere of Circles', nameZh: '圓之球域', nameEs: 'Esfera de círculos', icon: '' },
  { id: 'caduceus', name: 'Caduceus', nameZh: '雙蛇杖', nameEs: 'Caduceo', icon: '' },
  { id: 'octagram-star', name: 'Octagram Star', nameZh: '八芒星陣', nameEs: 'Estrella octagrama', icon: '' },
  { id: 'earth', name: 'Earth', nameZh: '地球', nameEs: 'Tierra', icon: '' },
  { id: 'mars', name: 'Mars', nameZh: '火星', nameEs: 'Marte', icon: '' },
  { id: 'venus', name: 'Venus', nameZh: '金星', nameEs: 'Venus', icon: '' },
  { id: 'jupiter', name: 'Jupiter', nameZh: '木星', nameEs: 'Júpiter', icon: '' },
  { id: 'saturn', name: 'Saturn', nameZh: '土星', nameEs: 'Saturno', icon: '' },
  { id: 'neptune', name: 'Neptune', nameZh: '海王星', nameEs: 'Neptuno', icon: '' },
  { id: 'akashic-galaxy', name: 'Akashic Galaxy', nameZh: '阿卡西星系', nameEs: 'Galaxia akáshica', icon: '' },
  { id: 'soul-nebula', name: 'Soul Nebula', nameZh: '靈魂星雲', nameEs: 'Nebulosa del alma', icon: '' },
  { id: 'lotus-galaxy', name: 'Lotus Galaxy', nameZh: '蓮華星系', nameEs: 'Galaxia de loto', icon: '' },
  { id: 'oracle-constellation', name: 'Oracle Constellation', nameZh: '神諭星群', nameEs: 'Constelación oráculo', icon: '' },
  { id: 'ascension-spiral', name: 'Ascension Spiral', nameZh: '揚升螺旋', nameEs: 'Espiral de ascensión', icon: '' },
];

type ShapeDetail = {
  intro: { zh: string; en: string; es?: string };
  use: { zh: string; en: string; es?: string };
  meaning: { zh: string; en: string; es?: string };
};

const getLocalizedShapeName = (
  shape: { name: string; nameZh: string; nameEs: string },
  language: "zh" | "en" | "es"
) => {
  if (language === "zh") return shape.nameZh;
  if (language === "es") return shape.nameEs;
  return shape.name;
};

const getLocalizedShapeDetailText = (
  detail: ShapeDetail | undefined,
  field: keyof ShapeDetail,
  language: "zh" | "en" | "es"
) => {
  if (!detail) return undefined;
  if (language === "zh") return detail[field].zh;
  if (language === "es") return detail[field].es ?? detail[field].en;
  return detail[field].en;
};

const MICRO_PREVIEW_SIZE = 64;
const MICRO_DOT_COUNT = 52;
const MICRO_PREVIEW_GENERATORS: Partial<Record<OrbShape, () => { positions: Float32Array; colors: Float32Array; groups?: Float32Array }>> = {
  'flower-of-life': generateFlowerOfLifeData,
  'flower-of-life-complete': generateFlowerOfLifeCompleteData,
  'star-of-david': generateStarOfDavidData,
  'merkaba': generateMerkabaData,
  'tree-of-life': generateTreeOfLifeData,
  'grid-of-life': generateGridOfLifeData,
  'sri-yantra': generateSriYantraData,
  'triquetra': generateTriquetraData,
  'ring-torus': generateRingTorusData,
  'golden-rectangles': generateGoldenRectanglesData,
  'double-helix-dna': generateDoubleHelixDNAData,
  'vortex-ring': generateVortexRingData,
  'fractal-tree': generateFractalTreeData,
  'wave-interference': generateWaveInterferenceData,
  'quantum-orbitals': generateQuantumOrbitalsData,
  'celtic-knot': generateCelticKnotData,
  'starburst-nova': generateStarburstNovaData,
  'lattice-wave': generateLatticeWaveData,
  'sacred-flame': generateSacredFlameData,
  'metatrons-cube': generateMetatronsCubeData,
  'torus-flower': generateTorusFlowerData,
  'lotus-mandala': generateLotusMandalaData,
  'phoenix-spiral': generatePhoenixSpiralData,
  'vesica-piscis': generateVesicaPiscisData,
  'crown-chakra': generateCrownChakraData,
  'cosmic-serpent': generateCosmicSerpentData,
  'prism-field': generatePrismFieldData,
  'halo-bloom': generateHaloBloomData,
  'infinity-prayer': generateInfinityPrayerData,
  'seed-of-life': generateSeedOfLifeData,
  'egg-of-life': generateEggOfLifeData,
  'fruit-of-life': generateFruitOfLifeData,
  'golden-spiral': generateGoldenSpiralData,
  'vector-equilibrium': generateVectorEquilibriumData,
  'curved-merkaba': generateCurvedMerkabaData,
  'curved-metatron': generateCurvedMetatronData,
  'unicursal-hexagram': generateUnicursalHexagramData,
  'yin-yang-flow': generateYinYangFlowData,
  'seven-waves': generateSevenWavesData,
  'snowflake-mandala': generateSnowflakeMandalaData,
  'golden-circles': generateGoldenCirclesData,
  'sphere-of-circles': generateSphereOfCirclesData,
  'caduceus': generateCaduceusData,
  'octagram-star': generateOctagramStarData,
  'earth': generateEarthData,
  'mars': generateMarsData,
  'venus': generateVenusData,
  'jupiter': generateJupiterData,
  'saturn': generateSaturnData,
  'neptune': generateNeptuneData,
  'akashic-galaxy': generateAkashicGalaxyData,
  'soul-nebula': generateSoulNebulaData,
  'lotus-galaxy': generateLotusGalaxyData,
  'oracle-constellation': generateOracleConstellationData,
  'ascension-spiral': generateAscensionSpiralData,
};

const ShapeMicroPreview = React.memo(function ShapeMicroPreview({ shape }: { shape: OrbShape }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [spin]);

  const dots = useMemo(() => {
    const generator = MICRO_PREVIEW_GENERATORS[shape];
    if (!generator) return [];
    const data = generator();
    const sourceCount = data.positions.length / 3;
    const sampleCount = Math.min(MICRO_DOT_COUNT, sourceCount);
    const sampled: Array<{ x: number; y: number; z: number; color: string }> = [];
    let maxCoord = 0.01;

    for (let i = 0; i < sampleCount; i++) {
      const srcIdx = Math.min(sourceCount - 1, Math.floor((i / sampleCount) * sourceCount));
      const x = data.positions[srcIdx * 3];
      const y = data.positions[srcIdx * 3 + 1];
      const z = data.positions[srcIdx * 3 + 2];
      const r = Math.round((data.colors[srcIdx * 3] ?? 1) * 255);
      const g = Math.round((data.colors[srcIdx * 3 + 1] ?? 1) * 255);
      const b = Math.round((data.colors[srcIdx * 3 + 2] ?? 1) * 255);
      sampled.push({ x, y, z, color: `rgb(${r}, ${g}, ${b})` });
      maxCoord = Math.max(maxCoord, Math.abs(x), Math.abs(y), Math.abs(z));
    }

    return sampled.map((dot, index) => {
      const normalizedX = dot.x / maxCoord;
      const normalizedY = dot.y / maxCoord;
      const normalizedZ = dot.z / maxCoord;
      const depth = (normalizedZ + 1) / 2;
      const size = 2 + depth * 2.2;
      return {
        key: `${shape}-${index}`,
        left: ((normalizedX + 1) * 0.5) * (MICRO_PREVIEW_SIZE - size),
        top: ((normalizedY + 1) * 0.5) * (MICRO_PREVIEW_SIZE - size),
        width: size,
        opacity: 0.42 + depth * 0.46,
        color: dot.color,
      };
    });
  }, [shape]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.shapePreviewWrap}>
      <Animated.View
        style={[
          styles.shapePreviewInner,
          {
            transform: [{ rotateZ: rotate }],
          },
        ]}
      >
        {dots.map((dot) => (
          <View
            key={dot.key}
            style={[
              styles.shapePreviewDot,
              {
                left: dot.left,
                top: dot.top,
                width: dot.width,
                height: dot.width,
                opacity: dot.opacity,
                backgroundColor: dot.color,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
});

const OrbCardPreview = React.memo(function OrbCardPreview({
  shape,
  layers,
}: {
  shape?: OrbShape;
  layers: string[];
}) {
  if (shape && shape !== "default") {
    return (
      <View style={styles.orbShapePreviewWrap}>
        <View style={styles.shapePreviewInner}>
          <ShapeMicroPreview shape={shape} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.orbShapePreviewWrap}>
      <View style={styles.orbPreview}>
        {layers.map((color, i) => (
          <View
            key={`${color}-${i}`}
            style={[
              styles.orbLayer,
              {
                backgroundColor: color,
                width: 14 + i * 6,
                height: 14 + i * 6,
                opacity: 0.88,
              },
            ]}
          />
        ))}
        {layers.length === 0 && (
          <View style={[styles.orbLayer, { backgroundColor: "#ccc", width: 24, height: 24 }]} />
        )}
      </View>
    </View>
  );
});

const shapeDetails: Partial<Record<OrbShape, ShapeDetail>> = {
  'flower-of-life-complete': {
    intro: {
      zh: '由多重交織圓環構成，被視為宇宙生命藍圖的完整展開。',
      en: 'A field of interlocking circles often seen as the complete blueprint of life.',
      es: 'Un campo de círculos entrelazados que suele verse como el plano completo de la vida.',
    },
    use: {
      zh: '適合用於整體平衡、空間淨化、開始新一輪冥想時使用。',
      en: 'Use for full-spectrum balance, space clearing, and starting a new meditation cycle.',
      es: 'Úsalo para equilibrio integral, limpieza del espacio y para iniciar un nuevo ciclo de meditación.',
    },
    meaning: {
      zh: '象徵萬物互聯、創造秩序與生命循環。',
      en: 'Represents interconnected creation, order, and the cycle of life.',
      es: 'Representa la creación interconectada, el orden y el ciclo de la vida.',
    },
  },
  'star-of-david': {
    intro: {
      zh: '上下交疊的雙三角構成力量核心，帶有守護與平衡感。',
      en: 'An interlocking dual-triangle form with a strong sense of protection and balance.',
      es: 'Una forma de doble triángulo entrelazado con una fuerte sensación de protección y equilibrio.',
    },
    use: {
      zh: '適合在想穩定能量場、建立界線、收攝注意力時使用。',
      en: 'Use when you want energetic stability, protection, and focus.',
      es: 'Úsalo cuando busques estabilidad energética, protección y enfoque.',
    },
    meaning: {
      zh: '象徵天地交會、陰陽融合、內外合一。',
      en: 'Symbolizes the meeting of heaven and earth, inner and outer unity.',
      es: 'Simboliza el encuentro entre cielo y tierra, y la unidad de lo interior y lo exterior.',
    },
  },
  'merkaba': {
    intro: {
      zh: '雙四面體反向旋轉的光體結構，是經典靈性載具圖像。',
      en: 'A rotating star-tetrahedron light body, one of the most iconic sacred energy forms.',
      es: 'Un cuerpo de luz en forma de tetraedro estelar giratorio, una de las formas sagradas más icónicas.',
    },
    use: {
      zh: '適合深層冥想、保護場建構、提升覺知時使用。',
      en: 'Use for deep meditation, energetic shielding, and consciousness work.',
      es: 'Úsalo para meditación profunda, protección energética y expansión de la consciencia.',
    },
    meaning: {
      zh: '象徵光、身、心、靈的整合與升維。',
      en: 'Represents the integration of light, body, mind, and spirit.',
      es: 'Representa la integración de luz, cuerpo, mente y espíritu.',
    },
  },
  'tree-of-life': {
    intro: {
      zh: '以十個節點和路徑構成的成長圖譜，像一張靈魂地圖。',
      en: 'A spiritual map of ten spheres and connecting paths, like a diagram of soul growth.',
      es: 'Un mapa espiritual de diez esferas y senderos conectados, como un diagrama del crecimiento del alma.',
    },
    use: {
      zh: '適合在做人生反思、內在整理、長期成長意圖時使用。',
      en: 'Use for reflection, inner alignment, and long-term personal growth.',
      es: 'Úsalo para reflexión, alineación interior y crecimiento personal a largo plazo.',
    },
    meaning: {
      zh: '象徵由物質走向宇宙意識的進化之路。',
      en: 'Represents the path from material life to higher consciousness.',
      es: 'Representa el camino desde la vida material hacia una consciencia más alta.',
    },
  },
  'grid-of-life': {
    intro: {
      zh: '由密集四面體網格組成的生命矩陣，像空間骨架。',
      en: 'A dense tetrahedral matrix that feels like the energetic scaffolding of space.',
      es: 'Una matriz tetraédrica densa que se siente como el armazón energético del espacio.',
    },
    use: {
      zh: '適合做結構化冥想、專注訓練、建立穩固秩序感時使用。',
      en: 'Use for structured meditation, concentration, and energetic grounding.',
      es: 'Úsalo para meditación estructurada, concentración y arraigo energético.',
    },
    meaning: {
      zh: '象徵空間、時間、秩序與顯化結構。',
      en: 'Represents structure, manifestation, and the geometry of space-time.',
      es: 'Representa estructura, manifestación y la geometría del espacio-tiempo.',
    },
  },
  'sri-yantra': {
    intro: {
      zh: '九重三角向中心匯聚，是極具穿透力的專注符號。',
      en: 'Nine interlocking triangles converging toward a center point of immense focus.',
      es: 'Nueve triángulos entrelazados que convergen en un centro de inmensa concentración.',
    },
    use: {
      zh: '適合冥想進入核心、設定豐盛意圖、凝聚心念時使用。',
      en: 'Use for concentration, abundance practice, and focusing intention toward a center.',
      es: 'Úsalo para concentración, prácticas de abundancia y para llevar la intención hacia el centro.',
    },
    meaning: {
      zh: '象徵宇宙陰陽能量的交會與萬有起點。',
      en: 'Represents the union of cosmic masculine and feminine energies.',
      es: 'Representa la unión de las energías cósmicas masculina y femenina.',
    },
  },
  'ring-torus': {
    intro: {
      zh: '一個乾淨而完整的環形托羅斯，像能量自成循環、永不停息地流動。',
      en: 'A clean ring torus that reads as self-circulating energy in continuous motion.',
      es: 'Un toro anular limpio y completo que transmite una energía autocirculante en movimiento continuo.',
    },
    use: {
      zh: '適合呼吸、循環、接地與恢復能量流暢時使用。',
      en: 'Use for breathwork, circulation, grounding, and restoring energetic flow.',
      es: 'Úsalo para respiración, circulación, arraigo y para restaurar el flujo energético.',
    },
    meaning: {
      zh: '象徵自我維持、回流、完整迴圈與場域穩定。',
      en: 'Represents self-sustaining flow, return currents, complete cycles, and field stability.',
      es: 'Representa flujo autosostenido, corrientes de retorno, ciclos completos y estabilidad del campo.',
    },
  },
  'golden-rectangles': {
    intro: {
      zh: '以黃金比例展開的幾何場，帶有自然秩序與優雅節奏。',
      en: 'A golden-ratio field with a natural sense of elegance and proportion.',
      es: 'Un campo geométrico basado en la proporción áurea, con una elegancia y proporción naturales.',
    },
    use: {
      zh: '適合創作、設計靈感、恢復秩序感時使用。',
      en: 'Use for creative work, design inspiration, and restoring inner order.',
      es: 'Úsalo para creatividad, inspiración de diseño y para recuperar el orden interior.',
    },
    meaning: {
      zh: '象徵和諧、美感、自然法則與成長節奏。',
      en: 'Represents harmony, beauty, natural law, and proportional growth.',
      es: 'Representa armonía, belleza, ley natural y crecimiento proporcional.',
    },
  },
  'double-helix-dna': {
    intro: {
      zh: '雙股螺旋粒子像生命密碼被點亮，具強烈生長感。',
      en: 'A luminous double helix that feels like the code of life awakening.',
      es: 'Una doble hélice luminosa que se siente como el código de la vida despertando.',
    },
    use: {
      zh: '適合做自我修復、生命更新、身體覺察相關冥想。',
      en: 'Use for renewal, self-repair, and meditations linked to the body and vitality.',
      es: 'Úsalo para renovación, auto reparación y meditaciones ligadas al cuerpo y la vitalidad.',
    },
    meaning: {
      zh: '象徵生命編碼、演化、遺傳與再生。',
      en: 'Represents life coding, evolution, inheritance, and regeneration.',
      es: 'Representa el código de la vida, evolución, herencia y regeneración.',
    },
  },
  'vortex-ring': {
    intro: {
      zh: '像能量自中心循環吞吐的環狀渦流，充滿流動感。',
      en: 'A ring vortex that appears to breathe energy in and out of a central field.',
      es: 'Un anillo de vórtice que parece inhalar y exhalar energía desde un campo central.',
    },
    use: {
      zh: '適合做呼吸、循環、釋放與回流主題的冥想。',
      en: 'Use for breathwork, circulation, release, and return-flow practices.',
      es: 'Úsalo para respiración, circulación, liberación y prácticas de flujo de retorno.',
    },
    meaning: {
      zh: '象徵循環、流動、轉化與自我維持系統。',
      en: 'Represents flow, transformation, cyclic return, and self-sustaining energy.',
      es: 'Representa flujo, transformación, retorno cíclico y energía autosostenida.',
    },
  },
  'fractal-tree': {
    intro: {
      zh: '分枝不斷延展的樹形粒子，像生命在多層次生長。',
      en: 'A branching fractal tree that visualizes growth across many levels at once.',
      es: 'Un árbol fractal ramificado que visualiza el crecimiento en muchos niveles a la vez.',
    },
    use: {
      zh: '適合做成長、紮根、家族療癒、人生方向冥想。',
      en: 'Use for growth, grounding, ancestry work, and direction-setting.',
      es: 'Úsalo para crecimiento, arraigo, sanación del linaje y para orientar el camino vital.',
    },
    meaning: {
      zh: '象徵根基、延展、代際連結與生命繁盛。',
      en: 'Represents roots, expansion, lineage, and thriving life force.',
      es: 'Representa raíces, expansión, linaje y una fuerza vital floreciente.',
    },
  },
  'wave-interference': {
    intro: {
      zh: '多重波面互相干涉，形成節點與共鳴的能量場。',
      en: 'Interfering wave fields create resonance nodes and shifting energetic patterns.',
      es: 'Campos de ondas interferentes crean nodos de resonancia y patrones energéticos cambiantes.',
    },
    use: {
      zh: '適合聲音冥想、腦波同步、調頻與共振主題。',
      en: 'Use for sound meditation, entrainment, resonance, and frequency work.',
      es: 'Úsalo para meditación sonora, sincronización, resonancia y trabajo de frecuencias.',
    },
    meaning: {
      zh: '象徵頻率互動、共鳴、同步與訊息疊加。',
      en: 'Represents resonance, synchrony, and the interaction of frequencies.',
      es: 'Representa resonancia, sincronía e interacción entre frecuencias.',
    },
  },
  'quantum-orbitals': {
    intro: {
      zh: '粒子如量子雲般繞核浮動，帶有未知與潛能的氣息。',
      en: 'Particles drift like quantum orbitals around a charged center of potential.',
      es: 'Las partículas flotan como orbitales cuánticos alrededor de un centro cargado de potencial.',
    },
    use: {
      zh: '適合做直覺探索、未知領域、靈感觸發型冥想。',
      en: 'Use for intuition, uncertainty work, and meditations that open creative possibility.',
      es: 'Úsalo para intuición, trabajo con lo incierto y meditaciones que abren posibilidades creativas.',
    },
    meaning: {
      zh: '象徵概率、潛能、微觀秩序與不可見結構。',
      en: 'Represents probability, hidden order, and unrealized potential.',
      es: 'Representa probabilidad, orden oculto y potencial no realizado.',
    },
  },
  'celtic-knot': {
    intro: {
      zh: '無起點與終點的結繩回路，呈現連續生命線。',
      en: 'An endless knotwork loop with no obvious beginning or end.',
      es: 'Un lazo celta sin inicio ni final evidente, como una línea de vida continua.',
    },
    use: {
      zh: '適合關係修復、命運主題、長期承諾與守護。',
      en: 'Use for relationship repair, destiny work, devotion, and protection.',
      es: 'Úsalo para reparar relaciones, trabajar el destino, la devoción y la protección.',
    },
    meaning: {
      zh: '象徵永恆、因緣、命運交織與不斷延續。',
      en: 'Represents eternity, interwoven fate, and unbroken continuity.',
      es: 'Representa eternidad, destino entrelazado y continuidad ininterrumpida.',
    },
  },
  'starburst-nova': {
    intro: {
      zh: '向外爆發的星芒像瞬間覺醒，亮度很有衝擊力。',
      en: 'A radiant starburst that feels like a sudden ignition of awareness.',
      es: 'Un estallido estelar radiante que se siente como un encendido súbito de la consciencia.',
    },
    use: {
      zh: '適合突破卡點、激發動能、啟動儀式與高能量狀態。',
      en: 'Use for breakthroughs, activation rituals, and high-energy transitions.',
      es: 'Úsalo para desbloqueos, rituales de activación y transiciones de alta energía.',
    },
    meaning: {
      zh: '象徵爆發、覺醒、釋放與新階段的開啟。',
      en: 'Represents awakening, explosive release, and the opening of a new phase.',
      es: 'Representa despertar, liberación explosiva y el inicio de una nueva fase.',
    },
  },
  'lattice-wave': {
    intro: {
      zh: '晶格結構中流動著波形，兼具秩序與生命感。',
      en: 'A crystalline lattice infused with wave motion, balancing order and vitality.',
      es: 'Una retícula cristalina atravesada por movimiento ondulatorio, equilibrando orden y vitalidad.',
    },
    use: {
      zh: '適合系統性思考、專案規劃、穩定高頻工作節奏。',
      en: 'Use for systems thinking, planning, and sustaining high-frequency focus.',
      es: 'Úsalo para pensamiento sistémico, planificación y para sostener un enfoque de alta frecuencia.',
    },
    meaning: {
      zh: '象徵結構中的流動、秩序中的變化。',
      en: 'Represents movement within structure and change inside order.',
      es: 'Representa movimiento dentro de la estructura y cambio dentro del orden.',
    },
  },
  'sacred-flame': {
    intro: {
      zh: '一團向上躍升的藍白聖火，帶有淨化與轉化力量。',
      en: 'An upward blue-white sacred flame with a strong transformative charge.',
      es: 'Una llama sagrada azul y blanca que asciende con una poderosa carga transformadora.',
    },
    use: {
      zh: '適合清理舊情緒、祈願、重啟狀態與能量提升。',
      en: 'Use for cleansing, prayer, reset rituals, and energetic uplift.',
      es: 'Úsalo para limpiar emociones antiguas, orar, reiniciar estados y elevar la energía.',
    },
    meaning: {
      zh: '象徵淨化、重生、升華與精神火種。',
      en: 'Represents purification, rebirth, transmutation, and spiritual fire.',
      es: 'Representa purificación, renacimiento, transmutación y fuego espiritual.',
    },
  },
  'metatrons-cube': {
    intro: {
      zh: '由 13 個圓與連線衍生的立方網，是二維通往三維的橋。',
      en: "A 13-circle construction whose lines form Metatron's Cube, bridging 2D and 3D order.",
      es: 'Una construcción de 13 círculos cuyas líneas forman el Cubo de Metatrón, uniendo el orden 2D y 3D.',
    },
    use: {
      zh: '適合做結界、清晰思考、整體系統校準。',
      en: 'Use for energetic protection, system calibration, and mental clarity.',
      es: 'Úsalo para protección energética, calibración del sistema y claridad mental.',
    },
    meaning: {
      zh: '象徵神聖秩序、立體化創造、元素結構總圖。',
      en: 'Represents sacred order, dimensional structure, and the matrix of creation.',
      es: 'Representa orden sagrado, estructura dimensional y la matriz de la creación.',
    },
  },
  'torus-flower': {
    intro: {
      zh: '把環面流動與花瓣節奏合成，像會呼吸的能量花。',
      en: 'A floral torus that combines cyclical flow with blooming petal rhythm.',
      es: 'Un toro floral que combina el flujo cíclico con el ritmo de pétalos en flor.',
    },
    use: {
      zh: '適合心輪打開、柔性擴張、流動式冥想。',
      en: 'Use for heart opening, gentle expansion, and flowing meditation.',
      es: 'Úsalo para apertura del corazón, expansión suave y meditación fluida.',
    },
    meaning: {
      zh: '象徵循環、盛放、接收與釋放的平衡。',
      en: 'Represents circulation, blossoming, receptivity, and release.',
      es: 'Representa circulación, florecimiento, receptividad y liberación.',
    },
  },
  'lotus-mandala': {
    intro: {
      zh: '層層蓮瓣圍出中心聖域，視覺上柔和但很聚焦。',
      en: 'Layered lotus petals form a centered mandala with both softness and precision.',
      es: 'Capas de pétalos de loto forman un mandala centrado, suave y preciso a la vez.',
    },
    use: {
      zh: '適合靜心、儀式、睡前收心、女性能量主題。',
      en: 'Use for centering, ritual work, winding down, and feminine-energy meditation.',
      es: 'Úsalo para centrarte, trabajar en rituales, relajarte antes de dormir y meditaciones de energía femenina.',
    },
    meaning: {
      zh: '象徵純淨、盛開、靈性綻放與內在聖殿。',
      en: 'Represents purity, blossoming consciousness, and the inner sanctuary.',
      es: 'Representa pureza, florecimiento espiritual y el santuario interior.',
    },
  },
  'phoenix-spiral': {
    intro: {
      zh: '像鳳凰展翼後化成上升螺旋，充滿復燃感。',
      en: 'A rising spiral that feels like a phoenix taking shape in motion.',
      es: 'Una espiral ascendente que se siente como un fénix tomando forma en movimiento.',
    },
    use: {
      zh: '適合逆境重啟、恢復信心、把低潮轉成動能。',
      en: 'Use for comeback energy, confidence rebuilding, and turning lows into momentum.',
      es: 'Úsalo para recomenzar en la dificultad, reconstruir confianza y convertir los bajos en impulso.',
    },
    meaning: {
      zh: '象徵浴火重生、意志、升起與新生命週期。',
      en: 'Represents rebirth, willpower, ascent, and a renewed life cycle.',
      es: 'Representa renacimiento, voluntad, ascenso y un nuevo ciclo vital.',
    },
  },
  'vesica-piscis': {
    intro: {
      zh: '兩個圓相交形成聖門，是很多神聖圖形的起點。',
      en: 'Two intersecting circles forming a sacred gateway and source pattern.',
      es: 'Dos círculos que se intersectan formando un portal sagrado y un patrón de origen.',
    },
    use: {
      zh: '適合二元整合、關係議題、進入新階段前的冥想。',
      en: 'Use for union work, relationships, and transitions into a new phase.',
      es: 'Úsalo para integrar polaridades, trabajar relaciones y transitar hacia una nueva fase.',
    },
    meaning: {
      zh: '象徵對立融合、天地交匯、門戶與誕生。',
      en: 'Represents union of opposites, sacred threshold, and emergence.',
      es: 'Representa la unión de opuestos, el umbral sagrado y el surgimiento.',
    },
  },
  'crown-chakra': {
    intro: {
      zh: '像頂輪光冠層層開啟，往上與高頻連線。',
      en: 'A crown-like opening of light layers tuned upward to higher frequencies.',
      es: 'Una apertura luminosa en capas, como una corona, afinada hacia frecuencias más altas.',
    },
    use: {
      zh: '適合高我連結、祈禱、靈感下載、靜默冥想。',
      en: 'Use for prayer, higher-self connection, inspiration, and stillness.',
      es: 'Úsalo para oración, conexión con el yo superior, inspiración y quietud.',
    },
    meaning: {
      zh: '象徵開悟、接收、神聖連結與超越自我。',
      en: 'Represents illumination, receptivity, and transcendent connection.',
      es: 'Representa iluminación, receptividad y conexión trascendente.',
    },
  },
  'cosmic-serpent': {
    intro: {
      zh: '靈蛇式上升粒子流，像生命力沿中軸甦醒。',
      en: 'A serpent-like rising current that suggests awakened life force.',
      es: 'Una corriente ascendente similar a una serpiente que sugiere una fuerza vital despierta.',
    },
    use: {
      zh: '適合做力量喚醒、脊柱能量、意志與本能整合。',
      en: 'Use for vitality work, spinal energy, instinct integration, and activation.',
      es: 'Úsalo para activar vitalidad, energía de la columna, integración instintiva y despertar.',
    },
    meaning: {
      zh: '象徵原初生命力、蛻變、智慧與覺醒電流。',
      en: 'Represents primal life force, transformation, wisdom, and awakening current.',
      es: 'Representa fuerza vital primordial, transformación, sabiduría y corriente de despertar.',
    },
  },
  'prism-field': {
    intro: {
      zh: '像光穿過稜鏡後形成的彩色矩陣，理性又神秘。',
      en: 'A prismatic matrix where light seems split into a disciplined spectrum.',
      es: 'Una matriz prismática donde la luz parece dividirse en un espectro ordenado.',
    },
    use: {
      zh: '適合創意發散、腦力整理、多面向思考與靈感拆解。',
      en: 'Use for ideation, mental organization, multi-perspective thinking, and insight mapping.',
      es: 'Úsalo para ideación, organización mental, pensamiento multilateral y mapa de ideas.',
    },
    meaning: {
      zh: '象徵光譜、視角分解、認知擴展與多維信息。',
      en: 'Represents spectrum, refracted perspective, and multidimensional insight.',
      es: 'Representa espectro, perspectiva refractada y comprensión multidimensional.',
    },
  },
  'halo-bloom': {
    intro: {
      zh: '一圈圈光環由中心綻放，像寧靜光場慢慢打開。',
      en: 'Rings of light unfold outward like a calm field gradually blooming open.',
      es: 'Anillos de luz se despliegan hacia afuera como un campo sereno que florece lentamente.',
    },
    use: {
      zh: '適合情緒舒緩、溫柔修復、晚間放鬆與安撫。',
      en: 'Use for soothing emotions, soft repair, evening unwinding, and calm.',
      es: 'Úsalo para calmar emociones, reparar con suavidad, relajarte por la noche y encontrar calma.',
    },
    meaning: {
      zh: '象徵溫柔擴張、療癒、包覆感與光的花開。',
      en: 'Represents gentle expansion, healing, containment, and radiant bloom.',
      es: 'Representa expansión suave, sanación, contención y floración luminosa.',
    },
  },
  'infinity-prayer': {
    intro: {
      zh: '無限符號般的祈禱流線，像心念反覆迴向宇宙。',
      en: 'An infinity-like prayer current that loops intention back into the cosmos.',
      es: 'Una corriente de oración con forma de infinito que devuelve la intención al cosmos.',
    },
    use: {
      zh: '適合許願、回向、感恩、重複型 mantra 練習。',
      en: 'Use for prayer, gratitude, dedication, and repeated mantra-style meditation.',
      es: 'Úsalo para oración, gratitud, dedicación y meditación tipo mantra repetitivo.',
    },
    meaning: {
      zh: '象徵無盡祝福、回流、循環祈願與永續連結。',
      en: 'Represents endless blessing, return flow, cyclical prayer, and unbroken connection.',
      es: 'Representa bendición infinita, flujo de retorno, oración cíclica y conexión continua.',
    },
  },
  'seed-of-life': {
    intro: {
      zh: '七圓結構像生命最初的發芽圖，簡單但非常根本。',
      en: 'A seven-circle origin pattern that feels like the germination point of creation.',
      es: 'Un patrón de siete círculos que se siente como el punto de germinación de la creación.',
    },
    use: {
      zh: '適合新開始、播種意圖、啟動新計劃或習慣時使用。',
      en: 'Use for fresh starts, intention seeding, and launching new habits or projects.',
      es: 'Úsalo para nuevos comienzos, sembrar intención y lanzar nuevos hábitos o proyectos.',
    },
    meaning: {
      zh: '象徵創造萌芽、原初秩序與生命起點。',
      en: 'Represents primordial order, germination, and the beginning of life.',
      es: 'Representa orden primordial, germinación y el comienzo de la vida.',
    },
  },
  'egg-of-life': {
    intro: {
      zh: '八球成形像孕育中的生命場，帶有保護與包覆感。',
      en: 'An eight-sphere womb-like form that carries a strong sense of incubation and protection.',
      es: 'Una forma de ocho esferas, parecida a un vientre, con fuerte sensación de incubación y protección.',
    },
    use: {
      zh: '適合孕育想法、修復期、內在休養與保護性冥想。',
      en: 'Use for incubation, healing periods, rest, and protective meditation.',
      es: 'Úsalo para incubar ideas, periodos de sanación, descanso y meditación protectora.',
    },
    meaning: {
      zh: '象徵誕生前的準備、孕育、包容與保護。',
      en: 'Represents gestation, containment, preparation, and protective becoming.',
      es: 'Representa gestación, contención, preparación y un devenir protegido.',
    },
  },
  'fruit-of-life': {
    intro: {
      zh: '十三節點像創造網絡完全成熟，是更高階的結構母體。',
      en: 'A mature thirteen-node pattern that feels like a fully ripened creation network.',
      es: 'Un patrón maduro de trece nodos que se siente como una red de creación plenamente desarrollada.',
    },
    use: {
      zh: '適合顯化、系統搭建、把靈感變成結構時使用。',
      en: 'Use for manifestation, system building, and turning insight into structure.',
      es: 'Úsalo para manifestación, construcción de sistemas y convertir intuiciones en estructura.',
    },
    meaning: {
      zh: '象徵成熟、顯化、成果與立體結構之源。',
      en: 'Represents maturation, manifestation, fruition, and structural genesis.',
      es: 'Representa maduración, manifestación, fructificación y génesis estructural.',
    },
  },
  'golden-spiral': {
    intro: {
      zh: '隨黃金比例向外展開的螺旋，帶有自然增長的節奏感。',
      en: 'A spiral unfolding with golden-ratio growth, carrying the rhythm of natural expansion.',
      es: 'Una espiral que se despliega con crecimiento áureo y lleva el ritmo de la expansión natural.',
    },
    use: {
      zh: '適合創造力、成長、節奏調整與長線願景冥想。',
      en: 'Use for creativity, growth, pacing, and long-horizon vision work.',
      es: 'Úsalo para creatividad, crecimiento, ajuste de ritmo y visión a largo plazo.',
    },
    meaning: {
      zh: '象徵自然成長、美感秩序與持續擴張。',
      en: 'Represents natural growth, harmonious beauty, and ongoing expansion.',
      es: 'Representa crecimiento natural, belleza armónica y expansión continua.',
    },
  },
  'vector-equilibrium': {
    intro: {
      zh: '一種極致均衡的空間結構，像穩定到發光的幾何核心。',
      en: 'A highly balanced spatial structure that feels like geometry resting in perfect equilibrium.',
      es: 'Una estructura espacial altamente equilibrada, como geometría en reposo perfecto.',
    },
    use: {
      zh: '適合接地、中心校準、平衡左右腦與重整系統時使用。',
      en: 'Use for centering, grounding, system reset, and balancing polarities.',
      es: 'Úsalo para centrarte, arraigarte, reiniciar el sistema y equilibrar polaridades.',
    },
    meaning: {
      zh: '象徵零點平衡、穩定核心與宇宙對稱。',
      en: 'Represents zero-point balance, stable center, and cosmic symmetry.',
      es: 'Representa equilibrio de punto cero, centro estable y simetría cósmica.',
    },
  },
  'curved-merkaba': {
    intro: {
      zh: '把梅爾卡巴的剛性星體改成流線光翼，像光體在呼吸與旋飛。',
      en: 'A softened Merkaba rendered as flowing light-wings, as if the light body is breathing in flight.',
      es: 'Una Merkaba suavizada en forma de alas de luz fluidas, como si el cuerpo de luz respirara en vuelo.',
    },
    use: {
      zh: '適合保護場中加入柔性、修復創傷後重新信任流動時使用。',
      en: 'Use when you want protection without rigidity, especially during repair and re-opening.',
      es: 'Úsalo cuando quieras protección sin rigidez, especialmente durante reparación y reapertura.',
    },
    meaning: {
      zh: '象徵被柔化後的神聖載具、保護中的流動與升維。',
      en: 'Represents a softened light vehicle, fluid protection, and uplifted consciousness.',
      es: 'Representa un vehículo de luz suavizado, protección fluida y consciencia elevada.',
    },
  },
  'curved-metatron': {
    intro: {
      zh: '像梅塔特隆立方在高維中彎曲成光橋，結構感與流動感同時存在。',
      en: "Metatron's Cube bent into a high-dimensional light bridge, holding structure and flow together.",
      es: 'El Cubo de Metatrón doblado en un puente de luz multidimensional, uniendo estructura y flujo.',
    },
    use: {
      zh: '適合系統重組、概念整合、把靈感拉成立體模型時使用。',
      en: 'Use for systems redesign, conceptual integration, and turning insight into dimensional form.',
      es: 'Úsalo para rediseño de sistemas, integración conceptual y dar forma dimensional a una intuición.',
    },
    meaning: {
      zh: '象徵秩序不是僵硬，而是能在更高層次中流動。',
      en: 'Represents order not as rigidity, but as coherent flow across dimensions.',
      es: 'Representa un orden que no es rigidez, sino flujo coherente a través de dimensiones.',
    },
  },
  'unicursal-hexagram': {
    intro: {
      zh: '一筆貫穿完成的六芒星路徑，帶有儀式感與意志穿透力。',
      en: 'A one-stroke hexagram path with a ritual, focused, and penetrating quality.',
      es: 'Un hexagrama de un solo trazo con cualidad ritual, enfocada y penetrante.',
    },
    use: {
      zh: '適合咒語、儀式、專注意志與單點突破時使用。',
      en: 'Use for ritual work, incantation, singular focus, and breakthrough intent.',
      es: 'Úsalo para trabajo ritual, invocación, enfoque singular e intención de ruptura.',
    },
    meaning: {
      zh: '象徵連續意志、完整迴路與不被打斷的神聖專注。',
      en: 'Represents uninterrupted will, complete circuitry, and sacred focus held in one motion.',
      es: 'Representa voluntad ininterrumpida, circuito completo y enfoque sagrado sostenido en un solo gesto.',
    },
  },
  'yin-yang-flow': {
    intro: {
      zh: '參考立體太極雙魚作品重做，現在是前後咬合的 3D 陰陽，旋轉時黑白兩極會交替浮現。',
      en: 'Rebuilt from 3D taijitu references into an interlocking yin-yang form whose two poles alternate as it rotates.',
      es: 'Reconstruido desde referencias 3D del taijitu en una forma yin-yang entrelazada cuyos polos alternan al girar.',
    },
    use: {
      zh: '適合平衡陰陽、整合靜與動、夜與日、月與日的內在節奏。',
      en: 'Use for balancing yin and yang, integrating stillness with action, and harmonizing lunar and solar rhythms.',
      es: 'Úsalo para equilibrar yin y yang, integrar quietud con acción y armonizar ritmos lunares y solares.',
    },
    meaning: {
      zh: '象徵吸收與發散、黑夜與白晝、月與日，以及宇宙萬物中相反而互補的雙力。',
      en: 'Represents absorption and radiance, night and day, moon and sun, and the complementary dual force in all things.',
      es: 'Representa absorción y radiancia, noche y día, luna y sol, y la fuerza dual complementaria en todas las cosas.',
    },
  },
  'seven-waves': {
    intro: {
      zh: '七層波帶像頻率階梯一樣推進，視覺上有明確的脈衝節奏。',
      en: 'Seven layered wave bands move like a ladder of frequencies with a clear pulsing rhythm.',
      es: 'Siete bandas de ondas superpuestas avanzan como una escalera de frecuencias con ritmo pulsante claro.',
    },
    use: {
      zh: '適合聲頻、脈輪調頻、呼吸節奏與能量掃描。',
      en: 'Use for sound work, chakra tuning, breath cadence, and energetic scanning.',
      es: 'Úsalo para trabajo sonoro, afinación de chakras, ritmo respiratorio y escaneo energético.',
    },
    meaning: {
      zh: '象徵七重頻率、層次覺察與由低到高的調諧。',
      en: 'Represents sevenfold frequency, layered awareness, and progressive attunement.',
      es: 'Representa frecuencia séptuple, consciencia por capas y sintonización progresiva.',
    },
  },
  'snowflake-mandala': {
    intro: {
      zh: '六向對稱像雪晶瞬間凝成的聖圖，冷靜、純淨而精細。',
      en: 'A sixfold snow-crystal mandala that feels pure, precise, and crystalline.',
      es: 'Un mandala de cristal de nieve de seis direcciones que se siente puro, preciso y cristalino.',
    },
    use: {
      zh: '適合降噪、冷靜心念、收斂雜亂與冬季靜心。',
      en: 'Use for cooling the mind, reducing noise, refining thought, and winter stillness.',
      es: 'Úsalo para enfriar la mente, reducir ruido, refinar el pensamiento y cultivar quietud invernal.',
    },
    meaning: {
      zh: '象徵純淨秩序、獨特結晶與寂靜中的美。',
      en: 'Represents pure order, unique crystallization, and beauty born in stillness.',
      es: 'Representa orden puro, cristalización única y belleza nacida del silencio.',
    },
  },
  'golden-circles': {
    intro: {
      zh: '一圈圈依黃金比例擴展的圓環，像自然生長的時間年輪。',
      en: 'Concentric circles expanding by golden proportion, like the rings of natural time and growth.',
      es: 'Círculos concéntricos que se expanden por proporción áurea, como anillos del tiempo y del crecimiento.',
    },
    use: {
      zh: '適合長線規劃、穩步成長、把焦躁拉回優雅節奏。',
      en: 'Use for long-range planning, steady growth, and returning impatience to elegant pacing.',
      es: 'Úsalo para planificación a largo plazo, crecimiento constante y devolver la impaciencia a un ritmo elegante.',
    },
    meaning: {
      zh: '象徵自然比例、成熟節奏與循環擴展。',
      en: 'Represents natural proportion, mature rhythm, and cyclical expansion.',
      es: 'Representa proporción natural, ritmo maduro y expansión cíclica.',
    },
  },
  'sphere-of-circles': {
    intro: {
      zh: '很多圓環共同構成一個球域，像宇宙用圓的語言包裹空間。',
      en: 'A globe made of many circles, as though space itself were woven out of circular laws.',
      es: 'Un globo hecho de muchos círculos, como si el espacio estuviera tejido con leyes circulares.',
    },
    use: {
      zh: '適合做整體觀、空間感、宇宙連結與世界觀冥想。',
      en: 'Use for wholeness, spatial awareness, cosmic connection, and systems-level contemplation.',
      es: 'Úsalo para percepción de totalidad, consciencia espacial, conexión cósmica y contemplación sistémica.',
    },
    meaning: {
      zh: '象徵整體性、天體秩序與局部即整體的觀念。',
      en: 'Represents wholeness, celestial order, and the idea that each part reflects the whole.',
      es: 'Representa totalidad, orden celeste y la idea de que cada parte refleja el todo.',
    },
  },
  'caduceus': {
    intro: {
      zh: '雙蛇沿中軸交纏上升，帶有治療、平衡與甦醒感。',
      en: 'Twin serpents rise around a central axis, carrying healing, balance, and awakening energy.',
      es: 'Serpientes gemelas ascienden alrededor de un eje central, llevando sanación, equilibrio y despertar.',
    },
    use: {
      zh: '適合身體修復、左右能量整合、脊柱與生命力主題。',
      en: 'Use for healing, left-right integration, spinal alignment, and life-force practices.',
      es: 'Úsalo para sanación, integración izquierda-derecha, alineación de la columna y prácticas de fuerza vital.',
    },
    meaning: {
      zh: '象徵療癒、雙流匯合、訊息傳導與神聖醫道。',
      en: 'Represents healing, dual-current integration, transmission, and the sacred art of restoration.',
      es: 'Representa sanación, integración de corrientes duales, transmisión y el arte sagrado de restaurar.',
    },
  },
  'octagram-star': {
    intro: {
      zh: '八向放射的星陣像一個穩定又開展的門戶，兼具秩序與榮耀感。',
      en: 'An eight-rayed stellar gate with both stable structure and ceremonial radiance.',
      es: 'Una puerta estelar de ocho rayos con estructura estable y brillo ceremonial.',
    },
    use: {
      zh: '適合開門儀式、方向校準、願景展開與保護空間。',
      en: 'Use for opening rituals, directional alignment, vision expansion, and protective space work.',
      es: 'Úsalo para rituales de apertura, alineación direccional, expansión de visión y trabajo de protección.',
    },
    meaning: {
      zh: '象徵八方展開、守門、顯化入口與星性指引。',
      en: 'Represents expansion to the eight directions, guardianship, manifestation portals, and stellar guidance.',
      es: 'Representa expansión hacia las ocho direcciones, guardianía, portales de manifestación y guía estelar.',
    },
  },
  'earth': {
    intro: {
      zh: '把地球視為呼吸中的藍色生命體，帶有很強的現實連結。',
      en: 'A breathing Earth-form that grounds the practice in the living world.',
      es: 'Una forma terrestre que respira y enraíza la práctica en el mundo vivo.',
    },
    use: {
      zh: '適合接地、世界關懷、現實整合與恢復身體感。',
      en: 'Use for grounding, world connection, embodiment, and returning to reality.',
      es: 'Úsalo para arraigo, conexión con el mundo, encarnación y regreso a la realidad.',
    },
    meaning: {
      zh: '象徵接地、整體生命網絡與共同存在。',
      en: 'Represents grounding, planetary connection, and shared existence.',
      es: 'Representa arraigo, conexión planetaria y existencia compartida.',
    },
  },
  'mars': {
    intro: {
      zh: '火星是帶著紅塵與峽谷感的行動之球，氣質直接、乾燥、銳利。',
      en: 'Mars is a red, canyon-scarred world of direct action, heat, and momentum.',
      es: 'Marte es un mundo rojo y surcado por cañones, de acción directa, calor e impulso.',
    },
    use: {
      zh: '適合決斷、重啟行動力、切斷拖延與喚回勇氣。',
      en: 'Use for courage, decisive movement, restarting momentum, and cutting through hesitation.',
      es: 'Úsalo para coraje, decisión, reactivar impulso y cortar la vacilación.',
    },
    meaning: {
      zh: '象徵戰意、意志、前進與把想法落地。',
      en: 'Represents will, drive, confrontation, and making ideas real.',
      es: 'Representa voluntad, impulso, confrontación y hacer reales las ideas.',
    },
  },
  'venus': {
    intro: {
      zh: '金星以厚雲與金霧構成，整體更柔、更包裹，也更有感官層次。',
      en: 'Venus is wrapped in golden cloud bands, softening the form into a sensual, luminous sphere.',
      es: 'Venus está envuelta en nubes doradas, suavizando la forma en una esfera luminosa y sensual.',
    },
    use: {
      zh: '適合愛、自我價值、吸引力、關係修復與柔化內在張力。',
      en: 'Use for love, self-worth, attraction, relational healing, and softening inner tension.',
      es: 'Úsalo para amor, autoestima, magnetismo, sanación relacional y suavizar tensión interior.',
    },
    meaning: {
      zh: '象徵美感、滋養、磁場與溫柔的力量。',
      en: 'Represents beauty, nourishment, magnetism, and the power of softness.',
      es: 'Representa belleza, nutrición, magnetismo y el poder de la suavidad.',
    },
  },
  'jupiter': {
    intro: {
      zh: '木星以橫向氣流與巨大風暴為主體，像一顆正在擴張的智慧巨人。',
      en: 'Jupiter is built from immense flowing bands and a storm-heart, like a giant mind in motion.',
      es: 'Júpiter está hecho de bandas inmensas y un corazón tormentoso, como una mente gigante en movimiento.',
    },
    use: {
      zh: '適合擴張視野、增強信念、學習、豐盛與大局思維。',
      en: 'Use for expansion, faith, study, abundance, and seeing the larger pattern.',
      es: 'Úsalo para expansión, fe, estudio, abundancia y ver el patrón más amplio.',
    },
    meaning: {
      zh: '象徵成長、祝福、遠見與更大的可能性。',
      en: 'Represents growth, blessing, foresight, and greater possibility.',
      es: 'Representa crecimiento, bendición, visión amplia y mayor posibilidad.',
    },
  },
  'saturn': {
    intro: {
      zh: '土星結合穩定球體與外環結構，視覺上更像一個有秩序的宇宙裝置。',
      en: 'Saturn combines a calm planetary core with rings that read like architecture in orbit.',
      es: 'Saturno combina un núcleo planetario sereno con anillos que parecen arquitectura en órbita.',
    },
    use: {
      zh: '適合界線、紀律、長期計劃、耐心與建立結構。',
      en: 'Use for boundaries, discipline, patience, long-term planning, and structural clarity.',
      es: 'Úsalo para límites, disciplina, paciencia, planificación a largo plazo y claridad estructural.',
    },
    meaning: {
      zh: '象徵秩序、時間、責任與成熟後的力量。',
      en: 'Represents order, time, responsibility, and mature strength.',
      es: 'Representa orden, tiempo, responsabilidad y fuerza madura.',
    },
  },
  'neptune': {
    intro: {
      zh: '海王星是深藍流體感很強的星球，帶有風暴與夢境般的遠距離感。',
      en: 'Neptune is a deep blue storm-world with a dreamlike, distant, fluid presence.',
      es: 'Neptuno es un mundo azul profundo y tormentoso, con una presencia fluida, distante y onírica.',
    },
    use: {
      zh: '適合靈感、夢境、感應、想像力與沉入更深的內在海洋。',
      en: 'Use for intuition, dreams, imagination, sensitivity, and descending into the inner ocean.',
      es: 'Úsalo para intuición, sueños, imaginación, sensibilidad y descender al océano interior.',
    },
    meaning: {
      zh: '象徵神祕、直覺、溶解邊界與靈性深流。',
      en: 'Represents mystery, intuition, dissolving boundaries, and spiritual depth.',
      es: 'Representa misterio, intuición, disolución de límites y profundidad espiritual.',
    },
  },
  'akashic-galaxy': {
    intro: {
      zh: '像記錄場一樣向外展開的靈性星系，帶有中心光核與知識旋臂。',
      en: 'A spiritual galaxy with a radiant core and record-like spiral arms of memory and insight.',
      es: 'Una galaxia espiritual con núcleo radiante y brazos espirales como archivos de memoria e intuición.',
    },
    use: {
      zh: '適合冥想提問、接收指引、回看靈魂經驗與進入更高視角。',
      en: 'Use for inquiry, guidance, soul recall, and entering a higher perspective.',
      es: 'Úsalo para indagación, recibir guía, recordar experiencias del alma y entrar en una perspectiva más alta.',
    },
    meaning: {
      zh: '象徵阿卡西記錄、宇宙記憶、靈魂資料庫與高維連線。',
      en: 'Represents the Akashic field, cosmic memory, the soul archive, and higher-dimensional connection.',
      es: 'Representa el campo akáshico, memoria cósmica, archivo del alma y conexión multidimensional.',
    },
  },
  'soul-nebula': {
    intro: {
      zh: '這是一團有情感溫度的星雲，像靈魂在宇宙中發光又呼吸。',
      en: 'A feeling-rich nebula that reads like the soul breathing and glowing in space.',
      es: 'Una nebulosa cargada de emoción que se siente como el alma respirando y brillando en el espacio.',
    },
    use: {
      zh: '適合療癒、情緒釋放、自愛、靜心與軟化內在防衛。',
      en: 'Use for healing, emotional release, self-love, softness, and restorative stillness.',
      es: 'Úsalo para sanación, liberación emocional, amor propio, suavidad y quietud restauradora.',
    },
    meaning: {
      zh: '象徵靈魂本質、感受力、修復與溫柔的自我擁抱。',
      en: 'Represents soul essence, sensitivity, restoration, and tender self-embrace.',
      es: 'Representa esencia del alma, sensibilidad, restauración y un abrazo interno tierno.',
    },
  },
  'lotus-galaxy': {
    intro: {
      zh: '把蓮花的開展感與星系旋流結合，既神聖也帶有宇宙誕生感。',
      en: 'A hybrid of lotus bloom and galactic spin, sacred and cosmically generative at once.',
      es: 'Una fusión entre flor de loto y giro galáctico, sagrada y generativa a la vez.',
    },
    use: {
      zh: '適合開心輪、提升頻率、靈性綻放與進入更優雅的專注。',
      en: 'Use for heart opening, energetic uplift, spiritual flowering, and graceful focus.',
      es: 'Úsalo para abrir el corazón, elevar la energía, florecer espiritualmente y enfocar con gracia.',
    },
    meaning: {
      zh: '象徵純淨綻放、神聖女性、誕生與靈性開花。',
      en: 'Represents purity, sacred blooming, divine femininity, and spiritual unfolding.',
      es: 'Representa pureza, florecimiento sagrado, feminidad divina y despliegue espiritual.',
    },
  },
  'oracle-constellation': {
    intro: {
      zh: '像占星圖與星際網格之間的結合，點與線都像在傳遞神諭。',
      en: 'A fusion of star map and spiritual grid, where nodes and threads feel like messages in transit.',
      es: 'Una fusión de mapa estelar y red espiritual, donde nodos y líneas parecen transmitir mensajes.',
    },
    use: {
      zh: '適合占卜、校準方向、提出問題、尋找同步與辨認徵兆。',
      en: 'Use for divination, alignment, asking questions, seeking synchronicity, and reading signs.',
      es: 'Úsalo para adivinación, alineación, hacer preguntas, buscar sincronías y leer señales.',
    },
    meaning: {
      zh: '象徵天象訊息、神諭、命運座標與宇宙回應。',
      en: 'Represents celestial messages, oracle guidance, fate coordinates, and cosmic response.',
      es: 'Representa mensajes celestes, guía oracular, coordenadas del destino y respuesta cósmica.',
    },
  },
  'ascension-spiral': {
    intro: {
      zh: '一條往上拉升的靈性能量柱，像意識沿螺旋階梯持續上升。',
      en: 'An upward spiritual current shaped like a spiral ladder of consciousness.',
      es: 'Una corriente espiritual ascendente con forma de escalera espiral de consciencia.',
    },
    use: {
      zh: '適合提振、穿越低潮、轉頻、進入更高振動與清理停滯。',
      en: 'Use for uplift, clearing stagnation, changing frequency, and entering a higher vibration.',
      es: 'Úsalo para elevarte, limpiar estancamientos, cambiar frecuencia y entrar en una vibración más alta.',
    },
    meaning: {
      zh: '象徵揚升、轉化、突破舊層次與往更高意識攀升。',
      en: 'Represents ascension, transformation, breakthrough, and rising into a wider state of awareness.',
      es: 'Representa ascensión, transformación, ruptura de viejos niveles y ascenso hacia una consciencia más amplia.',
    },
  },
};

export default function GardenScreen() {
  const { giftDraft, openGift } = useLocalSearchParams<{ giftDraft?: string; openGift?: string }>();
  const { currentTheme, settings } = useSettings();
  const tr = (zh: string, en: string, es: string) => {
    if (settings.language === "zh") return zh;
    if (settings.language === "es") return es;
    return en;
  };
  const insets = useSafeAreaInsets();
  const webGLAvailable = canUseWebGL();
  const navigation = useNavigation();
  const firebaseEnabled = isFirebaseEnabled();
  const firebaseMissingEnv = getFirebaseMissingEnv();
  
  const { 
    currentOrb, 
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
    dailyAwakeningMinutesRequired,
    canUseShape,
    getShapeUnlockMission,
    getShapeAccessMeta,
    orbDisplayMode,
    setOrbDisplayMode,
    setSharedSpinVelocity,
    resonanceState,
    isOrbAuraActive,
    unlockOrbAura,
    hasAmbientPassToday,
    unlockAmbientPass,
    unlockBlessingBoost,
    consumeBlessingBoost,
    recordBlessingSent,
  } = useMeditation();
  const isAmbientPassActive = hasAmbientPassToday;

  // Refs for stale closure fix in PanResponder
  const currentOrbRef = useRef(currentOrb);
  const storeOrbRef = useRef(storeOrb);
  
  useEffect(() => {
    currentOrbRef.current = currentOrb;
    storeOrbRef.current = storeOrb;
  }, [currentOrb, storeOrb]);
  
  const [isOrbDragging, setIsOrbDragging] = useState<boolean>(false);
  const isOrbDraggingRef = useRef<boolean>(false);
  const {
    isDrawerExpanded,
    drawerHeight,
    drawerPanResponder,
    animateDrawerTo,
    revealDrawer,
    collapseDrawer,
  } = useGardenDrawer({
    collapsedHeight: COLLAPSED_DRAWER_HEIGHT,
    expandedHeight: EXPANDED_DRAWER_HEIGHT,
  });

  // Meditation State
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(0);
  const [showAwakenedModal, setShowAwakenedModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [awakenedIntention, setAwakenedIntention] = useState("");
  const [awakenedDuration, setAwakenedDuration] = useState(15);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShapeLockedModal, setShowShapeLockedModal] = useState(false);
  const [previewOrb, setPreviewOrb] = useState<Orb | null>(null);
  const [buyingBlessingBoost, setBuyingBlessingBoost] = useState(false);
  const [lightingOrbAura, setLightingOrbAura] = useState(false);
  const [unlockingAmbientPass, setUnlockingAmbientPass] = useState(false);
  const defaultBlessingMessage = tr(
    "願愛與能量永流",
    "May love and energy flow forever.",
    "Que el amor y la energía fluyan para siempre."
  );
  const captureGiftOrbSnapshot = useCallback(
    (): GiftOrbSnapshot => ({
      level: currentOrbRef.current.level,
      layers: [...(currentOrbRef.current.layers ?? [])],
      isAwakened: Boolean(currentOrbRef.current.isAwakened),
      createdAt: currentOrbRef.current.createdAt || new Date().toISOString(),
      shape: currentOrbRef.current.shape,
    }),
    []
  );
  const modeResetTimeoutRef = useRef<any>(null); // Safety timeout for mode reset
  const meditationTimerRef = useRef<any>(null);
  const handleGiftSuccessRef = useRef<(contact: any) => void>(() => {});
  const miniKitSubscribedRef = useRef(false);
  const miniKitInstanceRef = useRef<any | null>(null);
  const miniKitPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const miniKitLoggedMissingRef = useRef(false);
  const pauseMiniKitAutoSubscribeRef = useRef(false);
  const giftSoundRef = useRef<Audio.Sound | null>(null);
  const ambientSoundRef = useRef<Audio.Sound | null>(null);
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const useShareContactsAsyncOnly = false;
  const CONTACT_SELECTION_TIMEOUT_MS = 90000;
  const isOrbAwakened = IS_DEV_FULL_MOCK ? true : currentOrb.isAwakened;
  const totalAmbientSoundCount = AMBIENT_SOUND_CATEGORIES.reduce((sum, category) => sum + category.sounds.length, 0);
  const ambientLabelLanguage = settings.language === "zh" ? "zh" : settings.language === "es" ? "es" : "en";
  const vipAmbientSoundCount = totalAmbientSoundCount - FREE_AMBIENT_SOUND_IDS.length;
  const firebaseDiagnostics = getFirebaseDiagnosticsFn();
  const { walletAddress, profile, hasActiveVIP } = useUser();
  const {
    giftHistoryReady,
    giftHistoryError,
    localGiftOutbox,
    displayedSentBlessings,
    recentGiftRecipients,
    refreshSentBlessingHistory,
    persistLocalGiftOutbox,
    stageLocalGiftRecord,
  } = useSentBlessingHistory({
    walletAddress,
    username: profile.username || null,
    language: settings.language,
  });
  const {
    giftMessage,
    setGiftMessage,
    manualGiftRecipient,
    setManualGiftRecipient,
    isGiftingUI,
    setIsGiftingUI,
    giftingError,
    setGiftingError,
    giftDebugMessage,
    setGiftDebugMessage,
    giftDeliveryState,
    buildGiftBlessingText,
    clearShareContactsTimeout,
    scheduleShareContactsTimeout,
    updateGiftDeliveryState,
    resetGiftUiState,
    isGiftingRef,
    hasAttemptedGiftRef,
    giftUploadAttemptRef,
    giftSuccessHandledRef,
    pendingShareContactsRef,
    activeGiftRequestIdRef,
  } = useGardenGifting({
    language: settings.language,
    defaultBlessingMessage,
    blessingBoostCharges: resonanceState.blessingBoostCharges,
    onTimeout: async (pendingRequestId) => {
      void stageLocalGiftRecord({
        giftId: pendingRequestId,
        createdAt: new Date().toISOString(),
        toWalletAddress: "",
        friendName: settings.language === "zh" ? "等待選擇的好友" : settings.language === "es" ? "Contacto pendiente" : "Pending contact",
        blessing:
          giftMessage ||
          (settings.language === "zh"
            ? "願愛與能量永流"
            : "May love and energy flow forever."),
        status: "failed",
      }, captureGiftOrbSnapshot());
      updateGiftDeliveryState({
        status: "failed",
        friendName: settings.language === "zh" ? "等待選擇的好友" : settings.language === "es" ? "Contacto pendiente" : "Pending contact",
      });
      revealGiftHistoryPanel();
      const message =
        settings.language === "zh"
          ? "World App 沒有返回聯絡人結果，傳送流程已逾時。"
          : "World App did not return a contact result. Gift flow timed out.";
      setGiftDebugMessage(message);
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "傳送逾時" : settings.language === "es" ? "El regalo agotó el tiempo" : "Gift timed out",
        message
      );
    },
  });
  const consumedDraftRef = useRef<string | null>(null);

  useEffect(() => {
    const nextDraft = typeof giftDraft === "string" ? giftDraft.trim() : "";
    if (!nextDraft) return;
    if (consumedDraftRef.current === nextDraft) return;
    consumedDraftRef.current = nextDraft;
    setGiftMessage(nextDraft);
    if (openGift === "1") {
      setShowGiftModal(true);
    }
  }, [giftDraft, openGift, setGiftMessage]);

  const summarizeGiftPayload = (payload: any) => {
    if (!payload || typeof payload !== "object") return "no-payload";
    const keys = Object.keys(payload).slice(0, 8);
    return keys.join(", ") || "empty-payload";
  };

  const revealGiftHistoryPanel = () => {
    revealDrawer();
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
      return getWorldAppUpdateRequiredMessage(settings.language);
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
      return null;
    }
    const result = await shareContactsAsyncFn?.(payload);
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
    const shareContactsEvent = ResponseEvent?.MiniAppShareContacts;
    if (!shareContactsEvent) {
      return false;
    }
    if (miniKitInstanceRef.current && miniKitInstanceRef.current !== candidate) {
      try {
        miniKitInstanceRef.current.unsubscribe(shareContactsEvent);
      } catch (error) {
        console.warn("[DEBUG_GIFT] MiniKit unsubscribe failed:", error);
      }
      miniKitSubscribedRef.current = false;
    }
    if (miniKitSubscribedRef.current && miniKitInstanceRef.current === candidate) {
      return true;
    }
    candidate.subscribe(shareContactsEvent, onEvent);
    miniKitSubscribedRef.current = true;
    miniKitInstanceRef.current = candidate;
    return true;
  };

  const handleMiniKitShareContactsEvent = async (payload: any) => {
    const payloadRoot = payload?.finalPayload || payload;
    const status = payloadRoot?.status;
    setGiftDebugMessage(
      `${tr("聯絡人事件", "Contacts event", "Evento de contactos")}: ${summarizeGiftPayload(payloadRoot)}`
    );
    if (status === "error") {
      const errorCode = payloadRoot?.error_code || payloadRoot?.error?.code || payloadRoot?.error?.message || payloadRoot?.message || "unknown";
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      isGiftingRef.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        tr("選擇朋友失敗", "Friend selection failed", "Falló la selección del contacto"),
        tr(
          `選擇朋友失敗，請重試\n錯誤原因：${errorCode}`,
          `Friend selection failed. Please retry.\nReason: ${errorCode}`,
          `Falló la selección del contacto. Inténtalo de nuevo.\nMotivo: ${errorCode}`
        )
      );
      return;
    }

    const contacts = extractContactsFromPayload(payload?.finalPayload || payload);
    const contact = contacts[0];
    const selectedUsername = extractContactUsername(contact);
    const selectedWalletAddress = await resolveContactWalletAddress(contact, resolveMiniKit());
    if (selectedWalletAddress || selectedUsername) {
      setGiftDebugMessage(
        settings.language === "zh"
          ? `已解析收件人：${selectedUsername ? `@${selectedUsername}` : selectedWalletAddress}`
          : settings.language === "es"
            ? `Destinatario resuelto: ${selectedUsername ? `@${selectedUsername}` : selectedWalletAddress}`
            : `Resolved recipient: ${selectedUsername ? `@${selectedUsername}` : selectedWalletAddress}`
      );
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      handleGiftSuccessRef.current(contact);
    } else {
      pendingShareContactsRef.current = false;
      clearShareContactsTimeout();
      isGiftingRef.current = false;
      setIsGiftingUI(false);
      setGiftDebugMessage(
        settings.language === "zh"
          ? `聯絡人事件返回但沒有地址。payload keys: ${summarizeGiftPayload(payloadRoot)}`
          : settings.language === "es"
            ? `El evento del contacto volvió sin dirección. claves del payload: ${summarizeGiftPayload(payloadRoot)}`
            : `Contact event returned without address. payload keys: ${summarizeGiftPayload(payloadRoot)}`
      );
      Alert.alert(
        tr("選擇朋友失敗", "Friend selection failed", "Falló la selección del contacto"),
        tr(
          "聯絡人事件返回了，但沒有錢包地址。",
          "A contact result came back, but no wallet address was included.",
          "Volvió un resultado del contacto, pero no incluía dirección de billetera."
        )
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
          const shareContactsEvent = ResponseEvent?.MiniAppShareContacts;
          if (shareContactsEvent) {
            miniKitInstanceRef.current.unsubscribe(shareContactsEvent);
          }
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (meditationTimerRef.current) clearInterval(meditationTimerRef.current);
      if (modeResetTimeoutRef.current) clearTimeout(modeResetTimeoutRef.current);
      clearShareContactsTimeout();
    };
  }, []);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          if (giftSoundRef.current) {
            await giftSoundRef.current.unloadAsync();
            giftSoundRef.current = null;
          }
          if (ambientSoundRef.current) {
            await ambientSoundRef.current.unloadAsync();
            ambientSoundRef.current = null;
          }
        } catch (e) {
          console.warn("[DEBUG_GIFT] Failed to unload sounds:", e);
        }
      };

      void cleanup();
    };
  }, []);

  useEffect(() => {
    const loadAmbientSound = async () => {
      try {
        if (ambientSoundRef.current) {
          await ambientSoundRef.current.unloadAsync();
          ambientSoundRef.current = null;
        }

        if (selectedAmbientSound) {
          let soundUrl: string | null = null;
          for (const category of AMBIENT_SOUND_CATEGORIES) {
            const sound = category.sounds.find(s => s.id === selectedAmbientSound);
            if (sound) {
              soundUrl = sound.url;
              break;
            }
          }

          if (soundUrl) {
            const { sound: audioSound } = await Audio.Sound.createAsync(
              { uri: soundUrl },
              { shouldPlay: true, isLooping: true, volume: ambientVolume }
            );
            ambientSoundRef.current = audioSound;
            console.log("[GARDEN] Ambient sound loaded and playing:", selectedAmbientSound);
          }
        }
      } catch (error) {
        console.error('[GARDEN] Error loading ambient sound:', error);
      }
    };

    loadAmbientSound();
  }, [selectedAmbientSound, ambientVolume]);

  useEffect(() => {
    const updateAmbientVolume = async () => {
      if (ambientSoundRef.current) {
        await ambientSoundRef.current.setVolumeAsync(ambientVolume);
      }
    };
    updateAmbientVolume();
  }, [ambientVolume]);

  useEffect(() => {
    const controlAmbientPlayback = async () => {
      if (ambientSoundRef.current) {
        if (isMeditating) {
          await ambientSoundRef.current.playAsync();
        }
      }
    };
    controlAmbientPlayback();
  }, [isMeditating]);
  
  const handleOrbSelect = (orb: Orb) => {
    setPreviewOrb(orb);
  };

  const handleSentBlessingSelect = (gift: GiftHistoryEntry) => {
    setPreviewOrb({
      id: gift.giftId,
      level: gift.orb?.level ?? 0,
      layers: gift.orb?.layers ?? [],
      isAwakened: Boolean(gift.orb?.isAwakened),
      createdAt: gift.createdAt,
      shape: (gift.orb?.shape as OrbShape | undefined) ?? "default",
      sender:
        settings.language === "zh"
          ? `你送給 ${(gift as any).friendName || (gift as any).toUsername || gift.to || "好友"}`
          : `You sent this to ${(gift as any).friendName || (gift as any).toUsername || gift.to || "a friend"}`,
      message: gift.blessing,
      isBlessingGift: true,
    });
  };

  const blessingHistory = useMemo(
    () =>
      orbHistory
        .filter((orb) => orb.isBlessingGift)
        .sort((a, b) => {
          const aBoosted = Boolean(a.resonanceBlessed) || blessingHasResonanceMark(a.message);
          const bBoosted = Boolean(b.resonanceBlessed) || blessingHasResonanceMark(b.message);
          if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
          return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        }),
    [orbHistory]
  );

  const cultivatedOrbHistory = useMemo(
    () => orbHistory.filter((orb) => !orb.isBlessingGift),
    [orbHistory]
  );

  const cultivatedCollectionHistory = useMemo(
    () => cultivatedOrbHistory.filter((orb) => !orb.isVipGiftedStarter),
    [cultivatedOrbHistory]
  );

  const seenBlessingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(blessingHistory.map((orb) => orb.id));
    const newlyReceived = blessingHistory.find((orb) => !seenBlessingIdsRef.current.has(orb.id));

    if (newlyReceived) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        settings.language === "zh" ? "✨ 收到祝福" : settings.language === "es" ? "✨ Bendición recibida" : "✨ Blessing Received",
        settings.language === "zh"
          ? `你收到來自 ${newlyReceived.sender || "朋友"} 的祝福光球`
          : `You received a blessing orb from ${newlyReceived.sender || "Friend"}`
      );
    }

    seenBlessingIdsRef.current = currentIds;
  }, [blessingHistory, settings.language]);

  const giftBlessingPreviewText = buildGiftBlessingText();
  
  // Chakra Collection Logic
  const collectionProgress = useMemo(() => {
    // Collect one orb of each level (1-7) to complete the rainbow
    const stats = new Array(7).fill(false);
    cultivatedCollectionHistory.forEach(orb => {
       if (orb.level >= 1 && orb.level <= 7) {
         stats[orb.level - 1] = true; 
       }
    });
    return stats;
  }, [cultivatedCollectionHistory]);
  
  const collectedCount = collectionProgress.filter(Boolean).length;

  const interactionState = useRef({ mode: 'idle', spinVelocity: 0, spinVelocityX: 0, progress: 0 });
  const progressOverlayRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const GATHER_DURATION = 7 * 60 * 1000; 
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const shapeScrollRef = useRef<ScrollView>(null);
  const shapeItemLayoutsRef = useRef<Record<string, number>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenFadeAnim = useRef(new Animated.Value(0)).current;

  const fullscreenOrbOffsetX = useRef(new Animated.Value(0)).current;
  const fullscreenOrbOffsetY = useRef(new Animated.Value(0)).current;
  const orbShape = currentOrb.shape || 'default';

  useEffect(() => {
    if (orbDisplayMode === 'idle' || orbDisplayMode === 'diffused') {
      interactionState.current.mode = orbDisplayMode;
    }
  }, [orbDisplayMode]);

  // Toggle Diffuse
  const toggleDiffuse = async () => {
     const nextMode = interactionState.current.mode === 'diffused' ? 'idle' : 'diffused';
     interactionState.current.mode = nextMode;
     await setOrbDisplayMode(nextMode);
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

  useEffect(() => {
    if (!showShapeSelector) return;
    const timeout = setTimeout(() => {
      const y = shapeItemLayoutsRef.current[orbShape];
      if (typeof y !== 'number') return;
      shapeScrollRef.current?.scrollTo({
        y: Math.max(0, y - 180),
        animated: false,
      });
    }, 60);
    return () => clearTimeout(timeout);
  }, [showShapeSelector, orbShape]);

  useEffect(() => {
    if (currentOrb.shape === 'triquetra') {
      void setOrbShape('ring-torus');
    }
  }, [currentOrb.shape, setOrbShape]);

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

  const triggerFullscreenDiffuse = async () => {
    // Toggle between diffused and idle
    if (interactionState.current.mode === 'diffused') {
      interactionState.current.mode = 'idle';
      await setOrbDisplayMode('idle');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      interactionState.current.mode = 'diffused';
      await setOrbDisplayMode('diffused');
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
     if (!isOrbAwakened) {
       await cultivateDailyOrb();
       await completeMeditation(
         "garden-daily",
         Math.max(1, durationMinutes),
         false,
         "Garden Meditation"
       );
       Alert.alert(
          tr("冥想完成", "Meditation Complete", "Meditación completada"),
          tr("你的光球吸收了能量。", "Your orb has absorbed energy.", "Tu esfera ha absorbido energía.")
       );
     } else {
       await completeMeditation(
         "awakened-session",
         recordDuration,
         false,
         "Garden: Awakened Meditation"
       );
       Alert.alert(
          tr("冥想完成", "Meditation Complete", "Meditación completada"),
          tr("願你內心平靜。", "May you be at peace.", "Que permanezcas en paz.")
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
    const isEmptyWhiteBall = !IS_DEV_FULL_MOCK && currentOrb.level === 0 && currentOrb.layers.length === 0 && (!currentOrb.shape || currentOrb.shape === 'default');
    
    if (isEmptyWhiteBall) {
      Alert.alert(
        tr("無法贈送", "Cannot Gift", "No se puede regalar"),
        tr("請先培育或改變光球形態", "Grow or transform your orb first", "Primero haz crecer o transforma tu esfera.")
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
       isGiftingRef.current = false; // Reset lock before modal opens
       hasAttemptedGiftRef.current = false;
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
        isGiftingRef.current = false;
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
      toWalletAddress?: string;
      toUsername?: string;
      friendName?: string;
      blessingText?: string;
      orbSnapshot?: GiftOrbSnapshot;
      usedBlessingBoost?: boolean;
      source: "event" | "shareContacts" | "local-dev";
      localRequestId?: string;
    },
    options?: { silent?: boolean }
  ) => {
    if (giftUploadAttemptRef.current) {
      return false;
    }
    giftUploadAttemptRef.current = true;

    const senderDisplayName = getPreferredIdentityLabel({
      profile,
      walletAddress,
      lang: settings.language,
      fallbackZh: "我自己",
      fallbackEn: "Me",
    });
    const blessingText = buildGiftBlessingText(params.blessingText);
    const snapshot = params.orbSnapshot ?? captureGiftOrbSnapshot();

    try {
      if (!params.fromWalletAddress || params.fromWalletAddress === "missing") {
        throw new Error(
          settings.language === "zh"
            ? "缺少送出者錢包地址，未能傳送祝福。"
            : "Missing sender wallet address. Unable to send blessing."
        );
      }
      const orbPayload = {
        id: currentOrbRef.current.id || `orb-${Date.now()}`,
        level: snapshot.level,
        layers: [...snapshot.layers],
        isAwakened: snapshot.isAwakened,
        createdAt: snapshot.createdAt,
        completedAt: currentOrbRef.current.completedAt,
        shape: snapshot.shape,
        rotationSpeed: interactionState.current.spinVelocity,
      };

      const uploadAttempts = [
        params.toWalletAddress || params.toUsername
          ? {
              key: `full:${params.toWalletAddress || ""}:${params.toUsername || ""}`,
              toWalletAddress: params.toWalletAddress,
              toUsername: params.toUsername,
            }
          : null,
        params.toUsername
          ? {
              key: `username:${params.toUsername}`,
              toWalletAddress: undefined,
              toUsername: params.toUsername,
            }
          : null,
        params.toWalletAddress
          ? {
              key: `wallet:${params.toWalletAddress}`,
              toWalletAddress: params.toWalletAddress,
              toUsername: undefined,
            }
          : null,
      ].filter(Boolean) as Array<{
        key: string;
        toWalletAddress?: string;
        toUsername?: string;
      }>;

      const uploadResult = await uploadGiftWithFallback({
        fromWalletAddress: params.fromWalletAddress,
        fromUsername: profile.username,
        fromDisplayName: senderDisplayName,
        resonanceBlessed: Boolean(params.usedBlessingBoost),
        blessing: blessingText,
        orb: orbPayload,
        attempts: uploadAttempts,
      });
      await persistLocalGiftOutbox((prev) => [
        {
          giftId: uploadResult.giftId,
          createdAt: new Date().toISOString(),
          toWalletAddress: params.toWalletAddress || "",
          toUsername: params.toUsername,
          friendName:
            params.friendName ||
            formatContactName(
              params.toUsername ? { username: params.toUsername } : undefined,
              params.toWalletAddress,
              settings.language
            ),
          resonanceBlessed: Boolean(params.usedBlessingBoost),
          blessing: blessingText,
          status: "uploaded",
          orbSnapshot: snapshot,
        },
        ...prev.filter((entry) => entry.giftId !== uploadResult.giftId && entry.giftId !== params.localRequestId),
      ]);
      if (params.usedBlessingBoost) {
        await consumeBlessingBoost();
      }
      await refreshSentBlessingHistory();
      return true;
    } catch (e: any) {
      console.error("[DEBUG_GIFT_CLOUD] shareContacts/upload failed:", e);
      await persistLocalGiftOutbox((prev) => [
        {
          giftId: `failed-${Date.now()}`,
          createdAt: new Date().toISOString(),
          toWalletAddress: params.toWalletAddress || "",
          toUsername: params.toUsername,
          friendName:
            params.friendName ||
            formatContactName(
              params.toUsername ? { username: params.toUsername } : undefined,
              params.toWalletAddress,
              settings.language
            ),
          resonanceBlessed: Boolean(params.usedBlessingBoost),
          blessing: blessingText,
          status: "failed",
          orbSnapshot: snapshot,
        },
        ...prev.filter((entry) => entry.giftId !== params.localRequestId),
      ]);
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
        settings.language === "zh" ? "傳送失敗" : settings.language === "es" ? "El envío falló" : "Send failed",
        message
      );
    }
  };

  const handleGiftSuccess = async (contact: any) => {
    if (giftSuccessHandledRef.current) {
      return;
    }
    giftSuccessHandledRef.current = true;

    const toUsername = extractContactUsername(contact);
    const toWalletAddress = sanitizeResolvedRecipientAddress(
      await resolveContactWalletAddress(contact, resolveMiniKit()),
      toUsername,
      walletAddress,
      profile.username
    );
    const friendName = formatContactName(contact, toWalletAddress || toUsername, settings.language);
    const blessingText = buildGiftBlessingText();
    const orbSnapshot = captureGiftOrbSnapshot();
    const usedBlessingBoost = resonanceState.blessingBoostCharges > 0;

    if (
      isSelfGiftTarget({
        recipientUsername: toUsername,
        recipientWalletAddress: toWalletAddress,
        senderUsername: profile.username,
        senderWalletAddress: walletAddress,
      })
    ) {
      await stageLocalGiftRecord({
        giftId: `failed-${Date.now()}`,
        createdAt: new Date().toISOString(),
        toWalletAddress: toWalletAddress || "",
        toUsername,
        friendName,
        blessing: blessingText,
        status: "failed",
        orbSnapshot,
      }, orbSnapshot);
      isGiftingRef.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "無法傳送給自己" : settings.language === "es" ? "No puedes enviártelo a ti misma" : "Cannot send to yourself",
        getSelfGiftErrorMessage(settings.language)
      );
      return;
    }

	    if (!toWalletAddress && !toUsername) {
      await stageLocalGiftRecord({
        giftId: `failed-${Date.now()}`,
        createdAt: new Date().toISOString(),
        toWalletAddress: "",
        toUsername: "",
        friendName: formatContactName(contact, "", settings.language),
        blessing: blessingText,
        status: "failed",
        orbSnapshot,
      }, orbSnapshot);
	      isGiftingRef.current = false;
      setIsGiftingUI(false);
      Alert.alert(
        settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
        settings.language === "zh" ? "選擇朋友失敗，請重試" : settings.language === "es" ? "Falló la selección del contacto. Inténtalo de nuevo." : "Friend selection failed. Please retry."
      );
      return;
    }

	    // UI success flow immediately, upload happens in background
      const localRequestId = activeGiftRequestIdRef.current ?? `pending-${Date.now()}`;
      await stageLocalGiftRecord({
        giftId: localRequestId,
        createdAt: new Date().toISOString(),
        toWalletAddress: toWalletAddress || "",
        toUsername,
        friendName,
        blessing: blessingText,
        status: "pending",
        orbSnapshot,
      }, orbSnapshot);
	    finishGifting(friendName);
	    void attemptGiftUpload({
	      fromWalletAddress: walletAddress || "missing",
	      toWalletAddress,
        toUsername,
	      friendName,
        blessingText,
        orbSnapshot,
        usedBlessingBoost,
	      source: "event",
        localRequestId,
	    }, { silent: true }).then((uploaded) => {
      updateGiftDeliveryState({
        status: uploaded ? "delivered" : "failed",
        friendName,
      });
      showGiftUploadResult(friendName, uploaded, usedBlessingBoost);
    }).catch((uploadErr) => {
      console.error("[gift] upload failed after event success", uploadErr);
      updateGiftDeliveryState({ status: "failed", friendName });
      showGiftUploadResult(friendName, false, usedBlessingBoost);
    });
  };

  useEffect(() => {
    handleGiftSuccessRef.current = handleGiftSuccess;
  });

  const playHolyGiftSound = async () => {
    try {
      const uri = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b6a66f4db.mp3?filename=magic-2-16764.mp3";

      if (giftSoundRef.current) {
        await giftSoundRef.current.unloadAsync();
        giftSoundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 0.9 }
      );

      giftSoundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn("[DEBUG_GIFT] playHolyGiftSound failed:", e);
    }
  };


  const finishGifting = (friendName: string) => {
      // Clear any mode reset timeout
      if (modeResetTimeoutRef.current) {
        clearTimeout(modeResetTimeoutRef.current);
      }
      
      // Reset attempt flag
      hasAttemptedGiftRef.current = false;
      giftSuccessHandledRef.current = false;

      // 1. Close modal immediately
      setShowGiftModal(false);
      
      // 2. Start Animation (Explode/Fly away)
      interactionState.current.mode = 'explode';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void playHolyGiftSound();
      
      // 3. Wait for fly-away animation then complete the process
      setTimeout(async () => {
           try {
             await recordBlessingSent();
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           } catch (sendError) {
              console.error("[DEBUG_GIFT] sendOrb error:", sendError);
           }
      }, 2000);
      
      // 4. Reset all states after animation completes
      setTimeout(() => {
           resetGiftUiState();
           interactionState.current.mode = 'idle';
      }, 3000);
      
      // Safety timeout: ensure mode resets even if something goes wrong
      modeResetTimeoutRef.current = setTimeout(() => {
        if (interactionState.current.mode === 'explode') {
          interactionState.current.mode = 'idle';
          resetGiftUiState();
        }
      }, 6000);
  };

  const showGiftUploadResult = (friendName: string, uploaded: boolean, resonanceBlessed?: boolean) => {
    revealGiftHistoryPanel();
    Alert.alert(
      uploaded
        ? settings.language === "zh"
          ? "✨ 祝福已同步"
          : settings.language === "es"
            ? "✨ Bendición sincronizada"
          : "✨ Blessing Synced"
        : settings.language === "zh"
          ? "雲端同步失敗"
          : settings.language === "es"
            ? "La sincronización en la nube falló"
          : "Cloud Sync Failed",
      uploaded
        ? settings.language === "zh"
          ? resonanceBlessed
            ? `已送往 ${friendName}，並成功寫入雲端。這則 Resonance 加持祝福會在對方那邊更顯眼地置頂顯示。`
            : `已送往 ${friendName}，並成功寫入雲端。`
          : settings.language === "es"
            ? resonanceBlessed
              ? `Se envió a ${friendName} y se sincronizó con la nube. Esta bendición con Resonance aparecerá con más destaque para la otra persona.`
              : `Se envió a ${friendName} y se sincronizó con la nube.`
          : resonanceBlessed
            ? `Sent to ${friendName} and synced to the cloud. This Resonance-blessed gift will appear more prominently for the recipient.`
            : `Sent to ${friendName} and synced to the cloud.`
        : settings.language === "zh"
          ? `你已完成送禮動作，但雲端未成功寫入。請先不要重複付款或重複送禮，並查看下方送出記錄。`
          : settings.language === "es"
            ? `El gesto de regalo se completó, pero la nube no terminó de sincronizarse. No lo repitas a ciegas y revisa el registro de envíos abajo.`
          : `The gifting motion completed, but cloud sync did not finish. Please do not retry blindly and check the sent record below.`
    );
  };

  const handleUnlockBlessingBoost = async () => {
    if (buyingBlessingBoost) return;

    setBuyingBlessingBoost(true);
    try {
      const result = await unlockBlessingBoost();
      if (!result.granted) {
        Alert.alert(
          settings.language === "zh" ? "Resonance 不足" : settings.language === "es" ? "No tienes suficiente Resonance" : "Not enough Resonance",
          settings.language === "zh"
            ? `需要 ${RESONANCE_BLESSING_BOOST_COST} Resonance 才能強化下一次祝福。`
            : settings.language === "es"
              ? `Necesitas ${RESONANCE_BLESSING_BOOST_COST} de Resonance para potenciar la próxima bendición.`
            : `You need ${RESONANCE_BLESSING_BOOST_COST} Resonance to amplify the next blessing.`
        );
        return;
      }

      Alert.alert(
        settings.language === "zh" ? "祝福已加持" : settings.language === "es" ? "Bendición potenciada" : "Blessing Amplified",
        settings.language === "zh"
          ? `下一次送出的祝福會附帶 Resonance 加持。剩餘加持次數：${result.remainingCharges ?? 0}`
          : settings.language === "es"
            ? `Tu próxima bendición saldrá con impulso de Resonance. Cargas restantes: ${result.remainingCharges ?? 0}`
          : `Your next blessing will carry Resonance amplification. Remaining charges: ${result.remainingCharges ?? 0}`
      );
    } finally {
      setBuyingBlessingBoost(false);
    }
  };

  const handleUnlockOrbAura = async () => {
    if (lightingOrbAura) return;
    setLightingOrbAura(true);
    try {
      const result = await unlockOrbAura();
      if (result.granted) {
        Alert.alert(
          settings.language === "zh" ? "今日光場已啟動" : settings.language === "es" ? "El campo de aura de hoy está activo" : "Today's aura field is active",
          settings.language === "zh"
            ? `你花費了 ${RESONANCE_ORB_AURA_COST} 點 Resonance。首頁與花園的主光球今天都會進入更明顯的展演光場。`
            : settings.language === "es"
              ? `Has gastado ${RESONANCE_ORB_AURA_COST} de Resonance. Tu esfera principal tendrá un aura más visible en Inicio y Jardín durante hoy.`
            : `You spent ${RESONANCE_ORB_AURA_COST} Resonance. Your main orb now gains a stronger showcase aura across Home and Garden for today.`
        );
      } else {
        Alert.alert(
          settings.language === "zh" ? "暫時不能開啟光場" : settings.language === "es" ? "Todavía no se puede activar el campo de aura" : "Cannot activate the aura field yet",
          result.reason === "already-active"
            ? (settings.language === "zh" ? "今日光場已經啟動。" : settings.language === "es" ? "Tu campo de aura ya está activo hoy." : "Your aura field is already active today.")
            : (settings.language === "zh" ? "Resonance 不足，先完成今日簽到或冥想。" : settings.language === "es" ? "Necesitas más Resonance primero. Prueba el check-in de hoy o una meditación." : "You need more Resonance first. Try today's check-in or meditation.")
        );
      }
    } finally {
      setLightingOrbAura(false);
    }
  };

  const handleUnlockAmbientPass = async () => {
    if (unlockingAmbientPass) return;
    setUnlockingAmbientPass(true);
    try {
      const result = await unlockAmbientPass();
      if (result.granted) {
        Alert.alert(
          settings.language === "zh" ? "今日環境音通行已開啟" : settings.language === "es" ? "El pase ambiental de hoy ya está desbloqueado" : "Today's ambient pass is unlocked",
          settings.language === "zh"
            ? `你花費了 ${RESONANCE_AMBIENT_PASS_COST} 點 Resonance。今天在花園與冥想頁都可使用全部環境音。`
            : settings.language === "es"
              ? `Has gastado ${RESONANCE_AMBIENT_PASS_COST} de Resonance. Todos los sonidos ambientales están desbloqueados hoy en Jardín y Meditar.`
            : `You spent ${RESONANCE_AMBIENT_PASS_COST} Resonance. All ambient sounds are unlocked across Garden and Meditate for today.`
        );
      } else {
        Alert.alert(
          settings.language === "zh" ? "暫時不能解鎖" : settings.language === "es" ? "Todavía no se puede desbloquear" : "Cannot unlock yet",
          result.reason === "already-active"
            ? (settings.language === "zh" ? "今日環境音通行已經開啟。" : settings.language === "es" ? "Tu pase ambiental ya está activo hoy." : "Your ambient pass is already active today.")
            : (settings.language === "zh" ? "Resonance 不足，先完成今日簽到或冥想。" : settings.language === "es" ? "Necesitas más Resonance primero. Prueba el check-in de hoy o una meditación." : "You need more Resonance first. Try today's check-in or meditation.")
        );
      }
    } finally {
      setUnlockingAmbientPass(false);
    }
  };

  const handleManualGiftSend = async () => {
    const input = manualGiftRecipient.trim().replace(/^@/, "");
    if (!input) {
      setGiftingError(
        settings.language === "zh"
          ? "請輸入對方的 World 用戶名或錢包地址。"
          : settings.language === "es"
            ? "Introduce el nombre de usuario de World o la dirección de billetera de la otra persona."
          : "Enter the recipient's World username or wallet address."
      );
      return;
    }

    const mk = (await ensureMiniKitLoaded()) ?? getMiniKit() ?? MiniKit;
    const localRequestId = `manual-${Date.now()}`;
    const friendName = looksLikeWalletAddress(input) ? `User ${input.slice(0, 6)}` : `@${input}`;
    let resolvedAddress = looksLikeWalletAddress(input) ? input : "";
    const recipientUsername = looksLikeWalletAddress(input) ? "" : input;
    const blessingText = buildGiftBlessingText();
    const orbSnapshot = captureGiftOrbSnapshot();
    const usedBlessingBoost = resonanceState.blessingBoostCharges > 0;

    if (
      isSelfGiftTarget({
        recipientUsername,
        recipientWalletAddress: resolvedAddress,
        senderUsername: profile.username,
        senderWalletAddress: walletAddress,
      })
    ) {
      setGiftingError(getSelfGiftErrorMessage(settings.language));
      return;
    }

    setGiftingError(null);
    setIsGiftingUI(true);
    updateGiftDeliveryState({ status: "sending", friendName });

    await stageLocalGiftRecord({
      giftId: localRequestId,
      createdAt: new Date().toISOString(),
      toWalletAddress: resolvedAddress,
      toUsername: recipientUsername,
      friendName,
      blessing: blessingText,
      status: "pending",
      orbSnapshot,
    }, orbSnapshot);
    revealGiftHistoryPanel();

    try {
      if (!resolvedAddress && recipientUsername) {
        resolvedAddress = sanitizeResolvedRecipientAddress(
          await resolveContactWalletAddress({ username: input }, mk),
          recipientUsername,
          walletAddress,
          profile.username
        );
      }

      if (
        isSelfGiftTarget({
          recipientUsername,
          recipientWalletAddress: resolvedAddress,
          senderUsername: profile.username,
          senderWalletAddress: walletAddress,
        })
      ) {
        throw new Error(getSelfGiftErrorMessage(settings.language));
      }

      if (!resolvedAddress && !recipientUsername) {
        throw new Error(
          settings.language === "zh"
            ? "無法從這個用戶名解析出錢包地址。"
            : "Could not resolve a wallet address from that username."
        );
      }

      await stageLocalGiftRecord({
        giftId: localRequestId,
        createdAt: new Date().toISOString(),
        toWalletAddress: resolvedAddress,
        toUsername: recipientUsername,
        friendName,
        blessing: blessingText,
        status: "pending",
        orbSnapshot,
      }, orbSnapshot);

      finishGifting(friendName);
      const uploaded = await attemptGiftUpload(
        {
          fromWalletAddress: walletAddress || "missing",
          toWalletAddress: resolvedAddress,
          toUsername: recipientUsername,
          friendName,
          blessingText,
          orbSnapshot,
          usedBlessingBoost,
          source: "event",
          localRequestId,
        },
        { silent: true }
      );
      updateGiftDeliveryState({
        status: uploaded ? "delivered" : "failed",
        friendName,
      });
      showGiftUploadResult(friendName, uploaded, usedBlessingBoost);
      if (uploaded) {
        setManualGiftRecipient("");
      }
    } catch (error: any) {
      await stageLocalGiftRecord({
        giftId: localRequestId,
        createdAt: new Date().toISOString(),
        toWalletAddress: resolvedAddress,
        toUsername: recipientUsername,
        friendName,
        blessing: blessingText,
        status: "failed",
        orbSnapshot,
      }, orbSnapshot);
      updateGiftDeliveryState({ status: "failed", friendName });
      setGiftingError(
        error?.message ||
          (settings.language === "zh"
            ? "手動傳送失敗，請確認用戶名或地址。"
            : "Manual gifting failed. Check the username or address.")
      );
    } finally {
      setIsGiftingUI(false);
    }
  };

	  const handleStartGiftingOptimistic = () => {
    if (isGiftingRef.current) {
      isGiftingRef.current = false;
    }

    isGiftingRef.current = true;
    giftUploadAttemptRef.current = false;
    giftSuccessHandledRef.current = false;
    hasAttemptedGiftRef.current = true;
	    setGiftingError(null);
	    setIsGiftingUI(true);
	    pendingShareContactsRef.current = true;
      activeGiftRequestIdRef.current = `pending-${Date.now()}`;
	    pauseMiniKitAutoSubscribeRef.current = true;
	    setGiftDebugMessage(null);
      const blessingText = buildGiftBlessingText();
      const orbSnapshot = captureGiftOrbSnapshot();
      const usedBlessingBoost = resonanceState.blessingBoostCharges > 0;
      updateGiftDeliveryState({
        status: "sending",
        friendName: settings.language === "zh" ? "正在選擇好友" : settings.language === "es" ? "Eligiendo contacto" : "Choosing a contact",
      });

    const run = async () => {
      try {
          await stageLocalGiftRecord({
            giftId: activeGiftRequestIdRef.current ?? `pending-${Date.now()}`,
            createdAt: new Date().toISOString(),
            toWalletAddress: "",
            toUsername: "",
            friendName: settings.language === "zh" ? "正在選擇好友" : settings.language === "es" ? "Eligiendo contacto" : "Choosing a contact",
            blessing: blessingText,
            status: "pending",
            orbSnapshot,
          }, orbSnapshot);
          revealGiftHistoryPanel();
	        if (IS_DEV_FULL_MOCK) {
          pendingShareContactsRef.current = false;
          clearShareContactsTimeout();
          const fakeFriendName = "開發朋友";
          updateGiftDeliveryState({ status: "sending", friendName: fakeFriendName });
	          void attemptGiftUpload({
	            fromWalletAddress: walletAddress || "0xDevMockWallet_999999",
	            toWalletAddress: "0xDevMockFriend_888888",
              toUsername: "dev-mock-friend.world",
	            friendName: fakeFriendName,
              blessingText,
              usedBlessingBoost,
	            source: "local-dev",
              localRequestId: activeGiftRequestIdRef.current ?? undefined,
	          }, { silent: true }).then((uploaded) => {
            updateGiftDeliveryState({
              status: uploaded ? "delivered" : "failed",
              friendName: fakeFriendName,
            });
            showGiftUploadResult(fakeFriendName, uploaded, usedBlessingBoost);
          }).catch((uploadErr) => {
            console.error("[gift] local-dev upload simulation failed", uploadErr);
            updateGiftDeliveryState({ status: "failed", friendName: fakeFriendName });
            showGiftUploadResult(fakeFriendName, false, usedBlessingBoost);
          });
          finishGifting(fakeFriendName);
          return;
        }

        const mk = (await ensureMiniKitLoaded()) ?? getMiniKit() ?? MiniKit;
        const getPermissionsFn = mk?.commandsAsync?.getPermissions;
        const shareContactsAsyncFn = mk?.commandsAsync?.shareContacts;
        const shareContactsCommandFn = mk?.commands?.shareContacts;
        const installed = await isMiniKitInstalled(mk);

        if (!mk || !installed) {
          if (Platform.OS === "web") {
            const miniAppUrl =
              (mk?.getMiniAppUrl || MiniKit?.getMiniAppUrl)?.(APP_ID, "/") ||
              `https://worldcoin.org/mini-app/${encodeURIComponent(APP_ID)}`;
            try {
              window.location.assign(miniAppUrl);
            } catch {
            }
          }
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : settings.language === "es" ? "No se puede enviar" : "Cannot send",
            getMiniKitUnavailableMessage(settings.language)
          );
          isGiftingRef.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (useShareContactsAsyncOnly && !shareContactsAsyncFn) {
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : settings.language === "es" ? "No se puede enviar" : "Cannot send",
            settings.language === "zh"
              ? "無法使用非同步聯絡人分享，請更新 World App"
              : "Async contact sharing is unavailable. Please update World App."
          );
          isGiftingRef.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (!shareContactsAsyncFn && !shareContactsCommandFn) {
          Alert.alert(settings.language === "zh" ? "無法傳送" : settings.language === "es" ? "No se puede enviar" : "Cannot send");
          isGiftingRef.current = false;
          setIsGiftingUI(false);
          return;
        }

        if (!useShareContactsAsyncOnly && !shareContactsAsyncFn) {
          const subscribed = subscribeMiniKit(mk, handleMiniKitShareContactsEvent);
          if (!subscribed) {
            pendingShareContactsRef.current = false;
            isGiftingRef.current = false;
            setIsGiftingUI(false);
            Alert.alert(
              settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
              settings.language === "zh" ? "選擇朋友失敗，請重試" : settings.language === "es" ? "Falló la selección del contacto. Inténtalo de nuevo." : "Friend selection failed. Please retry."
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
            if (!permissions?.contacts) {
              setGiftDebugMessage(
                settings.language === "zh"
                  ? "World contacts 尚未預先授權；將直接使用 shareContacts 作為聯絡人同意入口。"
                  : settings.language === "es"
                    ? "World contacts aún no está preautorizado; shareContacts se usará como puerta de consentimiento."
                  : "World contacts are not pre-authorized; shareContacts will be used as the consent entrypoint."
              );
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
        scheduleShareContactsTimeout();

        let result: any;
        const shareContactsPayload = {
          isMultiSelectEnabled: false,
          inviteMessage:
            settings.language === "zh"
            ? "分享你的錢包聯絡人以贈送光球"
            : settings.language === "es"
              ? "Comparte un contacto con billetera para regalar una esfera"
            : "Share a contact wallet to receive a gift orb",
        };

        mk?.install?.(APP_ID);
        const confirmedInstalled = await waitForMiniKitInstalled(mk, 1200, 100);
        if (!confirmedInstalled) {
          Alert.alert(
            settings.language === "zh" ? "無法傳送" : settings.language === "es" ? "No se puede enviar" : "Cannot send",
            getMiniKitUnavailableMessage(settings.language)
          );
          isGiftingRef.current = false;
          setIsGiftingUI(false);
          return;
        }

	        try {
	          if (shareContactsAsyncFn) {
              result = await shareContactsAsyncFn(shareContactsPayload);
              setGiftDebugMessage(
                `${settings.language === "zh" ? "shareContacts 回應" : settings.language === "es" ? "respuesta de shareContacts" : "shareContacts response"}: ${summarizeGiftPayload(result?.finalPayload || result)}`
              );
	          } else if (shareContactsCommandFn) {
              const subscribed = subscribeMiniKit(mk, handleMiniKitShareContactsEvent);
              if (!subscribed) {
                throw new Error("share_contacts_event_subscription_failed");
              }
	            shareContactsCommandFn(shareContactsPayload);
	            setGiftDebugMessage(
	              settings.language === "zh"
	                ? `已呼叫 World contacts command，等待事件回傳...`
                  : settings.language === "es"
                    ? "Se abrió el comando de contactos de World; esperando el evento..."
	                : "World contacts command opened, waiting for event..."
	            );
	            return;
	          }
	        } catch (shareError) {
          console.warn("[DEBUG_GIFT_CLOUD] shareContacts failed to open/resolve:", shareError);
          const errorMessage = parseGiftErrorMessage(shareError);
          if (errorMessage) {
            pendingShareContactsRef.current = false;
            clearShareContactsTimeout();
            isGiftingRef.current = false;
            setGiftingError(errorMessage);
            setIsGiftingUI(false);
            return;
          }
          pendingShareContactsRef.current = false;
          isGiftingRef.current = false;
          setIsGiftingUI(false);
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
            settings.language === "zh"
              ? "選擇朋友失敗，請重試"
              : settings.language === "es"
                ? "Falló la selección del contacto. Inténtalo de nuevo."
              : "Friend selection failed. Please retry."
          );
          return;
        }

        const responsePayload = result?.finalPayload || result;
        const contacts = extractContactsFromPayload(result);
        const contact = contacts[0];
        const toUsername = extractContactUsername(contact);
        const toWalletAddress = sanitizeResolvedRecipientAddress(
          await resolveContactWalletAddress(contact, mk),
          toUsername,
          walletAddress,
          profile.username
        );

	        if (responsePayload?.status === 'error') {
          await stageLocalGiftRecord({
            giftId: activeGiftRequestIdRef.current ?? `failed-${Date.now()}`,
            createdAt: new Date().toISOString(),
            toWalletAddress: "",
            toUsername: "",
            friendName: settings.language === "zh" ? "未選中好友" : settings.language === "es" ? "Sin contacto seleccionado" : "No contact selected",
            blessing: blessingText,
            status: "failed",
            orbSnapshot,
          }, orbSnapshot);
	          isGiftingRef.current = false;
          setIsGiftingUI(false);
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
            responsePayload?.error_code || "Unknown error"
          );
          return;
        }

	        if (!toWalletAddress && !toUsername) {
          await stageLocalGiftRecord({
            giftId: activeGiftRequestIdRef.current ?? `failed-${Date.now()}`,
            createdAt: new Date().toISOString(),
            toWalletAddress: "",
            toUsername: "",
            friendName: formatContactName(contact, "", settings.language),
            blessing: blessingText,
            status: "failed",
            orbSnapshot,
          }, orbSnapshot);
	          isGiftingRef.current = false;
          setIsGiftingUI(false);
          setGiftDebugMessage(
            settings.language === "zh"
              ? `shareContacts 有回應，但找不到地址。payload keys: ${summarizeGiftPayload(responsePayload)}`
              : settings.language === "es"
                ? `shareContacts respondió, pero no se encontró ninguna dirección. claves del payload: ${summarizeGiftPayload(responsePayload)}`
              : `shareContacts responded, but no address was found. payload keys: ${summarizeGiftPayload(responsePayload)}`
          );
          Alert.alert(
            settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
            settings.language === "zh" ? "無法取得朋友的錢包地址" : settings.language === "es" ? "No se pudo obtener la dirección de billetera del contacto" : "Could not get friend's wallet address"
          );
          return;
        }

        pendingShareContactsRef.current = false;
        clearShareContactsTimeout();
	        const friendName = formatContactName(contact, toWalletAddress || toUsername, settings.language);
          const localRequestId = activeGiftRequestIdRef.current ?? `pending-${Date.now()}`;
          await stageLocalGiftRecord({
            giftId: localRequestId,
            createdAt: new Date().toISOString(),
            toWalletAddress: toWalletAddress || "",
            toUsername,
            friendName,
            blessing: blessingText,
            status: "pending",
            orbSnapshot,
          }, orbSnapshot);

	        if (giftSuccessHandledRef.current) {
	          return;
        }
        giftSuccessHandledRef.current = true;
        updateGiftDeliveryState({ status: "sending", friendName });

	        void attemptGiftUpload({
	          fromWalletAddress: walletAddress || "missing",
	          toWalletAddress: toWalletAddress,
            toUsername,
	          friendName,
            blessingText,
            orbSnapshot,
            usedBlessingBoost,
	          source: "shareContacts",
            localRequestId,
	        }, { silent: true }).then((uploaded) => {
          updateGiftDeliveryState({
            status: uploaded ? "delivered" : "failed",
            friendName,
          });
          showGiftUploadResult(friendName, uploaded, usedBlessingBoost);
        }).catch((uploadErr) => {
          console.error("[gift] upload failed after ui success", uploadErr);
          updateGiftDeliveryState({ status: "failed", friendName });
          showGiftUploadResult(friendName, false, usedBlessingBoost);
        });

        finishGifting(friendName);
      } catch (e) {
        console.error("[DEBUG_GIFT_CLOUD] shareContacts/upload failed:", e);
        const errorMessage = parseGiftErrorMessage(e);
        if (errorMessage) {
          await stageLocalGiftRecord({
            giftId: activeGiftRequestIdRef.current ?? `failed-${Date.now()}`,
            createdAt: new Date().toISOString(),
            toWalletAddress: "",
            friendName: settings.language === "zh" ? "傳送未完成" : settings.language === "es" ? "Regalo sin completar" : "Gift not completed",
            blessing: blessingText,
            status: "failed",
          }, orbSnapshot);
          updateGiftDeliveryState({
            status: "failed",
            friendName: settings.language === "zh" ? "傳送未完成" : settings.language === "es" ? "Regalo sin completar" : "Gift not completed",
          });
          revealGiftHistoryPanel();
          pendingShareContactsRef.current = false;
          clearShareContactsTimeout();
          isGiftingRef.current = false;
          setGiftingError(errorMessage);
          return;
        }
        Alert.alert(
          settings.language === "zh" ? "選擇朋友失敗" : settings.language === "es" ? "Falló la selección del contacto" : "Friend selection failed",
          settings.language === "zh"
            ? "選擇朋友失敗，請重試"
            : settings.language === "es"
              ? "Falló la selección del contacto. Inténtalo de nuevo."
            : "Friend selection failed. Please retry."
        );
        await stageLocalGiftRecord({
          giftId: activeGiftRequestIdRef.current ?? `failed-${Date.now()}`,
          createdAt: new Date().toISOString(),
          toWalletAddress: "",
          friendName: settings.language === "zh" ? "傳送未完成" : settings.language === "es" ? "Regalo sin completar" : "Gift not completed",
          blessing: blessingText,
          status: "failed",
        }, orbSnapshot);
        updateGiftDeliveryState({
          status: "failed",
          friendName: settings.language === "zh" ? "傳送未完成" : settings.language === "es" ? "Regalo sin completar" : "Gift not completed",
        });
        revealGiftHistoryPanel();
        isGiftingRef.current = false;
      } finally {
        pauseMiniKitAutoSubscribeRef.current = false;
        setIsGiftingUI(false);
      }
    };

    void run();
  };

  const handleCancelGift = () => {
    setShowGiftModal(false);
    setGiftMessage("");
    setManualGiftRecipient("");
    setGiftingError(null);
    setIsGiftingUI(false);
    
    // CRITICAL: Always reset isGifting when modal closes
    isGiftingRef.current = false;
    hasAttemptedGiftRef.current = false;
    
    // Reset animation mode immediately and after delay for safety
    interactionState.current.mode = 'idle';
    
    setTimeout(() => {
      if (interactionState.current.mode !== 'meditating') {
        interactionState.current.mode = 'idle';
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

  const closePreviewOrb = () => {
    setPreviewOrb(null);
  };

  const handleUsePreviewOrb = async () => {
    if (!previewOrb || previewOrb.isBlessingGift) {
      return;
    }
    closePreviewOrb();
    handleSwapOrb(previewOrb);
    collapseDrawer();
  };

  const previewShapeName =
    previewOrb?.shape && previewOrb.shape !== "default"
      ? settings.language === "zh"
        ? shapes.find((shape) => shape.id === previewOrb.shape)?.nameZh
        : shapes.find((shape) => shape.id === previewOrb.shape)?.name
      : null;

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
                {tr("光球花園", "Light Orb Garden", "Jardín de esferas de luz")}
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
               {settings.language === "zh"
                 ? `${currentOrb.layers.length}/7 層 • ${isOrbAwakened ? "已覺醒" : "成長中"}`
                 : settings.language === "es"
                   ? `${currentOrb.layers.length}/7 capas • ${isOrbAwakened ? "Despierto" : "Creciendo"}`
                   : `${currentOrb.layers.length}/7 Layers • ${isOrbAwakened ? "Awakened" : "Growing"}`}
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
              <TouchableOpacity style={[styles.devMenuItem, { borderBottomWidth: 0 }]} onPress={() => setShowDevMenu(false)}><Text style={{ color: 'red' }}>{tr("關閉", "Close", "Cerrar")}</Text></TouchableOpacity>
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
                {tr('選擇光球形態', 'Choose Orb Shape', 'Elegir forma de esfera')}
              </Text>
            </View>
            <View style={styles.shapeLegendRow}>
              {[
                tr('免費核心', 'Free Core', 'Núcleo gratis'),
                tr('VIP 贈送', 'VIP Gift', 'Regalo VIP'),
                tr('任務解鎖', 'Mission', 'Misión'),
                tr('神聖典藏', 'Sacred Archive', 'Archivo sagrado'),
              ].map((label) => (
                <View
                  key={label}
                  style={[
                    styles.shapeAccessBadge,
                    {
                      backgroundColor: `${currentTheme.primary}10`,
                      borderColor: `${currentTheme.primary}26`,
                    },
                  ]}
                >
                  <Text style={[styles.shapeAccessBadgeText, { color: currentTheme.primary }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
            <ScrollView ref={shapeScrollRef} style={styles.shapeList}>
              {shapes.map(s => (
                (() => {
                  const shapeUnlocked = canUseShape(s.id);
                  const accessMeta = getShapeAccessMeta(s.id);
                  const unlockMission = accessMeta.mission ?? getShapeUnlockMission(s.id);
                  const accessLabel = (() => {
                    switch (accessMeta.status) {
                      case "free-core":
                        return tr("免費核心", "Free Core", "Núcleo gratis");
                      case "vip-starter":
                        return tr("VIP 贈送", "VIP Gift", "Regalo VIP");
                      case "mission-unlocked":
                      case "mission-locked":
                        return tr("任務解鎖", "Mission", "Misión");
                      case "sealed-archive":
                        return tr("神聖典藏", "Sacred Archive", "Archivo sagrado");
                      case "dev-mock":
                        return tr("開發全開", "Dev Mock", "Mock de desarrollo");
                      default:
                        return tr("形態", "Form", "Forma");
                    }
                  })();
                  return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.shapeItem,
                    !shapeUnlocked && { opacity: 0.55 },
                    orbShape === s.id && { backgroundColor: `${currentTheme.primary}20`, borderColor: currentTheme.primary }
                  ]}
                  onLayout={(event) => {
                    shapeItemLayoutsRef.current[s.id] = event.nativeEvent.layout.y;
                  }}
                  onPress={() => {
                    if (!shapeUnlocked) {
                      const missionLabel = unlockMission
                        ? `${unlockMission.title[settings.language] ?? unlockMission.title.en} ${unlockMission.progressValue}/${unlockMission.targetValue}`
                        : tr("請先完成任務", "Complete a mission first", "Primero completa una misión");
                      Alert.alert(
                        tr("形態尚未解鎖", "Shape Locked", "Forma bloqueada"),
                        missionLabel
                      );
                      return;
                    }
                    setOrbShape(s.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeout(() => setShowShapeSelector(false), 300);
                  }}
                >
                  <View style={styles.shapePreviewWrap}>
                    <ShapeMicroPreview shape={s.id} />
                  </View>
                  <View style={styles.shapeTextBlock}>
                    <View style={styles.shapeTitleRow}>
                      <Text style={[styles.shapeName, { color: currentTheme.text }]}>
                        {getLocalizedShapeName(s, settings.language)}
                      </Text>
                      <View style={[styles.shapeAccessBadge, { backgroundColor: `${currentTheme.primary}14`, borderColor: `${currentTheme.primary}33` }]}>
                        <Text style={[styles.shapeAccessBadgeText, { color: currentTheme.primary }]}>
                          {accessLabel}
                        </Text>
                      </View>
                    </View>
                    {shapeDetails[s.id] && (
                      <Text style={[styles.shapeSummary, { color: currentTheme.textSecondary }]}>
                        {getLocalizedShapeDetailText(shapeDetails[s.id], "intro", settings.language)}
                      </Text>
                    )}
                    {!shapeUnlocked && unlockMission && (
                      <Text style={[styles.shapeSummary, { color: currentTheme.primary }]}>
                        {settings.language === "zh"
                          ? `任務解鎖：${unlockMission.title.zh} ${unlockMission.progressValue}/${unlockMission.targetValue}`
                          : settings.language === "es"
                            ? `Desbloqueo por misión: ${unlockMission.title.es ?? unlockMission.title.en} ${unlockMission.progressValue}/${unlockMission.targetValue}`
                            : `Mission unlock: ${unlockMission.title.en} ${unlockMission.progressValue}/${unlockMission.targetValue}`}
                      </Text>
                    )}
                    {!shapeUnlocked && !unlockMission && accessMeta.status === "sealed-archive" && (
                      <Text style={[styles.shapeSummary, { color: currentTheme.primary }]}>
                        {settings.language === "zh"
                          ? "尚未納入當前旅程，先完成已開放的任務形態。"
                          : settings.language === "es"
                            ? "Aún no forma parte del camino ritual actual. Completa primero las formas de misión disponibles."
                            : "Not yet in the current ritual path. Complete the available mission forms first."}
                      </Text>
                    )}
                    {orbShape === s.id && shapeDetails[s.id] && (
                      <View style={[styles.shapeDetailCard, { borderColor: `${currentTheme.primary}50`, backgroundColor: `${currentTheme.primary}12` }]}>
                        <Text style={[styles.shapeDetailLabel, { color: currentTheme.primary }]}>
                          {tr('適合用途', 'Best Use', 'Mejor uso')}
                        </Text>
                        <Text style={[styles.shapeDetailText, { color: currentTheme.text }]}>
                          {getLocalizedShapeDetailText(shapeDetails[s.id], "use", settings.language)}
                        </Text>
                        <Text style={[styles.shapeDetailLabel, { color: currentTheme.primary }]}>
                          {tr('象徵意義', 'Meaning', 'Significado')}
                        </Text>
                        <Text style={[styles.shapeDetailText, { color: currentTheme.text }]}>
                          {getLocalizedShapeDetailText(shapeDetails[s.id], "meaning", settings.language)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {orbShape === s.id && <Text style={{ color: currentTheme.primary }}>✓</Text>}
                </TouchableOpacity>
                  );
                })()
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.shapeModalClose, { backgroundColor: currentTheme.primary }]}
              onPress={() => setShowShapeSelector(false)}
            >
              <Text style={styles.shapeModalCloseText}>
                {tr('關閉', 'Close', 'Cerrar')}
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
                 {tr('培育光球', 'Grow Orb', 'Cultivar esfera')}
               </Text>
            </View>

            <Text style={[styles.inputLabel, { color: currentTheme.text, fontSize: 16, marginBottom: 20, textAlign: 'center' }]}>
               {settings.language === 'zh' 
                 ? `準備好進行 ${dailyAwakeningMinutesRequired} 分鐘的培育冥想了嗎？` 
                 : settings.language === "es"
                   ? `¿Lista para una meditación de cultivo de ${dailyAwakeningMinutesRequired} minutos?`
                   : `Ready for a ${dailyAwakeningMinutesRequired}-minute growth meditation?`}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#333' }]}
                onPress={() => setShowGrowthModal(false)}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {tr('取消', 'Cancel', 'Cancelar')}
                 </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                   setShowGrowthModal(false);
                   // Small delay to allow modal to close smoothly before starting animation/timer
                   setTimeout(() => {
                     startMeditation(dailyAwakeningMinutesRequired, "Growth");
                   }, 300);
                }}
              >
                 <Text style={{ color: 'white', fontWeight: 'bold' }}>
                   {settings.language === 'zh' ? `開始 (${dailyAwakeningMinutesRequired}分鐘)` : settings.language === "es" ? `Empezar (${dailyAwakeningMinutesRequired} min)` : `Start (${dailyAwakeningMinutesRequired} min)`}
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
            <ScrollView style={styles.giftModalScroll} contentContainerStyle={styles.giftModalContent}>
              <View style={styles.shapeModalHeader}>
                 <Text style={styles.giftHeart}>💝</Text>
                 <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                   {tr('贈送光球', 'Gift Orb', 'Regalar esfera')}
                 </Text>
              </View>

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

              <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 }]}>
                {tr(
                  '送出的是祝福複本。你自己的主光球會保留；對方會在「受到祝福」中觀賞。',
                  'You are sending a blessing copy. Your main orb stays with you, and your friend will view it in Received Blessings.',
                  'Estás enviando una copia de bendición. Tu esfera principal se queda contigo y tu amigo la verá en Bendiciones recibidas.'
                )}
              </Text>

              <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, marginTop: 8 }]}>
                {tr('主要方式：直接輸入對方 World 用戶名', 'Recommended: enter the recipient World username', 'Recomendado: introduce el nombre de usuario de World del destinatario')}
              </Text>
              <TextInput
                style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border || '#333' }]}
                placeholder={tr('@username 或 0x地址', '@username or 0x wallet address', '@username o dirección 0x')}
                placeholderTextColor={currentTheme.textSecondary}
                value={manualGiftRecipient}
                onChangeText={setManualGiftRecipient}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {recentGiftRecipients.length > 0 && (
                <View style={styles.quickRecipientRow}>
                  {recentGiftRecipients.map((username) => (
                    <TouchableOpacity
                      key={username}
                      style={[styles.quickRecipientChip, { borderColor: currentTheme.border || '#333', backgroundColor: currentTheme.surface }]}
                      onPress={() => setManualGiftRecipient(`@${username}`)}
                    >
                      <Text style={[styles.quickRecipientChipText, { color: currentTheme.text }]}>@{username}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.selectFriendButton, { borderColor: '#10b981', backgroundColor: isGiftingUI ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.08)' }]}
                onPress={handleManualGiftSend}
                disabled={isGiftingUI}
              >
                <Text style={[styles.selectFriendText, { color: '#10b981' }]}>
                  {isGiftingUI
                    ? tr('傳送中...', 'Sending...', 'Enviando...')
                    : tr('用 @username 傳送', 'Send with @username', 'Enviar con @username')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, marginTop: 14 }]}>
                {tr('不知道對方用戶名？', "Don't know their username?", '¿No conoces su nombre de usuario?')}
              </Text>
              <TouchableOpacity
                style={[styles.selectFriendButton, { borderColor: currentTheme.primary, backgroundColor: isGiftingUI ? 'rgba(139, 92, 246, 0.2)' : 'transparent' }]}
                onPress={handleStartGiftingOptimistic}
                disabled={isGiftingUI}
              >
                <Text style={[styles.selectFriendText, { color: currentTheme.primary }]}>
                  {isGiftingUI 
                    ? tr('贈送中...', 'Gifting...', 'Regalando...')
                    : tr('打開聯絡人（Beta）', 'Open contacts (Beta)', 'Abrir contactos (Beta)')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.usernameHelperText, { color: currentTheme.textSecondary, marginTop: 8 }]}>
                {tr(
                  '如聯絡人功能不穩，請叫對方複製自己的 @username，再回來這裡貼上。',
                  'If contact sharing is unreliable, ask the recipient to copy their @username and paste it here.',
                  'Si compartir contactos falla, pide al destinatario que copie su @username y lo pegue aquí.'
                )}
              </Text>

              <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, marginTop: 14 }]}>
                 {tr('祝福訊息', 'Blessing Message', 'Mensaje de bendición')}
              </Text>
              <View
                style={[
                  styles.soundGatingBanner,
                  {
                    borderColor: currentTheme.border || 'rgba(255,255,255,0.1)',
                    marginTop: 4,
                    marginBottom: 12,
                  },
                ]}
              >
                <Text style={styles.soundGatingTitle}>
                  {tr('Resonance 祝福加持', 'Resonance Blessing Boost', 'Impulso de bendición Resonance')}
                </Text>
                <Text style={styles.soundGatingText}>
                  {resonanceState.blessingBoostCharges > 0
                    ? tr(
                        `已準備 ${resonanceState.blessingBoostCharges} 次加持。下一次送出的祝福會帶金色 Resonance 標記，對方那邊會更顯眼，而你的送出記錄也會清楚標成加持祝福。`,
                        `${resonanceState.blessingBoostCharges} boost charge ready. Your next blessing will carry a golden Resonance mark, appear more prominently for the recipient, and stay clearly marked in your sent history.`,
                        `${resonanceState.blessingBoostCharges} mejora lista. Tu próxima bendición llevará una marca dorada de Resonance, destacará más para el destinatario y quedará marcada con claridad en tu historial.`
                      )
                    : tr(
                        `花費 ${RESONANCE_BLESSING_BOOST_COST} Resonance，可購買一次「下一次祝福加持」：你自己會立刻在送出記錄看見金色標記，而對方收到時也會更容易先看到這則祝福。`,
                        `Spend ${RESONANCE_BLESSING_BOOST_COST} Resonance to buy one Next Blessing Boost. You will immediately see the golden mark in sent history, and the recipient will notice that blessing more easily.`,
                        `Gasta ${RESONANCE_BLESSING_BOOST_COST} Resonance para comprar una mejora de próxima bendición. Verás la marca dorada en tu historial y el destinatario la notará más fácilmente.`
                      )}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectFriendButton,
                    {
                      marginTop: 10,
                      borderColor: '#f59e0b',
                      backgroundColor:
                        buyingBlessingBoost || resonanceState.blessingBoostCharges > 0
                          ? 'rgba(245, 158, 11, 0.16)'
                          : 'rgba(245, 158, 11, 0.08)',
                    },
                  ]}
                  onPress={handleUnlockBlessingBoost}
                  disabled={buyingBlessingBoost || resonanceState.blessingBoostCharges > 0}
                >
                  <Text style={[styles.selectFriendText, { color: '#f59e0b' }]}>
                    {resonanceState.blessingBoostCharges > 0
                      ? tr('下一次祝福已加持', 'Next blessing is amplified', 'La próxima bendición ya está potenciada')
                      : buyingBlessingBoost
                        ? tr('加持中...', 'Charging...', 'Potenciando...')
                        : tr(
                            `強化下一次祝福 · ${RESONANCE_BLESSING_BOOST_COST} Resonance`,
                            `Amplify Next Blessing · ${RESONANCE_BLESSING_BOOST_COST} Resonance`,
                            `Potenciar próxima bendición · ${RESONANCE_BLESSING_BOOST_COST} Resonance`
                          )}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                 style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border || '#333' }]}
                 placeholder={tr('願這顆光球帶來...', 'May this orb bring...', 'Que esta esfera traiga...')}
                 placeholderTextColor={currentTheme.textSecondary}
                 value={giftMessage}
                 onChangeText={setGiftMessage}
                 multiline
                 numberOfLines={3}
              />
              <View
                style={[
                  styles.soundGatingBanner,
                  {
                    borderColor: currentTheme.border || 'rgba(255,255,255,0.1)',
                    marginTop: 10,
                    marginBottom: 12,
                    backgroundColor: `${currentTheme.primary}08`,
                  },
                ]}
              >
                <Text style={styles.soundGatingTitle}>
                  {tr('送出預覽', 'Blessing Preview', 'Vista previa de bendición')}
                </Text>
                <Text style={styles.soundGatingText}>
                  {tr(
                    '你送出後，對方與你自己在送出記錄中會看到這段祝福文字。',
                    'This is how your blessing text will appear to the recipient and in your sent history.',
                    'Así es como aparecerá tu texto de bendición para el destinatario y en tu historial.'
                  )}
                </Text>
                <View
                  style={[
                    styles.orbPreviewMessageCard,
                    {
                      marginTop: 10,
                      borderColor: currentTheme.border || '#333',
                      backgroundColor: currentTheme.background,
                    },
                  ]}
                >
                  <Text style={[styles.orbPreviewMessageText, { color: currentTheme.textSecondary }]}>
                    {giftBlessingPreviewText}
                  </Text>
                </View>
                <Text style={[styles.soundGatingText, { marginTop: 10, color: blessingHasResonanceMark(giftBlessingPreviewText) ? '#f59e0b' : currentTheme.textSecondary }]}>
                  {blessingHasResonanceMark(giftBlessingPreviewText)
                    ? tr(
                        '效果：這次會顯示為 Resonance 加持祝福，並在對方那邊更顯眼。',
                        'Effect: this gift will be marked as Resonance-blessed and appear more prominently for the recipient.',
                        'Efecto: este regalo quedará marcado como bendición con Resonance y se verá con más destaque para la otra persona.'
                      )
                    : tr(
                        '效果：這次會以普通祝福送出。',
                        'Effect: this gift will be sent as a normal blessing.',
                        'Efecto: este regalo se enviará como una bendición normal.'
                      )}
                </Text>
              </View>
              {!firebaseEnabled && (
                <View style={styles.firebaseWarning}>
                  <Text style={styles.firebaseWarningText}>
                    {tr(
                      `Firebase 未啟用，可能缺少或配置錯誤的環境變數：${firebaseMissingEnv.join(", ")}`,
                      `Firebase is disabled, likely due to missing or misconfigured environment variables: ${firebaseMissingEnv.join(", ")}`,
                      `Firebase está desactivado, probablemente por variables de entorno ausentes o mal configuradas: ${firebaseMissingEnv.join(", ")}`
                    )}
                  </Text>
                </View>
              )}

              {giftingError && (
                <View style={{ marginTop: 10, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(239, 68, 68, 0.18)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.5)" }}>
                  <Text style={{ color: "#fecaca", fontSize: 13, fontWeight: "600" }}>{giftingError}</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#333' }]}
                  onPress={handleCancelGift}
                >
                   <Text style={{ color: 'white', fontWeight: 'bold' }}>
                     {tr('取消', 'Cancel', 'Cancelar')}
                   </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(previewOrb)}
        transparent
        animationType="fade"
        onRequestClose={closePreviewOrb}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapeModal, styles.orbPreviewModal, { backgroundColor: currentTheme.surface }]}>
            {previewOrb ? (
              <>
                <View style={styles.shapeModalHeader}>
                  <Sparkles size={20} color={currentTheme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionEyebrow, { color: currentTheme.primary }]}>
                      {previewOrb.isBlessingGift
                        ? tr("來自朋友", "From Others", "De otros")
                        : previewOrb.isVipGiftedStarter
                          ? tr("VIP 贈送", "VIP Gift", "Regalo VIP")
                          : tr("你的收藏", "Your Collection", "Tu colección")}
                    </Text>
                    <Text style={[styles.shapeModalTitle, { color: currentTheme.text }]}>
                      {previewOrb.isBlessingGift
                        ? tr("受到祝福", "Received Blessing", "Bendición recibida")
                        : tr("光球預覽", "Orb Preview", "Vista previa de esfera")}
                    </Text>
                  </View>
                </View>

                <View style={styles.orbPreviewModalCanvas}>
                  <Orb3DPreview orb={previewOrb} size={220} displayMode="idle" />
                </View>

                <Text style={[styles.orbPreviewModalTitle, { color: currentTheme.text }]}>
                  {previewShapeName ||
                    (previewOrb.isBlessingGift
                      ? tr("祝福光球", "Blessing Orb", "Esfera de bendición")
                      : tr("你的收藏光球", "Your Stored Orb", "Tu esfera guardada"))}
                </Text>

                <Text style={[styles.orbPreviewModalMeta, { color: currentTheme.textSecondary }]}>
                  {previewOrb.isBlessingGift
                    ? tr(
                        `由 ${previewOrb.sender || "朋友"} 送來`,
                        `Sent by ${previewOrb.sender || "Friend"}`,
                        `Enviado por ${previewOrb.sender || "Amistad"}`
                      )
                    : previewOrb.isVipGiftedStarter
                      ? tr("VIP 贈送的即時體驗覺醒球", "VIP gifted awakened orb for instant exploration", "Esfera despierta regaladа por VIP para exploración inmediata")
                    : tr(`已收藏 · 第 ${Math.max(0, previewOrb.level)} 層`, `Stored · Level ${Math.max(0, previewOrb.level)}`, `Guardada · Nivel ${Math.max(0, previewOrb.level)}`)}
                </Text>

                {!!previewOrb.message && (
                  <View
                    style={[
                      styles.orbPreviewMessageCard,
                      {
                        borderColor: currentTheme.border || "#333",
                        backgroundColor: currentTheme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.orbPreviewMessageText, { color: currentTheme.textSecondary }]}>
                      {previewOrb.message}
                    </Text>
                  </View>
                )}

                <Text style={[styles.orbPreviewRuleText, { color: currentTheme.textSecondary }]}>
                  {previewOrb.isBlessingGift
                    ? tr(
                        "這是一份可收藏的祝福，不會推進任務，也不能變成你的冥想主球。",
                        "This is a collectible blessing. It does not advance missions and cannot become your meditation orb.",
                        "Esta es una bendición coleccionable. No avanza misiones ni puede convertirse en tu esfera principal de meditación."
                      )
                    : previewOrb.isVipGiftedStarter
                      ? tr(
                          "這是 VIP 贈送的即時體驗球；你的主線光球仍然要靠完整 7 日旅程自己養成。",
                          "This VIP orb is for instant exploration. Your main orb still grows through the full 7-day journey.",
                          "Esta esfera VIP es para exploración inmediata. Tu esfera principal sigue creciendo a través del viaje completo de 7 días."
                        )
                    : tr(
                        "先觀賞這顆收藏光球，再決定是否切換成主球。",
                        "Preview this stored orb first, then decide whether to make it your main orb.",
                        "Primero contempla esta esfera guardada y luego decide si quieres convertirla en tu esfera principal."
                      )}
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#333" }]}
                    onPress={closePreviewOrb}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {tr("關閉", "Close", "Cerrar")}
                    </Text>
                  </TouchableOpacity>
                  {!previewOrb.isBlessingGift && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
                      onPress={handleUsePreviewOrb}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {tr("設為主球", "Use as Main Orb", "Usar como esfera principal")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : null}
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
                {tr('環境音', 'Ambient Sound', 'Sonido ambiental')}
              </Text>
              <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
                <X size={24} color={currentTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.soundList}>
              {!hasActiveVIP && (
                <View style={[styles.soundGatingBanner, { borderColor: currentTheme.border || 'rgba(255,255,255,0.1)' }]}>
                  <Text style={styles.soundGatingTitle}>
                    {tr('免費版只開放 5 條環境音', 'Free tier unlocks only 5 ambient sounds', 'La versión gratis desbloquea solo 5 sonidos ambientales')}
                  </Text>
                  <Text style={styles.soundGatingText}>
                    {hasAmbientPassToday
                      ? tr(
                          '你今日已開啟全環境音通行，現在可使用全部環境音。',
                          'Your all-sounds pass is active today. Every ambient sound is available right now.',
                          'Tu pase completo de sonidos está activo hoy. Ahora puedes usar todos los sonidos ambientales.'
                        )
                      : tr(
                          `其餘 ${vipAmbientSoundCount} 條環境音需升級 VIP，或花 ${RESONANCE_AMBIENT_PASS_COST} 點 Resonance 解鎖今天通行。`,
                          `The other ${vipAmbientSoundCount} sounds need VIP, or ${RESONANCE_AMBIENT_PASS_COST} Resonance for a one-day pass.`,
                          `Los otros ${vipAmbientSoundCount} sonidos requieren VIP o ${RESONANCE_AMBIENT_PASS_COST} de Resonance para un pase de un día.`
                        )}
                  </Text>
                  {!hasAmbientPassToday && (
                    <TouchableOpacity
                      style={[
                        styles.selectFriendButton,
                        {
                          marginTop: 10,
                          borderColor: '#22c55e',
                          backgroundColor: unlockingAmbientPass ? 'rgba(34, 197, 94, 0.16)' : 'rgba(34, 197, 94, 0.08)',
                        },
                      ]}
                      onPress={handleUnlockAmbientPass}
                      disabled={unlockingAmbientPass}
                    >
                        <Text style={[styles.selectFriendText, { color: '#22c55e' }]}>
                          {unlockingAmbientPass
                          ? tr('解鎖中...', 'Unlocking...', 'Desbloqueando...')
                          : tr(
                              `解鎖今天全部環境音 · ${RESONANCE_AMBIENT_PASS_COST} Resonance`,
                              `Unlock all ambient sounds today · ${RESONANCE_AMBIENT_PASS_COST} Resonance`,
                              `Desbloquear todos los sonidos de hoy · ${RESONANCE_AMBIENT_PASS_COST} Resonance`
                            )}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
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
                  {tr('無', 'None', 'Ninguno')}
                </Text>
                {selectedAmbientSound === null && (
                  <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.primary }]} />
                )}
              </TouchableOpacity>

              {AMBIENT_SOUND_CATEGORIES.map((category) => (
                <View key={category.id}>
                  <Text style={[styles.soundCategoryTitle, { color: currentTheme.primary }]}>
                    {category.name[ambientLabelLanguage]}
                  </Text>
                  {category.sounds.map((sound) => {
                    const isLocked = !hasActiveVIP && !hasAmbientPassToday && !isAmbientSoundFree(sound.id);
                    return (
                    <TouchableOpacity
                      key={sound.id}
                      style={[
                        styles.soundOption,
                        selectedAmbientSound === sound.id && styles.soundOptionSelected,
                        isLocked && styles.soundOptionLocked,
                      ]}
                      onPress={() => {
                        if (isLocked) {
                          Alert.alert(
                            settings.language === 'zh' ? 'VIP 環境音' : settings.language === 'es' ? 'Sonido ambiental VIP' : 'VIP Ambient Sound',
                            settings.language === 'zh'
                              ? '升級 VIP 後即可使用全部環境音。'
                              : 'Upgrade to VIP to unlock the full ambient sound library.',
                            [
                              { text: tr('稍後', 'Later', 'Luego'), style: 'cancel' },
                              { text: tr('前往升級', 'Go VIP', 'Ir a VIP'), onPress: () => navigation.navigate('profile' as never) },
                            ]
                          );
                          return;
                        }
                        setSelectedAmbientSound(sound.id);
                        setShowSoundPicker(false);
                      }}
                    >
                      <View style={styles.soundOptionContent}>
                        <Text style={[
                          styles.soundOptionText,
                          { color: currentTheme.text },
                          selectedAmbientSound === sound.id && styles.soundOptionTextSelected,
                          isLocked && styles.soundOptionTextLocked
                        ]}>
                          {sound.name[ambientLabelLanguage]}
                        </Text>
                        {isLocked && <Text style={styles.soundVipBadge}>VIP</Text>}
                      </View>
                      {selectedAmbientSound === sound.id && !isLocked && (
                        <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.primary }]} />
                      )}
                    </TouchableOpacity>
                  )})}
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

      <CustomModal
        isVisible={showShapeLockedModal}
        onClose={() => setShowShapeLockedModal(false)}
        title={tr("尚未覺醒", "Not Awakened", "Aún no despierto")}
        message={tr(
          "光球需要覺醒後才能選擇形態",
          "Orb must be awakened to change shape",
          "La esfera debe despertar antes de cambiar de forma"
        )}
        confirmText="OK"
        onConfirm={() => setShowShapeLockedModal(false)}
      />

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
                 {tr('冥想設定', 'Meditation Setup', 'Configuración de meditación')}
               </Text>
            </View>

            <Text style={[styles.inputLabel, { color: currentTheme.textSecondary }]}>
               {tr('意圖 (可選)', 'Intention (Optional)', 'Intención (opcional)')}
            </Text>
            <TextInput
               style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border || '#333' }]}
               placeholder={tr('例如：平靜、療癒...', 'e.g., Peace, Healing...', 'p. ej., paz, sanación...')}
               placeholderTextColor={currentTheme.textSecondary}
               value={awakenedIntention}
               onChangeText={setAwakenedIntention}
            />

            <Text style={[styles.inputLabel, { color: currentTheme.textSecondary, marginTop: 16 }]}>
               {tr('時間 (分鐘)', 'Duration (Minutes)', 'Duración (minutos)')}
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
                   {tr('取消', 'Cancel', 'Cancelar')}
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
                   {tr('開始', 'Start', 'Empezar')}
                 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Interaction Area */}
      <View
        style={[styles.sceneContainer, WEB_GESTURE_SURFACE_STYLE]}
        {...WEB_CONTEXT_MENU_PROPS}
        {...panResponder.panHandlers}
      >

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
                !isOrbAwakened && styles.topLeftMorphFabDisabled
              ]}
              onPress={() => {
                if (!isOrbAwakened) {
                  setShowShapeLockedModal(true);
                  return;
                }
                setShowShapeSelector(true);
              }}
              activeOpacity={0.7}
              disabled={isOrbDragging}
              testID="garden-shape-button"
            >
              <Sparkles size={18} color={isOrbAwakened ? "white" : "rgba(255,255,255,0.4)"} />
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
              {!isOrbAwakened ? (
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

        {isOrbAuraActive && (
          <View pointerEvents="none" style={styles.auraBackdrop}>
            <View style={styles.auraBloomPrimary} />
            <View style={styles.auraBloomSecondary} />
            <View style={styles.auraRingLarge} />
            <View style={styles.auraRingSmall} />
          </View>
        )}

        <View
          style={[
            styles.orbAuraShell,
            isOrbAuraActive && styles.orbAuraShellActive,
            WEB_GESTURE_SURFACE_STYLE,
          ]}
          pointerEvents="none"
        >
          {webGLAvailable ? (
            <Canvas camera={{ position: [0, 0, 4] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <OrbParticles 
                layers={currentOrb.layers} 
                interactionState={interactionState}
                shape={orbShape}
              />
            </Canvas>
          ) : (
            <View style={styles.canvasFallback}>
              <OrbFallback layers={currentOrb.layers} size={220} />
            </View>
          )}
        </View>
        
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
                {tr("上滑贈送", "Swipe Up to Gift", "Desliza hacia arriba para regalar")}
                </Text>
             </View>
             
             <View style={styles.instructionRow}>
                <View style={styles.holdDot} />
                <Text style={styles.instructionText}>
                  {tr("點擊擴散", "Tap to Diffuse", "Toca para expandir")}
                </Text>
             </View>
             
             <View style={styles.instructionRow}>
                <ArrowDown size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.instructionText}>
                  {tr("下滑收藏", "Swipe Down to Store", "Desliza hacia abajo para guardar")}
                </Text>
             </View>
          </View>
        )}
      </View>

      {giftDeliveryState && (
        <View
          style={[
            styles.giftStatusBanner,
            {
              backgroundColor:
                giftDeliveryState.status === "failed"
                  ? "#7f1d1d"
                  : giftDeliveryState.status === "delivered"
                    ? "#064e3b"
                    : currentTheme.surface,
              borderColor:
                giftDeliveryState.status === "failed"
                  ? "#ef4444"
                  : giftDeliveryState.status === "delivered"
                    ? "#10b981"
                    : currentTheme.primary,
            },
          ]}
        >
          <Text style={[styles.giftStatusTitle, { color: currentTheme.text }]}>
            {giftDeliveryState.status === "sending"
              ? tr("祝福正在傳送中...", "Sending your blessing...", "Enviando tu bendición...")
              : giftDeliveryState.status === "delivered"
                ? tr("祝福已寫入雲端", "Blessing synced to cloud", "La bendición se sincronizó con la nube")
                : tr("祝福未能送出，請稍後再試", "Blessing could not be sent. Please try again shortly.", "No se pudo enviar la bendición. Inténtalo de nuevo en breve.")}
          </Text>
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]}>
            {settings.language === "zh"
              ? `對象：${giftDeliveryState.friendName}`
              : `To: ${giftDeliveryState.friendName}`}
          </Text>
        </View>
      )}

      {localGiftOutbox[0] && (
        <View
          style={[
            styles.giftStatusBanner,
            {
              backgroundColor: currentTheme.surface,
              borderColor:
                localGiftOutbox[0].status === "uploaded" ? currentTheme.primary : "#ef4444",
            },
          ]}
        >
          <Text style={[styles.giftStatusTitle, { color: currentTheme.text }]}>
            {tr("最近一次送出記錄", "Latest sent blessing", "Última bendición enviada")}
          </Text>
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]}>
            {settings.language === "zh"
              ? `對象：${localGiftOutbox[0].friendName}`
              : `To: ${localGiftOutbox[0].friendName}`}
          </Text>
          {localGiftOutbox[0].toWalletAddress ? (
            <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]}>
              {settings.language === "zh"
                ? `地址：${localGiftOutbox[0].toWalletAddress}`
                : `Address: ${localGiftOutbox[0].toWalletAddress}`}
            </Text>
          ) : localGiftOutbox[0].toUsername ? (
            <Text style={[styles.giftStatusSubtitle, { color: currentTheme.primary }]}>
              {settings.language === "zh"
                ? `用戶名：@${localGiftOutbox[0].toUsername}`
                : `Username: @${localGiftOutbox[0].toUsername}`}
            </Text>
          ) : (
            <Text style={[styles.giftStatusSubtitle, { color: '#f59e0b' }]}>
              {settings.language === "zh"
                ? "未收到可用的 World 收件資料"
                : "No usable World recipient data was returned"}
            </Text>
          )}
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]} numberOfLines={2}>
            {settings.language === "zh"
              ? `祝福：${localGiftOutbox[0].blessing}`
              : `Blessing: ${localGiftOutbox[0].blessing}`}
          </Text>
          {blessingHasResonanceMark(localGiftOutbox[0].blessing) && (
            <Text style={[styles.giftStatusSubtitle, { color: '#f59e0b' }]}>
              {settings.language === "zh" ? "已附帶 Resonance 加持" : settings.language === "es" ? "Con impulso de Resonance" : "Resonance boost applied"}
            </Text>
          )}
          {!blessingHasResonanceMark(localGiftOutbox[0].blessing) && (
            <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]}>
              {settings.language === "zh" ? "這是一則普通祝福" : settings.language === "es" ? "Esta es una bendición normal" : "This is a normal blessing"}
            </Text>
          )}
	          <Text
              style={[
                styles.giftStatusSubtitle,
                {
                  color:
                    localGiftOutbox[0].status === "uploaded"
                      ? currentTheme.primary
                      : localGiftOutbox[0].status === "pending"
                        ? "#f59e0b"
                        : "#ef4444",
                },
              ]}
            >
	            {getSentBlessingStatusLabel(localGiftOutbox[0].status, settings.language, localGiftOutbox[0].giftId)}
	          </Text>
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]} numberOfLines={2}>
            {localGiftOutbox[0].status === "failed"
              ? settings.language === "zh"
                ? localGiftOutbox[0].toUsername
                  ? "已取得對方 World 用戶名，正在走用戶名送禮路徑。"
                  : "這代表傳送流程未拿到可寫入雲端的用戶名、地址或必要資料。"
                : localGiftOutbox[0].toUsername
                  ? "A World username was captured, but username-route gifting still failed."
                  : "This means the gifting flow did not receive a cloud-writable username, address, or payload."
              : localGiftOutbox[0].status === "pending"
                ? settings.language === "zh"
                  ? localGiftOutbox[0].toUsername
                    ? "已取得對方 World 用戶名，正在把祝福寫入雲端。"
                    : "已建立本地送出記錄，正在等待可用的收件資料與雲端同步。"
                  : localGiftOutbox[0].toUsername
                    ? "A World username was captured and the blessing is now syncing to the cloud."
                    : "A local sent record was created and the app is waiting for recipient data and cloud sync."
              : settings.language === "zh"
                ? "送出記錄會保留在花園下方面板。"
                : "The sent record stays in the garden panel below."}
          </Text>
        </View>
      )}

      {giftDebugMessage && (
        <View
          style={[
            styles.giftStatusBanner,
            {
              backgroundColor: currentTheme.surface,
              borderColor: "#f59e0b",
            },
          ]}
        >
          <Text style={[styles.giftStatusTitle, { color: currentTheme.text }]}>
            {tr("送禮診斷", "Gift diagnostics", "Diagnóstico del regalo")}
          </Text>
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]} numberOfLines={2}>
            {settings.language === "zh"
              ? `Firebase：${firebaseDiagnostics.projectId || "unknown"}`
              : `Firebase: ${firebaseDiagnostics.projectId || "unknown"}`}
          </Text>
          <Text style={[styles.giftStatusSubtitle, { color: currentTheme.textSecondary }]} numberOfLines={4}>
            {giftDebugMessage}
          </Text>
        </View>
      )}
      
      <View style={{ height: Math.max(COLLAPSED_DRAWER_HEIGHT - 56, 72) }} />

      <Animated.View
        style={[
          styles.gardenListContainer,
          {
            height: drawerHeight,
            backgroundColor: currentTheme.background,
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View style={styles.dragHandleContainer} {...drawerPanResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 96) }}
        >
          <View style={styles.collectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Archive size={18} color={currentTheme.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionEyebrow, { color: currentTheme.primary }]}>
                  {tr("七色收藏", "Sevenfold Archive", "Archivo septiforme")}
                </Text>
                <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                  {tr("花園收藏", "Garden Collection", "Colección del jardín")}
                </Text>
              </View>
            </View>
            <View style={[styles.sectionCountPill, { backgroundColor: `${currentTheme.primary}16`, borderColor: `${currentTheme.primary}30` }]}>
              <Text style={[styles.sectionCountText, { color: currentTheme.primary }]}>
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

          <View
            style={[
              styles.drawerSection,
              {
                backgroundColor: `${currentTheme.surface}CC`,
                borderColor: `${currentTheme.textSecondary}18`,
              },
            ]}
          >
            <View style={styles.collectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <ArrowUp size={18} color={currentTheme.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionEyebrow, { color: currentTheme.primary }]}>
                    {tr("祝福軌跡", "Blessing Trail", "Rastro de bendiciones")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    {tr("已送出祝福", "Sent Blessings", "Bendiciones enviadas")}
                  </Text>
                </View>
              </View>
              <View style={[styles.sectionCountPill, { backgroundColor: `${currentTheme.primary}16`, borderColor: `${currentTheme.primary}30` }]}>
                <Text style={[styles.sectionCountText, { color: currentTheme.primary }]}>
                  {displayedSentBlessings.length}
                </Text>
              </View>
            </View>

            <Text style={[styles.blessingSectionHint, { color: currentTheme.textSecondary }]}>
              {settings.language === 'zh'
                ? "這裡保存你送出當刻的光球與祝福。"
                : "This shelf keeps the orb and blessing exactly as you sent them."}
            </Text>

            {!giftHistoryReady && displayedSentBlessings.length === 0 ? (
              <Text style={[styles.blessingEmptyText, { color: currentTheme.textSecondary }]}>
                {settings.language === 'zh' ? "正在同步祝福記錄..." : settings.language === "es" ? "Sincronizando el historial de bendiciones..." : "Syncing blessing history..."}
              </Text>
            ) : displayedSentBlessings.length === 0 ? (
              <Text style={[styles.blessingEmptyText, { color: currentTheme.textSecondary }]}>
                {settings.language === 'zh'
                ? "你還未送出任何祝福。當你把光球送給朋友，記錄會留在這裡。"
                : "You have not sent any blessings yet. When you gift an orb to a friend, the record will stay here."}
              </Text>
            ) : (
              <>
                {!giftHistoryReady && (
                  <Text style={[styles.blessingEmptyText, { color: currentTheme.textSecondary }]}>
                    {settings.language === 'zh' ? "正在同步雲端記錄，先顯示本機送出結果..." : settings.language === "es" ? "Sincronizando el historial en la nube; mostrando primero los envíos locales..." : "Syncing cloud history, showing local sent records first..."}
                  </Text>
                )}
                {giftHistoryError && (
                  <Text style={[styles.blessingEmptyText, { color: '#f59e0b' }]}>
                    {giftHistoryError}
                  </Text>
                )}
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.gardenList}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {displayedSentBlessings.map((gift, index) => (
                    (() => {
                      const isResonanceBlessed = Boolean((gift as any).resonanceBlessed) || blessingHasResonanceMark(gift.blessing);
                      return (
                    <TouchableOpacity
                      key={`top-sent-${gift.giftId || index}`}
                      style={[
                        styles.orbCard,
                        {
                          backgroundColor: currentTheme.surface,
                          opacity: 0.98,
                          borderColor: isResonanceBlessed ? "rgba(245,158,11,0.5)" : `${currentTheme.textSecondary}20`,
                          shadowColor: isResonanceBlessed ? "#f59e0b" : "#000",
                          shadowOpacity: isResonanceBlessed ? 0.18 : 0.08,
                        },
                      ]}
                      activeOpacity={0.86}
                      onPress={() => handleSentBlessingSelect(gift)}
                    >
                      <View style={[styles.orbCardBadge, { backgroundColor: isResonanceBlessed ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.08)' }]}>
                        <Text style={[styles.orbCardBadgeText, { color: isResonanceBlessed ? '#f59e0b' : currentTheme.primary }]} numberOfLines={1}>
                          {gift.status === 'consumed'
                            ? tr('已被接收', 'Received', 'Recibido')
                            : gift.status === 'synced'
                              ? tr('已寫入雲端', 'Synced', 'Sincronizado')
                            : gift.status === 'failed'
                              ? tr('上傳失敗', 'Failed', 'Falló')
                              : tr('待接收', 'Awaiting', 'En espera')}
                        </Text>
                      </View>
                      <OrbCardPreview
                        shape={(gift.orb?.shape as OrbShape | undefined) ?? "default"}
                        layers={gift.orb?.layers || []}
                      />
                      <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]}>
                        {new Date(gift.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={[styles.orbSender, { color: currentTheme.text }]} numberOfLines={1}>
                        {(
                          tr('送往 ', 'To ', 'Para ') +
                          ((gift as any).friendName || (gift as any).toUsername || gift.to || tr('好友', 'Friend', 'Amistad'))
                        )}
                      </Text>
                      <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]} numberOfLines={2}>
                        {gift.blessing || tr('願這份祝福順利抵達。', 'May this blessing arrive safely.', 'Que esta bendición llegue con suavidad y claridad.')}
                      </Text>
                      {isResonanceBlessed && (
                        <Text style={[styles.orbCardCaption, { color: '#f59e0b' }]} numberOfLines={1}>
                          {tr('Resonance 加持 · 更顯眼', 'Resonance-blessed · more visible', 'Con Resonance · más visible')}
                        </Text>
                      )}
                      <Text style={[styles.orbCardCaption, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                        {tr('點擊查看送出的那一刻', 'Tap to revisit the sent moment', 'Toca para revivir el momento del envío')}
                      </Text>
                    </TouchableOpacity>
                      );
                    })()
                  ))}
                </ScrollView>
              </>
            )}
          </View>
	        
          <View
            style={[
              styles.drawerSection,
              {
                backgroundColor: `${currentTheme.surface}CC`,
                borderColor: `${currentTheme.textSecondary}18`,
              },
            ]}
          >
            <View style={styles.collectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Gift size={18} color={currentTheme.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionEyebrow, { color: currentTheme.primary }]}>
                    {tr("來自朋友", "From Others", "De otros")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    {tr("受到祝福", "Received Blessings", "Bendiciones recibidas")}
                  </Text>
                </View>
              </View>
              <View style={[styles.sectionCountPill, { backgroundColor: `${currentTheme.primary}16`, borderColor: `${currentTheme.primary}30` }]}>
                <Text style={[styles.sectionCountText, { color: currentTheme.primary }]}>
                  {blessingHistory.length}
                </Text>
              </View>
            </View>

            <Text style={[styles.blessingSectionHint, { color: currentTheme.textSecondary }]}>
              {settings.language === 'zh'
                ? "朋友送來的祝福會收藏在這裡，只供觀賞與紀念。"
                : "Blessings from friends are preserved here for viewing and remembrance."}
            </Text>

            {blessingHistory.length === 0 ? (
              <Text style={[styles.blessingEmptyText, { color: currentTheme.textSecondary }]}>
                {settings.language === 'zh'
                  ? "你還未收到祝福。當朋友送你光球，它會出現在這裡。"
                  : "You have not received a blessing yet. When a friend sends you an orb, it will appear here."}
              </Text>
            ) : (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.gardenList}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {blessingHistory.map((orb, index) => {
                  const isResonanceBlessed = Boolean(orb.resonanceBlessed) || blessingHasResonanceMark(orb.message);
                  return (
                  <TouchableOpacity
                    key={orb.id || `blessing-top-${index}`}
                    style={[
                      styles.orbCard,
                      {
                        backgroundColor: currentTheme.surface,
                        opacity: 0.95,
                        borderColor: isResonanceBlessed ? "rgba(245,158,11,0.5)" : `${currentTheme.textSecondary}20`,
                        shadowColor: isResonanceBlessed ? "#f59e0b" : "#000",
                        shadowOpacity: isResonanceBlessed ? 0.18 : 0.08,
                      },
                    ]}
                    onPress={() => handleOrbSelect(orb)}
                  >
                    <View style={[styles.orbCardBadge, { backgroundColor: isResonanceBlessed ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.08)' }]}>
                      <Text style={[styles.orbCardBadgeText, { color: isResonanceBlessed ? '#f59e0b' : currentTheme.primary }]} numberOfLines={1}>
                        {tr('觀賞收藏', 'View-only keepsake', 'Recuerdo solo para ver')}
                      </Text>
                    </View>
                    <OrbCardPreview shape={orb.shape} layers={orb.layers} />
                    <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]}>
                      {new Date(orb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.orbSender, { color: currentTheme.text }]} numberOfLines={1}>
                      {(tr('來自 ', 'From ', 'De ') + (orb.sender || tr('朋友', 'Friend', 'Amistad')))}
                    </Text>
                    <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]} numberOfLines={2}>
                      {orb.message || tr('願這份祝福陪伴你。', 'May this blessing stay with you.', 'Que esta bendición te acompañe.')}
                    </Text>
                    {isResonanceBlessed && (
                      <Text style={[styles.orbCardCaption, { color: '#f59e0b' }]} numberOfLines={1}>
                        {tr('Resonance 加持 · 置頂祝福', 'Resonance-blessed · pinned', 'Con Resonance · fijada')}
                      </Text>
                    )}
                    <Text style={[styles.orbCardCaption, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                      {tr('只供觀賞，不能冥想或解任務', 'View only, not for meditation or unlocks', 'Solo para ver; no sirve para meditar ni desbloquear')}
                    </Text>
                    <Text style={[styles.orbCardCaption, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                      {tr('點擊打開 3D 預覽', 'Tap to open 3D preview', 'Toca para abrir la vista 3D')}
                    </Text>
                  </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View
            style={[
              styles.drawerSection,
              {
                backgroundColor: `${currentTheme.surface}CC`,
                borderColor: `${currentTheme.textSecondary}18`,
              },
            ]}
          >
            <View style={styles.collectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Archive size={18} color={currentTheme.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionEyebrow, { color: currentTheme.primary }]}>
                    {tr("你的收藏", "Your Collection", "Tu colección")}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
                    {tr("你的光球", "Your Orbs", "Tus esferas")}
                  </Text>
                </View>
              </View>
              <View style={[styles.sectionCountPill, { backgroundColor: `${currentTheme.primary}16`, borderColor: `${currentTheme.primary}30` }]}>
                <Text style={[styles.sectionCountText, { color: currentTheme.primary }]}>
                  {cultivatedOrbHistory.length}
                </Text>
              </View>
            </View>

            <Text style={[styles.blessingSectionHint, { color: currentTheme.textSecondary }]}>
              {tr(
                "這些是你真正養成下來的光球，可先預覽，再決定是否切換成主球。",
                "These are the orbs you truly cultivated. Preview first, then decide whether to make one your main orb.",
                "Estas son las esferas que realmente cultivaste. Primero míralas y luego decide si quieres convertir una en tu esfera principal."
              )}
            </Text>

          <ScrollView 
            horizontal 
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false} 
            style={styles.gardenList}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
             {cultivatedOrbHistory.length === 0 ? (
               <Text style={{ color: currentTheme.textSecondary, padding: 20 }}>
                 {tr("暫無收藏", "Empty collection", "Colección vacía")}
               </Text>
             ) : (
               cultivatedOrbHistory.map((orb, index) => {
                 const shapeNameZh = orb.shape && orb.shape !== 'default' 
                    ? shapes.find(s => s.id === orb.shape)?.nameZh 
                    : null;
                 const shapeNameEn = orb.shape && orb.shape !== 'default'
                    ? shapes.find(s => s.id === orb.shape)?.name
                    : null;
                 
                 const displayName = settings.language === 'zh' 
                    ? (shapeNameZh || orb.sender || "我自己")
                    : settings.language === 'es'
                      ? (shapeNameEn || orb.sender || "Yo")
                      : (shapeNameEn || orb.sender || "Me");

                 return (
                 <TouchableOpacity 
                    key={orb.id || index} 
                    style={[styles.orbCard, { backgroundColor: currentTheme.surface }]}
                    onPress={() => handleOrbSelect(orb)}
                 >
                   <View style={[styles.orbCardBadge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                     <Text style={[styles.orbCardBadgeText, { color: currentTheme.primary }]} numberOfLines={1}>
                       {tr('可設為主球', 'Can become main orb', 'Puede ser esfera principal')}
                     </Text>
                   </View>
                   <View style={styles.orbShapePreviewWrap}>
                     <View style={styles.orbPreview}>
                       {orb.layers.map((color, i) => (
                         <View
                           key={`${orb.id}-${color}-${i}`}
                           style={[
                             styles.orbLayer,
                             {
                               backgroundColor: color,
                               width: 14 + i * 6,
                               height: 14 + i * 6,
                               opacity: 0.88,
                             },
                           ]}
                         />
                       ))}
                       {orb.layers.length === 0 && (
                         <View style={[styles.orbLayer, { backgroundColor: "#ccc", width: 24, height: 24 }]} />
                       )}
                     </View>
                   </View>
                   <Text style={[styles.orbSender, { color: currentTheme.text }]} numberOfLines={1}>
                     {displayName}
                   </Text>
                   <Text style={[styles.orbCardMeta, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                     {orb.shape && orb.shape !== 'default'
                       ? (settings.language === 'zh'
                           ? `${shapeNameZh || displayName} · 第 ${Math.max(0, orb.level)} 層`
                           : settings.language === 'es'
                             ? `${displayName} · Nivel ${Math.max(0, orb.level)}`
                           : `${displayName} · Level ${Math.max(0, orb.level)}`)
                       : (settings.language === 'zh'
                           ? `第 ${Math.max(0, orb.level)} 層`
                           : settings.language === 'es'
                             ? `Nivel ${Math.max(0, orb.level)}`
                           : `Level ${Math.max(0, orb.level)}`)}
                   </Text>
                   <Text style={[styles.orbCardCaption, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                     {tr('點擊預覽後再決定切換', 'Preview first, then choose to switch', 'Primero vista previa y luego decide si cambiar')}
                   </Text>
                 </TouchableOpacity>
               )})
             )}
          </ScrollView>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <Animated.View 
          style={[
            styles.fullscreenOverlay,
            { opacity: fullscreenFadeAnim }
          ]}
        >
          <View
            style={[styles.fullscreenTouchable, WEB_GESTURE_SURFACE_STYLE]}
            {...WEB_CONTEXT_MENU_PROPS}
            {...fullscreenPanResponder.panHandlers}
          >
            <View style={styles.fullscreenCanvasWrapper}>
              {webGLAvailable ? (
                <Canvas camera={{ position: [0, 0, 4.8] }} style={styles.fullscreenCanvas}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <OrbParticles 
                    layers={currentOrb.layers} 
                    interactionState={interactionState}
                    shape={orbShape}
                  />
                </Canvas>
              ) : (
                <View style={styles.fullscreenFallback}>
                  <OrbFallback layers={currentOrb.layers} size={320} />
                </View>
              )}
            </View>
            
            {/* Floating Action Buttons */}
            <View style={styles.fullscreenActionButtons} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.fullscreenActionButton}
                onPress={() => {
                  if (!isOrbAwakened) {
                    setShowShapeLockedModal(true);
                    return;
                  }
                  setShowShapeSelector(true);
                }}
                activeOpacity={0.7}
              >
                <Sparkles size={20} color="white" />
                <Text style={styles.fullscreenActionText}>
                  {tr('形態', 'MORPH', 'FORMA')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.fullscreenActionButton, styles.fullscreenMeditateButton]}
                onPress={() => {
                  if (!isOrbAwakened) {
                    setShowGrowthModal(true);
                  } else {
                    setShowAwakenedModal(true);
                  }
                }}
                activeOpacity={0.7}
              >
                <Sprout size={20} color="white" />
                <Text style={styles.fullscreenActionText}>
                  {tr('冥想', 'MEDITATE', 'MEDITAR')}
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
              {tr('點擊切換擴散', 'Tap to toggle diffuse', 'Toca para alternar la difusión')}
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
    height: ORB_SCENE_HEIGHT,
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    marginBottom: 18,
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
  canvasFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraBloomPrimary: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 46,
  },
  auraBloomSecondary: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    shadowColor: '#fde68a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  auraRingLarge: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.22)',
  },
  auraRingSmall: {
    position: 'absolute',
    width: 238,
    height: 238,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orbAuraShell: {
    flex: 1,
  },
  orbAuraShellActive: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 10,
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
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    opacity: 0.8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    flexShrink: 1,
  },
  holdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  infoContainer: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  infoPanelCompact: {
    gap: 8,
    padding: 10,
    borderRadius: 20,
  },
  infoPanel: {
    gap: 12,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  infoPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoPanelEyebrow: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  infoPanelBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  infoPanelBalanceText: {
    fontSize: 12,
    fontWeight: '900' as const,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  infoRowCompact: {
    gap: 8,
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
  infoCardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  infoCardWide: {
    flex: 0,
    width: '100%',
  },
  infoCardWideCompact: {
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e0ff',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  abilityChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  abilityChipRowCompact: {
    marginTop: 4,
  },
  abilityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  abilityChipText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.25,
  },
  dashboardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dashboardActionRowCompact: {
    marginTop: 6,
    gap: 6,
  },
  dashboardActionButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dashboardActionButtonCompact: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dashboardActionButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  giftStatusBanner: {
    marginHorizontal: 20,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  giftStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  giftStatusSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
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
    marginRight: 18,
  },
  sectionCountPill: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
  gardenListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139,92,246,0.2)',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 16,
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
    marginHorizontal: 18,
    marginBottom: 8,
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#e0e0ff',
    letterSpacing: 0.5,
  },
  gardenList: {
    paddingHorizontal: 16,
  },
  drawerSection: {
    marginHorizontal: 14,
    marginTop: 14,
    paddingTop: 14,
    paddingBottom: 6,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  blessingSectionHint: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 12,
  },
  blessingEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orbCard: {
    width: 112,
    minHeight: 138,
    borderRadius: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'rgba(20,20,40,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.26)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  orbPreview: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbShapePreviewWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orbLayer: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbDate: {
    fontSize: 10,
    marginBottom: 4,
    color: '#b0b0ff',
    textAlign: 'center',
  },
  orbSender: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '100%',
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 4,
  },
  orbCardBadge: {
    alignSelf: 'stretch',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  orbCardBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  orbCardMeta: {
    fontSize: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  orbCardCaption: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  orbPreviewModal: {
    maxHeight: '82%',
  },
  orbPreviewModalCanvas: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orbPreviewModalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 6,
  },
  orbPreviewModalMeta: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  orbPreviewMessageCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  orbPreviewMessageText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  orbPreviewRuleText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
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
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  shapePreviewWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapePreviewInner: {
    width: MICRO_PREVIEW_SIZE,
    height: MICRO_PREVIEW_SIZE,
  },
  shapePreviewDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  shapeTextBlock: {
    flex: 1,
    minHeight: 68,
    justifyContent: 'center',
  },
  shapeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shapeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  shapeLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  shapeAccessBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  shapeAccessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  shapeSummary: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  shapeDetailCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  shapeDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shapeDetailText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
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
  fullscreenFallback: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  soundGatingBanner: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
  },
  soundGatingTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  soundGatingText: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  usernameHelperCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  usernameHelperTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  usernameHelperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  quickRecipientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickRecipientChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickRecipientChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
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
  soundOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    paddingRight: 12,
  },
  soundOptionLocked: {
    opacity: 0.82,
  },
  soundOptionSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  soundOptionText: {
    fontSize: 16,
  },
  soundOptionTextLocked: {
    color: 'rgba(255,255,255,0.6)',
  },
  soundOptionTextSelected: {
    fontWeight: '600' as const,
  },
  soundVipBadge: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#7C3AED',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
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
