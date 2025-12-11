import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Modal, Dimensions, Animated, Easing, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, OrbShape, Orb } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { generateMerkabaData, generateMudraData, generateEarthData, PARTICLE_COUNT } from "@/constants/sacredGeometry";
import { Clock, Zap, ArrowUp, ArrowDown, Sparkles, X } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import * as Haptics from "expo-haptics";
import { Orb3DPreview } from "@/components/Orb3DPreview";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


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

    // 1. Flower of Life (2D/3D extruded)
    // 19 overlapping circles in hexagonal grid
    const generateFlowerOfLife = () => {
      const circleRadius = 0.5;
      // Centers for 19 circles (Hexagonal packing)
      // Layer 0: (0,0)
      // Layer 1: 6 neighbors
      // Layer 2: 12 neighbors
      const centers: {x:number, y:number}[] = [{x:0,y:0}];
      
      // Ring 1
      for(let i=0; i<6; i++) {
        const angle = i * Math.PI / 3;
        centers.push({ x: Math.cos(angle)*circleRadius, y: Math.sin(angle)*circleRadius });
      }
      // Ring 2
      for(let i=0; i<6; i++) {
        const angle = i * Math.PI / 3;
        // Corner points
        centers.push({ x: 2*Math.cos(angle)*circleRadius, y: 2*Math.sin(angle)*circleRadius });
        // Mid points between corners
        const angleMid = angle + Math.PI/6;
        // distance for mid points in hex grid is sqrt(3)*R
        centers.push({ x: Math.sqrt(3)*Math.cos(angleMid)*circleRadius, y: Math.sqrt(3)*Math.sin(angleMid)*circleRadius });
      }

      for (let i = 0; i < particleCount; i++) {
        // Distribute particles among 19 circles
        const circleIdx = i % centers.length;
        const center = centers[circleIdx];
        const theta = Math.random() * Math.PI * 2;
        
        // Exact circle outline with slight glow/width
        const r = circleRadius * (0.98 + Math.random()*0.04); 
        
        targetPositions[i*3] = center.x + r * Math.cos(theta);
        targetPositions[i*3+1] = center.y + r * Math.sin(theta);
        targetPositions[i*3+2] = (Math.random() - 0.5) * 0.05; // Flat with slight depth
        
        // Color: Gold/Pink/Violet gradients
        colors[i*3] = 1.0;
        colors[i*3+1] = 0.5 + Math.random()*0.5;
        colors[i*3+2] = 0.5 + Math.random()*0.5;
      }
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

    // 4. Mudra (Prayer Hands)
    const generateMudra = () => {
       const data = generateMudraData();
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
    else if (shape === 'star-of-david') generateStarOfDavid();
    else if (shape === 'merkaba') generateMerkaba();
    else if (shape === 'mudra') generateMudra();
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
      if (shape === 'merkaba') {
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
      } else if (shape === 'mudra') {
         // Breathing Pulse
         const breath = Math.sin(t * 1.5); // ~4s period
         const s = 1 + breath * 0.02; 
         tx *= s; ty *= s; tz *= s;
         
         if (groups[i] === 1) { // Chakra
            // Stronger glow pulse
            const s2 = 1 + Math.sin(t * 4) * 0.15;
            tx *= s2; ty *= s2; tz *= s2;
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
         tx *= 2.0; ty *= 2.0; tz *= 2.0;
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

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const { 
    currentOrb, 
    sendOrb, 
    storeOrb,
    swapOrb,
    orbHistory, 
    hasGrownOrbToday,
    cultivateDailyOrb,
    devAddLayer, 
    devInstantOrb, 
    devResetOrb, 
    devSendOrbToSelf,
    setOrbShape,
    setSharedSpinVelocity 
  } = useMeditation();
  
  const { walletAddress } = useUser();
  
  // Interaction State
  const interactionState = useRef({ mode: 'idle', spinVelocity: 0, progress: 0 });
  const progressOverlayRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const GATHER_DURATION = 7 * 60 * 1000; 
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showShapeSelector, setShowShapeSelector] = useState(false);
  const orbShape = currentOrb.shape || 'default';

  const [sceneLayout, setSceneLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [flyingOrb, setFlyingOrb] = useState<{ orb: Orb, startX: number, startY: number } | null>(null);
  const flyAnim = useRef(new Animated.Value(0)).current;
  const mainOrbScale = useRef(new Animated.Value(1)).current;

  const handleSelectOrbFromBar = (orb: Orb, startX: number, startY: number) => {
    if (orb.id === currentOrb.id) return; 
    
    setFlyingOrb({ orb, startX, startY });
    flyAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(flyAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1)),
      }),
      Animated.timing(mainOrbScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(async () => {
      await swapOrb(orb.id);
      setFlyingOrb(null);
      Animated.timing(mainOrbScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };


  const shapes: Array<{ id: OrbShape, name: string, nameZh: string, icon: string }> = [
    { id: 'flower-of-life', name: 'Flower of Life', nameZh: '生命之花', icon: '🌸' },
    { id: 'star-of-david', name: 'Star of David', nameZh: '六芒星', icon: '✡️' },
    { id: 'merkaba', name: 'Merkaba', nameZh: '梅爾卡巴', icon: '⬡' },
    { id: 'mudra', name: 'Mudra', nameZh: '禪定手印', icon: '🙏' },
    { id: 'earth', name: 'Earth', nameZh: '地球', icon: '🌍' },
  ];
  
  // Pan Responder for Gestures
  const panResponder = useRef(
    PanResponder.create({
      // Critical for responsiveness:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      // Ensure we don't lose the gesture easily
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startGathering();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Spin interaction - Increased sensitivity and inverted for natural control
        // Dragging RIGHT (positive dx) should rotate Earth to show LEFT contents (Negative Y rotation)
        const newVelocity = -gestureState.vx * 0.5;
        interactionState.current.spinVelocity = newVelocity;
        setSharedSpinVelocity(newVelocity);
        
        // Swipe Detection
        // Use gestureState.dy (accumulated distance) and velocity
        const { dy, vy, dx } = gestureState;
        
        // Lower thresholds for better responsiveness
        const SWIPE_DISTANCE = 100; // Reduced from 150
        const VELOCITY_THRESHOLD = 0.5; // Reduced from 0.8
        
        if (interactionState.current.mode === 'gather' || interactionState.current.mode === 'idle') {
           if (Math.abs(dy) > Math.abs(dx) * 1.5) { // Prioritize vertical movement
             if (dy < -SWIPE_DISTANCE && vy < -VELOCITY_THRESHOLD) { // Swipe UP
               triggerHeartAnimation();
             } else if (dy > SWIPE_DISTANCE && vy > VELOCITY_THRESHOLD) { // Swipe DOWN
               triggerStoreAnimation();
             }
           }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
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
        stopGathering();
      },
    })
  ).current;

  const startGathering = () => {
    // Don't restart if already doing something special
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'store' || interactionState.current.mode === 'appear') return;

    interactionState.current.mode = 'gather';
    
    const startTime = Date.now();
    
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(() => {
      // If we are in gather mode, increase progress
      // But if we moved to 'heart' or 'store', this interval should have been cleared.
      // Double check mode here just in case
      if (interactionState.current.mode !== 'gather') {
        if (progressInterval.current) clearInterval(progressInterval.current);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / GATHER_DURATION, 1.0);
      
      interactionState.current.progress = newProgress;
      if (progressOverlayRef.current) {
        progressOverlayRef.current.update(newProgress);
      }
      
      if (newProgress >= 1.0) {
         triggerCultivation();
      }
    }, 16);
  };

  const stopGathering = () => {
    // If in special animation, don't stop
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'store' || interactionState.current.mode === 'explode' || interactionState.current.mode === 'appear') return;

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

  const triggerCultivation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    interactionState.current.mode = 'explode';
    interactionState.current.progress = 0;
    if (progressOverlayRef.current) progressOverlayRef.current.reset();
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (!hasGrownOrbToday && !currentOrb.isAwakened) {
       cultivateDailyOrb();
       Alert.alert("Energy Gathered", "Your orb has absorbed today's light.");
    }
    
    setTimeout(() => {
      interactionState.current.mode = 'idle';
    }, 2000);
  };

  const triggerHeartAnimation = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (progressOverlayRef.current) progressOverlayRef.current.reset();
    
    interactionState.current.mode = 'heart';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Wait for animation then trigger send
    setTimeout(() => {
       handleSendOrb();
       // Reset after action
       setTimeout(() => {
         interactionState.current.mode = 'idle';
       }, 1000);
    }, 1500);
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
       await storeOrb();
       interactionState.current.mode = 'idle'; 
    }, 2000);
  };

  const handleSendOrb = async () => {
    if (!currentOrb.isAwakened && currentOrb.level < 1 && currentOrb.layers.length === 0) {
      Alert.alert("Orb Empty", "Grow your orb before sending.");
      return;
    }

    Alert.alert(
      settings.language === 'zh' ? "贈送光球" : "Send Orb",
      settings.language === 'zh' ? "選擇一位朋友分享能量" : "Choose a friend to share energy with.",
      [
        { text: "Cancel", style: "cancel", onPress: () => interactionState.current.mode = 'idle' },
        {
          text: "Send via World App",
          onPress: async () => {
             if (MiniKit && MiniKit.isInstalled()) {
               try {
                  const res = await MiniKit.commands.transferNft({
                    collectionAddress: "0x1234567890123456789012345678901234567890", 
                    tokenId: "1", 
                    recipient: "0xFriendAddress", 
                  });
                  console.log(res);
               } catch (e) {
                 console.warn("MiniKit transfer failed/mocked", e);
               }
             }

             await sendOrb("friend-id", "May you be happy.");
             Alert.alert("Sent!", "Your light has been shared.");
          }
        }
      ]
    );
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

      {/* Main Interaction Area */}
      <View 
        style={styles.sceneContainer} 
        onLayout={(e) => {
          e.target.measure((x, y, width, height, pageX, pageY) => {
            setSceneLayout({ x: pageX, y: pageY, width, height });
          });
        }}
        {...panResponder.panHandlers}
      >

        <TouchableOpacity
          style={styles.shapeButton}
          onPress={() => setShowShapeSelector(true)}
          activeOpacity={0.7}
        >
          <Sparkles size={18} color="white" />
        </TouchableOpacity>

        {orbShape !== 'default' && (
          <TouchableOpacity
            style={[styles.shapeButton, { top: 70, backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={() => {
              setOrbShape('default');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <X size={18} color="white" />
          </TouchableOpacity>
        )}

        <Animated.View style={{ flex: 1, transform: [{ scale: mainOrbScale }] }}>
          <Canvas camera={{ position: [0, 0, 4] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbParticles 
              layers={currentOrb.layers} 
              interactionState={interactionState}
              shape={orbShape}
            />
          </Canvas>
        </Animated.View>

        
        {/* Minimal Progress UI */}
        <MinimalProgress 
          ref={progressOverlayRef} 
          theme={currentTheme} 
          duration={GATHER_DURATION} 
        />
        
        <View style={styles.instructions}>
           <View style={styles.instructionRow}>
              <ArrowUp size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.instructionText}>
                {settings.language === 'zh' ? "上滑贈送" : "Swipe Up to Send"}
              </Text>
           </View>
           <View style={styles.instructionRow}>
              <View style={styles.holdDot} />
              <Text style={styles.instructionText}>
                {settings.language === 'zh' ? "長按聚集" : "Hold to Gather"}
              </Text>
           </View>
           <View style={styles.instructionRow}>
              <ArrowDown size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.instructionText}>
                {settings.language === 'zh' ? "下滑收藏" : "Swipe Down to Store"}
              </Text>
           </View>
        </View>
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

      {/* Garden Collection Bar */}
      <View style={styles.gardenBarContainer}>
        <View style={styles.barBlur} />
        <Text style={styles.barTitle}>
          {settings.language === 'zh' ? "光球收藏" : "Orb Collection"}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.gardenBarContent}
        >
          {orbHistory.map((orb, index) => {
            const isSelected = currentOrb.id === orb.id;
            return (
              <TouchableOpacity
                key={orb.id || index}
                style={[
                  styles.miniOrbItem,
                  isSelected && styles.miniOrbSelected
                ]}
                onPress={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  handleSelectOrbFromBar(orb, pageX - 40, pageY - 40); 
                }}
                activeOpacity={0.7}
              >
                <View style={styles.miniOrbWrapper}>
                   <Orb3DPreview orb={orb} size={isSelected ? 100 : 80} />
                </View>
                {isSelected && <View style={styles.selectedRing} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Flying Orb Animation Layer */}
      {flyingOrb && (
        <Animated.View 
          style={[
            styles.flyingOrb,
            {
              left: flyAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [flyingOrb.startX, sceneLayout.x + sceneLayout.width / 2 - 100] 
              }),
              top: flyAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [flyingOrb.startY, sceneLayout.y + sceneLayout.height / 2 - 100]
              }),
              transform: [
                { scale: flyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }
              ],
              opacity: flyAnim.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0] })
            }
          ]}
          pointerEvents="none"
        >
           <Orb3DPreview orb={flyingOrb.orb} size={200} />
           <View style={styles.flyingTrail} />
        </Animated.View>
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
    marginBottom: 20, // Space for bottom bar
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
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
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
  gardenBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    zIndex: 20,
  },
  barBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  barTitle: {
    position: 'absolute',
    top: 15,
    left: 20,
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gardenBarContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 30, 
    gap: 16,
  },
  miniOrbItem: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  miniOrbSelected: {
    width: 100,
    height: 100,
  },
  miniOrbWrapper: {
    width: '100%',
    height: '100%',
  },
  selectedRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  flyingOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    zIndex: 1000,
  },
  flyingTrail: {
    position: 'absolute',
    top: 50, left: 50,
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#8b5cf6',
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
    zIndex: -1,
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
});
