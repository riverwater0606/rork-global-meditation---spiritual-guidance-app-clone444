import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Clock, Zap, Archive, ArrowUp, ArrowDown } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

// Minimal Progress Component (Top Right)
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

  const timeLeftSeconds = Math.ceil((1 - progress) * (duration / 1000));
  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
  
  return (
    <View style={styles.minimalProgressContainer}>
      <BlurView intensity={20} tint="dark" style={styles.minimalGlass}>
        <View style={styles.minimalRow}>
          <Clock size={12} color={theme.primary} />
          <Text style={styles.minimalText}>{timeString}</Text>
        </View>
        <View style={styles.minimalBarBg}>
          <View style={[styles.minimalBarFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        </View>
      </BlurView>
    </View>
  );
});
MinimalProgress.displayName = "MinimalProgress";

// Orb Component with Heart & Store Animations
const OrbParticles = ({ layers, interactionState }: { layers: string[], interactionState: any }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Pre-calculate positions
  const { positions, colors, heartPositions } = useMemo(() => {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const heartPositions = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    for (let i = 0; i < particleCount; i++) {
      // Sphere Positions
      const layerIndex = Math.floor(Math.random() * layers.length);
      const color = colorObjects[layerIndex] || new THREE.Color("#888");
      
      const r = 1.0 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Heart Positions (Parametric Heart)
      // x = 16sin^3(t)
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      // We need to map 't' (0 to 2PI) and maybe add some volume (z)
      
      const t = Math.random() * Math.PI * 2;
      // Add some random variation for volume
      const v = (Math.random() - 0.5) * 0.5; 
      
      // Scale down by 0.1 to fit in view
      const scale = 0.08;
      
      const hx = (16 * Math.pow(Math.sin(t), 3)) * scale;
      const hy = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
      const hz = v; // Simple thickness
      
      // Randomize inside the volume slightly
      heartPositions[i * 3] = hx + (Math.random() - 0.5) * 0.1;
      heartPositions[i * 3 + 1] = hy + (Math.random() - 0.5) * 0.1;
      heartPositions[i * 3 + 2] = hz + (Math.random() - 0.5) * 0.5;
    }
    
    return { positions, colors, heartPositions };
  }, [layers]);

  // Use a buffer attribute for current positions to interpolate
  const currentPositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const { mode, spinVelocity, progress } = interactionState.current;
    
    // Rotation
    let rotationSpeed = 0.002 + spinVelocity;
    if (mode === 'gather') rotationSpeed = 0.01 + (progress * 0.05);
    
    pointsRef.current.rotation.y += rotationSpeed;
    
    // Access geometry attributes
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    
    // Animation Logic
    // We update vertex positions directly for morphing
    
    for (let i = 0; i < 3000; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      
      let tx = positions[ix];
      let ty = positions[iy];
      let tz = positions[iz];
      
      // Modifiers based on mode
      if (mode === 'gather') {
        // Shrink towards center
        const shrink = Math.max(0.3, 1.0 - (progress * 0.7));
        tx *= shrink;
        ty *= shrink;
        tz *= shrink;
        
        // Add some jitter/vibration
        const jitter = 0.02 * progress;
        tx += (Math.random() - 0.5) * jitter;
        ty += (Math.random() - 0.5) * jitter;
        tz += (Math.random() - 0.5) * jitter;
      } 
      else if (mode === 'heart') {
        // Morph to heart positions
        tx = heartPositions[ix];
        ty = heartPositions[iy] + 0.5; // Move up slightly
        tz = heartPositions[iz];
      }
      else if (mode === 'store') {
        // Move downwards and shrink
        tx *= 0.1;
        ty = ty * 0.1 - 2.0; // Move down
        tz *= 0.1;
      }
      else if (mode === 'explode') {
         tx *= 2.5;
         ty *= 2.5;
         tz *= 2.5;
      }
      
      // Linear interpolation (Lerp) for smooth transition
      const lerpFactor = 0.1;
      
      currentPositions[ix] += (tx - currentPositions[ix]) * lerpFactor;
      currentPositions[iy] += (ty - currentPositions[iy]) * lerpFactor;
      currentPositions[iz] += (tz - currentPositions[iz]) * lerpFactor;
    }
    
    // Update geometry
    positionAttribute.array.set(currentPositions);
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]} // Initialize with copied positions
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
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
    devSendOrbToSelf 
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
  
  // Pan Responder for Gestures
  const panResponder = useRef(
    PanResponder.create({
      // Critical for responsiveness:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        startGathering();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Spin interaction
        interactionState.current.spinVelocity = gestureState.vx * 0.05;
        
        // Swipe Detection (only if gathering or idle)
        const { dy } = gestureState;
        
        if (interactionState.current.mode === 'gather' || interactionState.current.mode === 'idle') {
           if (dy < -120) { // Swipe UP
             triggerHeartAnimation();
           } else if (dy > 120) { // Swipe DOWN
             triggerStoreAnimation();
           }
        }
      },
      
      onPanResponderRelease: () => {
        stopGathering();
      },
      
      onPanResponderTerminate: () => {
        stopGathering();
      },
      
      onPanResponderTerminationRequest: () => false, // Don't let others steal
    })
  ).current;

  const startGathering = () => {
    // Don't restart if already doing something special
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'store') return;

    interactionState.current.mode = 'gather';
    
    // Timer logic
    const startTime = Date.now();
    // We assume reset on new press for simplicity, or we could resume if we stored progress
    // For "daily cultivation", maybe we should resume? 
    // But user said "daily once, 7 mins". 
    // Let's stick to simple session logic.
    
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(() => {
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
    if (interactionState.current.mode === 'heart' || interactionState.current.mode === 'store' || interactionState.current.mode === 'explode') return;

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

  const triggerStoreAnimation = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (progressOverlayRef.current) progressOverlayRef.current.reset();
    
    interactionState.current.mode = 'store';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(async () => {
       await storeOrb();
       Alert.alert("Stored", "Orb saved to your garden collection.");
       interactionState.current.mode = 'idle';
    }, 1500);
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

  const handleSwapOrb = async (orb: any) => {
    Alert.alert(
      settings.language === 'zh' ? "裝備光球" : "Equip Orb",
      settings.language === 'zh' ? "要切換到這個光球嗎？" : "Switch to this orb?",
      [
        { text: "Cancel", style: "cancel" },
        {
           text: "Confirm",
           onPress: async () => {
             await swapOrb(orb.id);
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
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
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
           {currentOrb.layers.length}/7 Layers • {currentOrb.isAwakened ? "Awakened" : "Growing"}
        </Text>
      </View>

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

      {/* Main Interaction Area */}
      <View style={styles.sceneContainer} {...panResponder.panHandlers}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbParticles 
            layers={currentOrb.layers} 
            interactionState={interactionState}
          />
        </Canvas>
        
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
                 // Changed from "Gather Energy" to clarify it's once a day
               }
             </Text>
          </View>
      </View>

      {/* Collection List */}
      <View style={styles.gardenListContainer}>
        <View style={styles.collectionHeader}>
          <Archive size={18} color={currentTheme.text} />
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {settings.language === 'zh' ? "花園收藏" : "Garden Collection"}
          </Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gardenList}>
           {orbHistory.length === 0 ? (
             <Text style={{ color: currentTheme.textSecondary, padding: 20 }}>
               {settings.language === 'zh' ? "暫無收藏" : "Empty collection"}
             </Text>
           ) : (
             orbHistory.map((orb, index) => (
               <TouchableOpacity 
                  key={orb.id || index} 
                  style={[styles.orbCard, { backgroundColor: currentTheme.surface }]}
                  onPress={() => handleSwapOrb(orb)}
               >
                 <View style={styles.orbPreview}>
                    {/* Simple CSS orb representation */}
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
                   {orb.sender || (settings.language === 'zh' ? "我自己" : "Me")}
                 </Text>
               </TouchableOpacity>
             ))
           )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)', // Very subtle bg
    marginHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  minimalProgressContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 20,
  },
  minimalGlass: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
    gap: 6,
  },
  minimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minimalText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  minimalBarBg: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  minimalBarFill: {
    height: '100%',
    borderRadius: 1.5,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gardenListContainer: {
    height: 160,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  orbSender: {
    fontSize: 11,
    fontWeight: 'bold',
    maxWidth: '100%',
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
});
