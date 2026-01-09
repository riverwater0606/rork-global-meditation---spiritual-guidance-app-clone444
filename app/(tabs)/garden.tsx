/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Modal, Dimensions, Animated, Easing, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, OrbShape, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { fetchAndConsumeGifts, uploadGiftOrb } from "@/lib/firebaseGifts";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { generateMerkabaData, generateEarthData, generateFlowerOfLifeData, generateFlowerOfLifeCompleteData, generateTreeOfLifeData, generateGridOfLifeData, generateSriYantraData, generateStarOfDavidData, generateTriquetraData, generateGoldenRectanglesData, generateDoubleHelixDNAData, generateVortexRingData, generateFractalTreeData, generateWaveInterferenceData, generateQuantumOrbitalsData, generateCelticKnotData, generateStarburstNovaData, generateLatticeWaveData, generateSacredFlameData, PARTICLE_COUNT } from "@/constants/sacredGeometry";
import { Clock, Zap, Archive, ArrowUp, ArrowDown, Sparkles, X, Sprout, Maximize2, Minimize2, Music, Volume2, VolumeX } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { MiniKit, ResponseEvent } from "@/constants/minikit";
import * as Haptics from "expo-haptics";

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

    // 5. Earth
    const generateEarth = () => {
      const data = generateEarthData();
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
    else if (shape === 'grid-of-life') generateGridOfLife();
    else if (shape === 'sri-yantra') generateSriYantra();
    else if (shape === 'triquetra') generateTriquetra();
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
    if (shape === 'earth') {
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
    if (shape !== 'merkaba' && shape !== 'earth') {
      pointsRef.current.rotation.x += rotationSpeedX;
    }
    
    // Merkaba needs to stay upright (no Z tilt from gestures if we supported them)
    // Actually standard rotation is only Y.
    // If we want to allow user to tilt earth? 
    // For now keep Y rotation.
    
    if (shape === 'merkaba' || shape === 'earth') {
       pointsRef.current.rotation.z = 0;
       // Earth needs to be upright
       pointsRef.current.rotation.x = 0; 
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
      } else if (shape === 'earth') {
          // Earth Animation: 
          // 1. Slow rotation of the "texture" (points) relative to the frame?
          // No, we rotate the whole group in the standard rotation logic below.
          // But user asked for "Unlock rotation... let user control".
          // And also "90s slow rotation".
          
          // If we want the particles to move *on* the sphere while the sphere is static?
          // No, usually we rotate the sphere container.
          
          // Let's handle Earth rotation in the main rotation logic (outside loop)
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
  const modeResetTimeoutRef = useRef<any>(null); // Safety timeout for mode reset
  const meditationTimerRef = useRef<any>(null);
  const handleGiftSuccessRef = useRef<(contact: any) => void>(() => {});
  const giftSoundRef = useRef<Audio.Sound | null>(null);
  const ambientSoundRef = useRef<Audio.Sound | null>(null);
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  useEffect(() => {
    console.log("[DEBUG_GIFT] GardenScreen MOUNTED - Checking for pending actions...");
    return () => console.log("[DEBUG_GIFT] GardenScreen UNMOUNTED");
  }, []);

  // Subscribe to MiniKit Events
  useEffect(() => {
    if (MiniKit && MiniKit.isInstalled()) {
      MiniKit.subscribe(ResponseEvent.MiniAppShareContacts, (payload: any) => {
        console.log("[DEBUG_GIFT] MiniKit Event: ResponseEvent.MiniAppShareContacts triggered");
        console.log("[DEBUG_GIFT] Event Payload (Full):", JSON.stringify(payload, null, 2));
        
        // FORCE SUCCESS: If we have contacts, it is a success, regardless of status flags
        const contacts = payload?.contacts || payload?.response?.contacts || payload?.finalPayload?.contacts;
        console.log("[DEBUG_GIFT] Extracted contacts from event:", JSON.stringify(contacts));

        if (contacts && contacts.length > 0) {
           console.log("[DEBUG_GIFT] Event has contacts, calling handleGiftSuccessRef");
           handleGiftSuccessRef.current(contacts[0]);
        } else {
           console.log("[DEBUG_GIFT] Event triggered but no contacts found in payload");
        }
      });

      return () => {
        MiniKit.unsubscribe(ResponseEvent.MiniAppShareContacts);
      };
    } else {
        console.log("[DEBUG] MiniKit not installed or not available for subscription");
    }
  }, []);

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

  const giftPollInFlightRef = useRef<boolean>(false);

  useEffect(() => {
    if (!walletAddress) {
      console.log("[DEBUG_GIFT_CLOUD] Polling disabled (no walletAddress)");
      return;
    }

    console.log("[DEBUG_GIFT_CLOUD] Starting Firebase gift poll for:", walletAddress);

    const interval = setInterval(() => {
      const run = async () => {
        if (giftPollInFlightRef.current) return;
        giftPollInFlightRef.current = true;

        try {
          const gifts = await fetchAndConsumeGifts({ myWalletAddress: walletAddress, max: 5 });
          if (gifts.length > 0) {
            console.log("[DEBUG_GIFT_CLOUD] Received gifts:", gifts.length);
          }

          for (const g of gifts) {
            console.log("[DEBUG_GIFT_CLOUD] Consuming gift:", JSON.stringify(g, null, 2));
            await receiveGiftOrb({
              fromDisplayName: g.fromDisplayName,
              fromWalletAddress: g.from,
              blessing: g.blessing,
              orb: {
                id: g.orb.id,
                level: g.orb.level,
                layers: g.orb.layers,
                isAwakened: g.orb.isAwakened,
                createdAt: g.orb.createdAt,
                completedAt: g.orb.completedAt,
                shape: (g.orb.shape as OrbShape | undefined) ?? undefined,
              },
            });

            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
              settings.language === "zh" ? "🎁 收到光球" : "🎁 Gift Received",
              settings.language === "zh"
                ? `你收到來自 ${g.fromDisplayName || "朋友"} 的光球`
                : `You received an orb from ${g.fromDisplayName || "Friend"}`
            );
          }
        } catch (e) {
          console.error("[DEBUG_GIFT_CLOUD] Gift poll failed:", e);
          Alert.alert(settings.language === "zh" ? "傳送失敗，請重試" : "Send failed, please retry");
        } finally {
          giftPollInFlightRef.current = false;
        }
      };

      void run();
    }, 6000);

    return () => {
      clearInterval(interval);
    };
  }, [walletAddress, receiveGiftOrb, settings.language]);
  
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
     
     // FOR TESTING: Removed !hasGrownOrbToday check
     if (!currentOrb.isAwakened) {
       await cultivateDailyOrb();
       Alert.alert(
          settings.language === 'zh' ? "冥想完成" : "Meditation Complete", 
          settings.language === 'zh' ? "你的光球吸收了能量。" : "Your orb has absorbed energy."
       );
     } else {
       await completeMeditation("awakened-session", durationMinutes, false);
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

  const handleGiftSuccess = (contact: any) => {
    console.log("[DEBUG_GIFT] handleGiftSuccess called with:", JSON.stringify(contact, null, 2));
    
    if (isGifting.current) {
        console.log("[DEBUG_GIFT] isGifting.current is true, ignoring duplicate call");
        return;
    }
    isGifting.current = true;

    const friendName = contact.name || `User ${contact.walletAddress?.slice(0, 4) || 'Unknown'}`;
    console.log("[DEBUG_GIFT] Processing Gift Success for:", friendName);

    // 1. UI Success Flow IMMEDIATELY (Optimistic & Local Simulation)
    finishGifting(friendName);

    // 2. NO BLOCKCHAIN TRANSACTION (Local Simulation Mode)
    // We only record the gift locally via finishGifting -> sendOrb
    console.log("[DEBUG_GIFT] Gift simulated successfully (Local Mode)");
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
             // Call sendOrb to archive and reset the orb
             await sendOrbRef.current(friendName, savedGiftMessage);
             console.log("[DEBUG_GIFT] sendOrbRef.current completed - orb should be reset now");
             
             // Additional haptic to confirm send
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           } catch (sendError) {
              console.error("[DEBUG_GIFT] sendOrb error:", sendError);
           }
      }, 2000);
      
      // 4. Reset all states after animation completes
      setTimeout(() => {
           console.log("[DEBUG_GIFT] Animation complete (3000ms), resetting all states");
           
           // Reset ALL states
           setGiftMessage("");
           setIsGiftingUI(false);
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
    console.log("[DEBUG_GIFT] handleStartGiftingOptimistic PRESS");
    console.log("[DEBUG_GIFT] Current state - isGifting:", isGifting.current, "mode:", interactionState.current.mode);

    if (isGifting.current) {
      console.log("[DEBUG_GIFT] isGifting.current is true, ignoring optimistic gift start");
      // Safety: if button was pressed but state is stuck, force reset after alert
      Alert.alert(
        settings.language === 'zh' ? "請稍候" : "Please wait",
        settings.language === 'zh' ? "正在處理中..." : "Processing..."
      );
      return;
    }

    const orbSnapshot = {
      id: currentOrbRef.current.id || `orb-${Date.now()}`,
      level: currentOrbRef.current.level,
      layers: [...(currentOrbRef.current.layers ?? [])],
      isAwakened: Boolean(currentOrbRef.current.isAwakened),
      createdAt: currentOrbRef.current.createdAt || new Date().toISOString(),
      completedAt: currentOrbRef.current.completedAt,
      shape: currentOrbRef.current.shape,
      rotationSpeed: interactionState.current.spinVelocity,
    };

    isGifting.current = true;
    setIsGiftingUI(true);

    const genericFriendName = settings.language === "zh" ? "朋友" : "Friend";

    console.log("[DEBUG_GIFT] IMMEDIATE SUCCESS UI (no dependency on shareContacts)");
    finishGifting(genericFriendName);

    setTimeout(() => {
      const run = async () => {
        try {
          if (!MiniKit || !MiniKit.isInstalled()) {
            console.log("[DEBUG_GIFT_CLOUD] MiniKit not installed - skipping shareContacts + upload");
            return;
          }

          if (!MiniKit.commandsAsync?.shareContacts) {
            console.log("[DEBUG_GIFT_CLOUD] MiniKit.commandsAsync.shareContacts missing - skipping upload");
            return;
          }

          console.log("[DEBUG_GIFT_CLOUD] Calling shareContacts in background...");
          const result: any = await MiniKit.commandsAsync.shareContacts({
            isMultiSelectEnabled: false,
          });
          console.log("[DEBUG_GIFT_CLOUD] shareContacts resolved:", JSON.stringify(result, null, 2));

          const contact = result?.contacts?.[0] || result?.response?.contacts?.[0];
          const toWalletAddress: string | undefined = contact?.walletAddress;

          if (!toWalletAddress) {
            console.log("[DEBUG_GIFT_CLOUD] No walletAddress in shareContacts result - cannot upload gift");
            return;
          }

          const fromWalletAddress = walletAddress ?? "unknown";

          console.log("[DEBUG_GIFT_CLOUD] Uploading gift orb to Firebase...");
          const uploaded = await uploadGiftOrb({
            toWalletAddress,
            fromWalletAddress,
            fromDisplayName: walletAddress ? `0x${walletAddress.slice(2, 6)}…` : undefined,
            blessing: giftMessage || (settings.language === "zh" ? "願愛與能量永流" : "May love and energy flow forever."),
            orb: {
              id: orbSnapshot.id,
              level: orbSnapshot.level,
              layers: orbSnapshot.layers,
              isAwakened: orbSnapshot.isAwakened,
              createdAt: orbSnapshot.createdAt,
              completedAt: orbSnapshot.completedAt,
              shape: orbSnapshot.shape,
              rotationSpeed: orbSnapshot.rotationSpeed,
            },
          });

          console.log("[DEBUG_GIFT_CLOUD] Gift uploaded:", uploaded.giftId);
        } catch (e) {
          console.error("[DEBUG_GIFT_CLOUD] shareContacts/upload failed:", e);
          Alert.alert(settings.language === "zh" ? "傳送失敗，請重試" : "Send failed, please retry");
        }
      };

      void run();
    }, 200);
  };

  const handleCancelGift = () => {
    console.log("[DEBUG_GIFT] handleCancelGift called. hasAttemptedGift:", hasAttemptedGift.current);
    console.log("[DEBUG_GIFT] Current mode:", interactionState.current.mode, "isGifting:", isGifting.current);
    
    // FORCE SUCCESS CHECK: If user attempted to gift but failed/cancelled, treat as success
    if (hasAttemptedGift.current) {
        console.log("[DEBUG_GIFT] Force success from Cancel after attempt");
        finishGifting(settings.language === 'zh' ? "朋友" : "Friend");
        return;
    }

    setShowGiftModal(false);
    setGiftMessage("");
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
  fullscreenButton: {
    position: 'absolute',
    bottom: 18,
    left: 76,
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
    bottom: 18,
    left: 18,
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
