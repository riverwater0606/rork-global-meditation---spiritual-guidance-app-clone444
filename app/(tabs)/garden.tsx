import React, { useRef, useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Dimensions } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Clock, Zap } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import { BlurView } from "expo-blur";

// Orb Component
const OrbParticles = ({ layers, interactionState }: { layers: string[], isAwakened: boolean, interactionState: any }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Create particles based on layers
  const { positions, colors, randoms } = useMemo(() => {
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    for (let i = 0; i < particleCount; i++) {
      const layerIndex = Math.floor(Math.random() * layers.length);
      const color = colorObjects[layerIndex] || new THREE.Color("#888");
      
      // Initial distribution - sphere with some randomness
      const r = 1.0 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      randoms[i * 3] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();
    }
    
    return { positions, colors, randoms };
  }, [layers]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const { mode, spinVelocity, progress } = interactionState.current;
    
    // Rotation logic
    let rotationSpeed = 0.002 + spinVelocity;
    if (mode === 'gather') {
       rotationSpeed = 0.01 + (progress * 0.05); // Spin faster as we gather
    }
    
    pointsRef.current.rotation.y += rotationSpeed;
    pointsRef.current.rotation.z += 0.001;

    // Pulse effect
    const pulse = Math.sin(time * 2) * 0.05 + 1;
    
    // Scale logic for "Gathering"
    let targetScale = pulse;
    
    if (mode === 'gather') {
      // Shrink to core as progress increases (1.0 -> 0.3)
      targetScale = 1.2 - (progress * 0.9);
      if (targetScale < 0.3) targetScale = 0.3;
    } else if (mode === 'explode') {
      targetScale = 2.5;
    } else {
      // Idle
      targetScale = 1.0;
    }
    
    // Smooth lerp
    const lerpFactor = mode === 'gather' ? 0.05 : 0.1;
    pointsRef.current.scale.setScalar(THREE.MathUtils.lerp(pointsRef.current.scale.x, targetScale, lerpFactor));
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
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
      />
    </points>
  );
};

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { 
    currentOrb, 
    sendOrb, 
    orbHistory, 
    hasMeditatedToday,
    cultivateDailyOrb,
    devAddLayer, 
    devInstantOrb, 
    devResetOrb, 
    devSendOrbToSelf 
  } = useMeditation();
  
  const { walletAddress } = useUser();
  
  // Interaction State
  const interactionState = useRef({ mode: 'idle', spinVelocity: 0, progress: 0 });
  const [gatheringProgress, setGatheringProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const GATHER_DURATION = 10000; // 10 seconds to cultivate
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = React.useState(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startGathering();
      },
      onPanResponderMove: (_, gestureState) => {
        interactionState.current.spinVelocity = gestureState.vx * 0.05;
      },
      onPanResponderRelease: () => {
        stopGathering();
      },
      onPanResponderTerminate: () => {
        stopGathering();
      }
    })
  ).current;

  const startGathering = () => {
    interactionState.current.mode = 'gather';
    
    const startTime = Date.now();
    const startProgress = interactionState.current.progress; // usually 0 unless paused? Assume reset.
    
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / GATHER_DURATION, 1.0);
      
      interactionState.current.progress = newProgress;
      setGatheringProgress(newProgress);
      
      if (newProgress >= 1.0) {
         // Success!
         triggerCultivation();
      }
    }, 16); // 60fps update
  };

  const stopGathering = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    // If we didn't finish, reset
    if (interactionState.current.progress < 1.0) {
      interactionState.current.mode = 'idle';
      interactionState.current.progress = 0;
      setGatheringProgress(0);
    }
  };

  const triggerCultivation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    interactionState.current.mode = 'explode';
    interactionState.current.progress = 0;
    setGatheringProgress(0);
    
    // Trigger logic
    if (!hasMeditatedToday && !currentOrb.isAwakened) {
       cultivateDailyOrb();
       Alert.alert("Energy Gathered", "Your orb has absorbed today's light.");
    } else if (hasMeditatedToday) {
       // Just visual pleasure
    }
    
    setTimeout(() => {
      interactionState.current.mode = 'idle';
    }, 2000);
  };

  const handleSendOrb = async () => {
    if (!currentOrb.isAwakened && currentOrb.level < 1) {
      Alert.alert("Orb too weak", "Meditate more to grow your orb before sending.");
      return;
    }

    Alert.alert(
      "Send Orb",
      "Choose a friend to send this energy to.",
      [
        { text: "Cancel", style: "cancel" },
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
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {showDevMenu && (
        <View style={styles.devMenuOverlay}>
          <View style={[styles.devMenu, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.devMenuTitle, { color: currentTheme.text }]}>Dev Tools</Text>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devAddLayer(); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: +1 layer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devInstantOrb(21); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: Instant Awakened Orb (21 days)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devInstantOrb(49); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: Instant Legendary Orb (49 days)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devInstantOrb(108); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: Instant Eternal Orb (108 days)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devSendOrbToSelf(); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: Send orb to myself</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.devMenuItem} onPress={() => { devResetOrb(); setShowDevMenu(false); }}>
              <Text style={{ color: currentTheme.text }}>Dev: Reset orb</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.devMenuItem, { borderTopWidth: 1, borderColor: '#ccc' }]} onPress={() => setShowDevMenu(false)}>
              <Text style={{ color: 'red' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sceneContainer} {...panResponder.panHandlers}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbParticles 
            layers={currentOrb.layers} 
            isAwakened={currentOrb.isAwakened}
            interactionState={interactionState}
          />
        </Canvas>
        
        {/* Gathering Progress UI */}
        {gatheringProgress > 0 && (
          <View style={styles.progressContainer}>
             <Text style={styles.progressText}>
               {Math.floor(gatheringProgress * 100)}%
             </Text>
             <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: `${gatheringProgress * 100}%`, backgroundColor: currentTheme.primary }]} />
             </View>
          </View>
        )}
        
        <View style={styles.instructions}>
           <Text style={styles.instructionText}>
             {settings.language === 'zh' ? "長按聚集 • 放開綻放 • 拖動旋轉" : "Hold to Gather • Release to Bloom • Drag to Spin"}
           </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
          <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
             <Clock size={20} color={currentTheme.textSecondary} />
             <Text style={[styles.infoText, { color: currentTheme.text }]}>
               {currentOrb.isAwakened 
                 ? (settings.language === 'zh' ? "已覺醒" : "Awakened")
                 : (settings.language === 'zh' 
                     ? `${7 - currentOrb.layers.length} 天後覺醒`
                     : `${7 - currentOrb.layers.length} days to awaken`)
               }
             </Text>
          </View>
          
          <View style={[styles.infoCard, { backgroundColor: currentTheme.surface }]}>
             <Zap size={20} color={hasMeditatedToday ? currentTheme.primary : currentTheme.textSecondary} />
             <Text style={[styles.infoText, { color: currentTheme.text }]}>
               {hasMeditatedToday
                 ? (settings.language === 'zh' ? "今日能量已收集" : "Energy Collected")
                 : (settings.language === 'zh' ? "長按收集能量" : "Gather Energy")
               }
             </Text>
          </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentTheme.primary }]}
          onPress={handleSendOrb}
        >
          <Send color="white" size={20} />
          <Text style={styles.buttonText}>
            {settings.language === 'zh' ? "贈送光球" : "Send Orb"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gardenListContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
          {settings.language === 'zh' ? "花園收藏" : "Garden Collection"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gardenList}>
           {orbHistory.length === 0 ? (
             <Text style={{ color: currentTheme.textSecondary, padding: 20 }}>
               {settings.language === 'zh' ? "還沒有收到光球" : "No orbs collected yet"}
             </Text>
           ) : (
             orbHistory.map((orb, index) => (
               <View key={index} style={[styles.orbCard, { backgroundColor: currentTheme.surface }]}>
                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: orb.layers[orb.layers.length-1] || '#ccc', marginBottom: 8 }} />
                 <Text style={[styles.orbDate, { color: currentTheme.textSecondary }]}>
                   {new Date(orb.createdAt).toLocaleDateString()}
                 </Text>
                 <Text style={[styles.orbSender, { color: currentTheme.text }]}>
                   {orb.sender || "Me"}
                 </Text>
               </View>
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    margin: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: '40%',
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  progressText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressBarBg: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
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
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  controls: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  gardenListContainer: {
    height: 180,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
  },
  gardenList: {
    paddingHorizontal: 15,
  },
  orbCard: {
    width: 100,
    height: 120,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  orbDate: {
    fontSize: 10,
    marginBottom: 4,
  },
  orbSender: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  devButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  devButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  devMenuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
});
