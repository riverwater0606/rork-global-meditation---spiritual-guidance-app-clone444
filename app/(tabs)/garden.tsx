/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Modal, Dimensions, Animated, Easing, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, OrbShape, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { fetchAndConsumeGifts, uploadGiftOrb } from "@/lib/firebaseGifts";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { generateMerkabaData, generateEarthData, generateFlowerOfLifeData, PARTICLE_COUNT } from "@/constants/sacredGeometry";
import { Clock, Zap, Archive, ArrowUp, ArrowDown, Sparkles, X, Sprout } from "lucide-react-native";
import { MiniKit, ResponseEvent } from "@/constants/minikit";
import * as Haptics from "expo-haptics";

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

    // 2. Star of David (Interlocking Triangles) with Light Beams
    const generateStarOfDavid = () => {
       // Two large triangles
       // T1: Pointing Up. T2: Pointing Down.
       const size = 1.2;
       
       for(let i=0; i<particleCount; i++) {
         const isUp = i % 2 === 0;
         // Triangle parametric eq
         // 3 edges.
         const edge = Math.floor(Math.random() * 3);
         const t = Math.random(); // Position on edge
         
         let p1, p2, p3;
         if (isUp) {
            // Angles: 90, 210, 330
            p1 = {x:0, y:size};
            p2 = {x:size*Math.cos(210*Math.PI/180), y:size*Math.sin(210*Math.PI/180)};
            p3 = {x:size*Math.cos(330*Math.PI/180), y:size*Math.sin(330*Math.PI/180)};
         } else {
            // Angles: 30, 150, 270
            p1 = {x:0, y:-size};
            p2 = {x:size*Math.cos(30*Math.PI/180), y:size*Math.sin(30*Math.PI/180)};
            p3 = {x:size*Math.cos(150*Math.PI/180), y:size*Math.sin(150*Math.PI/180)};
         }
         
         let A, B;
         if (edge === 0) { A=p1; B=p2; }
         else if (edge === 1) { A=p2; B=p3; }
         else { A=p3; B=p1; }
         
         // Point on edge
         let px = A.x + (B.x - A.x) * t;
         let py = A.y + (B.y - A.y) * t;
         
         // Add "Beams" effect (particles radiating out or concentrating on lines)
         // We make the lines thick and glowing
         const scatter = (Math.random() - 0.5) * 0.05;
         
         // Z depth to interlock
         const z = isUp ? 0.05 : -0.05;
         
         targetPositions[i*3] = px + scatter;
         targetPositions[i*3+1] = py + scatter;
         targetPositions[i*3+2] = z + (Math.random()-0.5)*0.02;

         // Cyan/Blue colors
         colors[i*3] = 0.0;
         colors[i*3+1] = 0.8 + Math.random()*0.2;
         colors[i*3+2] = 1.0;
       }
    };

    // 3. Merkaba (Star Tetrahedron)
    const generateMerkaba = () => {
      const data = generateMerkabaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 4. Mudra (Prayer Hands) - REMOVED

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
    else if (shape === 'star-of-david') generateStarOfDavid();
    else if (shape === 'merkaba') generateMerkaba();
    else if (shape === 'earth') generateEarth();
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
      if (shape === 'flower-of-life') {
         const g = groups[i];
         // Gentle pulse for all particles
         const pulse = 1.0 + Math.sin(t * 2) * 0.03;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
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
      } else if (shape === 'earth') {
          // Earth Animation: 
          // 1. Slow rotation of the "texture" (points) relative to the frame?
          // No, we rotate the whole group in the standard rotation logic below.
          // But user asked for "Unlock rotation... let user control".
          // And also "90s slow rotation".
          
          // If we want the particles to move *on* the sphere while the sphere is static?
          // No, usually we rotate the sphere container.
          
          // Let's handle Earth rotation in the main rotation logic (outside loop)
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
  { id: 'flower-of-life', name: 'Flower of Life', nameZh: '生命之花', icon: '🌸' },
  { id: 'star-of-david', name: 'Star of David', nameZh: '六芒星', icon: '✡️' },
  { id: 'merkaba', name: 'Merkaba', nameZh: '梅爾卡巴', icon: '⬡' },
  { id: 'earth', name: 'Earth', nameZh: '地球', icon: '🌍' },
];

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const insets = useSafeAreaInsets();
  
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
        } catch (e) {
          console.warn("[DEBUG_GIFT] Failed to unload gift sound:", e);
        }
      };

      void cleanup();
    };
  }, []);
  
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

  const interactionState = useRef({ mode: 'idle', spinVelocity: 0, progress: 0 });
  const progressOverlayRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const GATHER_DURATION = 7 * 60 * 1000; 
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const orbShape = currentOrb.shape || 'default';

  // Toggle Diffuse
  const toggleDiffuse = () => {
     const nextMode = interactionState.current.mode === 'diffused' ? 'idle' : 'diffused';
     interactionState.current.mode = nextMode;
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
                  <Text style={styles.shapeIcon}>{s.icon}</Text>
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
});
