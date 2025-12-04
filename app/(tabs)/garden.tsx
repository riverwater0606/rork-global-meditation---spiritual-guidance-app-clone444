import React, { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated as RNAnimated, Alert, ScrollView } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Settings, RotateCcw, Plus, Zap, Star, Gift, Wind } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import Modal from "react-native-modal";
import { Gyroscope } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");
const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";

// --- Constants ---
const ORB_STAGES = {
  GROWING: 0,
  AWAKENED: 1, // 21 min/layers
  LEGENDARY: 2, // 49 min/layers
  ETERNAL: 3, // 108 min/layers
};

// --- 3D Components ---

// Starfield Background
const Starfield = () => {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // Depth
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
      ref.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="white" transparent opacity={0.6} sizeAttenuation={true} />
    </points>
  );
};

// Inner Geometry (Sacred Mandala)
const SacredGeometry = ({ visible }: { visible: boolean }) => {
  const ref = useRef<THREE.Group>(null!);
  
  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.rotation.z -= delta * 0.1;
        ref.current.rotation.x += delta * 0.05;
    }
  });

  if (!visible) return null;

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color="#FFD700" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
         <octahedronGeometry args={[0.8, 0]} />
         <meshBasicMaterial color="#FFFFFF" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// Main Crystal Orb
const CrystalOrb = ({ 
    layers, 
    stage, 
    onPointerDown, 
    onPointerUp,
    interactionState 
}: { 
    layers: string[], 
    stage: number, 
    onPointerDown: () => void,
    onPointerUp: () => void,
    interactionState: any
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  // Determine core color based on top layer
  const coreColor = layers.length > 0 ? layers[layers.length - 1] : "#FFFFFF";

  // Particles inside orb
  const particleData = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const colorObjs = layers.map(c => new THREE.Color(c));
    if (colorObjs.length === 0) colorObjs.push(new THREE.Color("#ffffff"));

    for(let i=0; i<count; i++) {
        const r = Math.random() * 0.9;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);

        const col = colorObjs[Math.floor(Math.random() * colorObjs.length)];
        cols[i*3] = col.r;
        cols[i*3+1] = col.g;
        cols[i*3+2] = col.b;
    }
    return { pos, cols };
  }, [layers]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Breathing/Pulse
    const pulse = Math.sin(time * 1.5) * 0.05 + 1;
    let targetScale = pulse;
    
    if (interactionState.current.mode === 'gather') {
        targetScale = 0.8;
    } else if (interactionState.current.mode === 'explode') {
        targetScale = 1.4;
    }

    if (meshRef.current) {
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        meshRef.current.rotation.y += 0.005 + interactionState.current.spinVelocity;
        
        // Decay spin
        interactionState.current.spinVelocity *= 0.95;
    }
    
    if (glowRef.current) {
        glowRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.2);
        glowRef.current.rotation.z -= 0.01;
    }

    if (particlesRef.current) {
        particlesRef.current.rotation.y -= 0.01;
        // Pulse particles
        if (interactionState.current.mode === 'gather') {
             particlesRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
        } else {
             particlesRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    }
  });

  return (
    <group 
      onPointerDown={onPointerDown} 
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp}
    >
        {/* Core Geometry - Only for awakened+ */}
        <SacredGeometry visible={stage >= ORB_STAGES.AWAKENED} />

        {/* Inner Particles */}
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[particleData.pos, 3]} />
                <bufferAttribute attach="attributes-color" args={[particleData.cols, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>

        {/* Glass Shell */}
        <mesh ref={meshRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshPhysicalMaterial 
                color={stage >= ORB_STAGES.LEGENDARY ? "#E0F7FA" : "#ffffff"}
                transmission={0.9} // Glass
                opacity={1}
                roughness={0.1}
                metalness={0.1}
                thickness={1.5} // Refraction
                clearcoat={1}
                clearcoatRoughness={0.1}
            />
        </mesh>

        {/* Outer Glow Halo */}
        <mesh ref={glowRef}>
            <sphereGeometry args={[1.1, 32, 32]} />
            <meshBasicMaterial 
                color={coreColor} 
                transparent 
                opacity={0.15} 
                side={THREE.BackSide} 
                blending={THREE.AdditiveBlending} 
            />
        </mesh>
    </group>
  );
};

// Gyro Controls
const GyroControls = () => {
    const { camera } = useThree();
    
    useEffect(() => {
        if (Platform.OS === 'web') return;

        const subscription = Gyroscope.addListener(({ x, y }) => {
            // Slight camera sway based on device tilt
            const targetX = y * 2; 
            const targetY = x * 2;
            
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (targetY - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);
        });
        
        Gyroscope.setUpdateInterval(50);

        return () => subscription.remove();
    }, [camera]);

    return null;
}

// 2D Web Fallback
const WebFallback = ({ layers }: { layers: string[] }) => {
    const pulseAnim = useRef(new RNAnimated.Value(1)).current;

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                RNAnimated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const topColor = layers.length > 0 ? layers[layers.length - 1] : "#FFFFFF";

    return (
        <View style={styles.webFallbackContainer}>
            <LinearGradient
                colors={['#000033', '#000011']}
                style={StyleSheet.absoluteFill}
            />
            <Text style={styles.webTitle}>光球花園</Text>
            <RNAnimated.View style={[styles.webOrb, { transform: [{ scale: pulseAnim }], backgroundColor: topColor, shadowColor: topColor }]}>
                 <View style={styles.webInnerOrb} />
            </RNAnimated.View>
            <Text style={styles.webSubtitle}>Web Version • {layers.length} Layers</Text>
        </View>
    )
}


export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, updateOrbState, updateOrbHistory } = useMeditation();
  const { walletAddress } = useUser();
  const interactionState = useRef({ mode: 'idle', spinVelocity: 0 });
  const [showDevMenu, setShowDevMenu] = useState(false);
  
  const lastTap = useRef(0);
  const handlePointerDown = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
        handleSendOrb();
    }
    lastTap.current = now;
    interactionState.current.mode = 'gather';
  };

  const handlePointerUp = () => {
    interactionState.current.mode = 'explode';
    setTimeout(() => {
        interactionState.current.mode = 'idle';
    }, 1000);
  };
  
  // Calculate Stage
  const getOrbStage = (orb: any) => {
      if (orb.layers.length >= 108) return ORB_STAGES.ETERNAL;
      if (orb.layers.length >= 49) return ORB_STAGES.LEGENDARY;
      if (orb.layers.length >= 21) return ORB_STAGES.AWAKENED;
      return ORB_STAGES.GROWING;
  };
  
  const stage = getOrbStage(currentOrb);

  // Dev Menu Gesture: Long press on orb area (native overlay for reliability)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
        if (walletAddress === DEV_WALLET) {
            setShowDevMenu(true);
        }
    }, 5000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Dev Actions
  const handleDevAction = async (action: string) => {
    setShowDevMenu(false);
    let updatedOrb = { ...currentOrb };
    
    switch (action) {
      case "add_layer":
        updatedOrb.layers.push(CHAKRA_COLORS[updatedOrb.layers.length % 7]);
        updatedOrb.level = updatedOrb.layers.length;
        break;
      case "instant_awakened":
        updatedOrb.layers = Array(21).fill(0).map((_, i) => CHAKRA_COLORS[i % 7]);
        updatedOrb.level = 21;
        updatedOrb.isAwakened = true;
        break;
      case "instant_legendary":
        updatedOrb.layers = Array(49).fill(0).map((_, i) => CHAKRA_COLORS[i % 7]);
        updatedOrb.level = 49;
        updatedOrb.isAwakened = true;
        break;
      case "instant_eternal":
        updatedOrb.layers = Array(108).fill(0).map((_, i) => CHAKRA_COLORS[i % 7]);
        updatedOrb.level = 108;
        updatedOrb.isAwakened = true;
        break;
      case "reset":
        updatedOrb = {
            id: `orb-${Date.now()}`,
            level: 0,
            layers: [],
            isAwakened: false,
            createdAt: new Date().toISOString(),
        };
        break;
       case "send_self":
         await updateOrbHistory([{
             id: `orb-mock-${Date.now()}`,
             sender: "Dev Self",
             message: "Debug Orb",
             layers: ["#FF0000", "#00FF00", "#0000FF"],
             createdAt: new Date().toISOString(),
             level: 3,
             isAwakened: false
         }, ...orbHistory]);
         return;
    }
    await updateOrbState(updatedOrb);
  };

  const handleSendOrb = async () => {
      if (currentOrb.layers.length < 1) {
          Alert.alert("Orb Empty", "Meditate to fill your orb with light first.");
          return;
      }
      
      Alert.alert(
        settings.language === 'zh' ? "贈送光球" : "Send Orb",
        settings.language === 'zh' ? "選擇一位好友" : "Choose a friend",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "World App Friends",
                onPress: async () => {
                    // MiniKit logic here
                     if (MiniKit.isInstalled()) {
                        // Mock transfer for now as we don't have real contract addresses set up in this context
                        // But we implement the flow
                         try {
                           const res = await MiniKit.commands.walletAuth({
                             nonce: "random-nonce",
                             requestId: "1",
                             expirationTime: new Date(Date.now() + 1000 * 60).toISOString(),
                             notBefore: new Date().toISOString(),
                           });
                           // In real app, we would use transferNFT command
                         } catch(e) {}
                     }
                     Alert.alert("Sent!", "Your orb has been sent.");
                     // Reset current orb but keep a seed
                     const seedLayers = currentOrb.layers.slice(0, Math.floor(currentOrb.layers.length * 0.7));
                     await updateOrbState({
                         ...currentOrb,
                         layers: seedLayers,
                         level: seedLayers.length,
                         id: `orb-${Date.now()}`
                     });
                }
            }
        ]
      );
  };


  if (Platform.OS === 'web') {
      return <WebFallback layers={currentOrb.layers} />;
  }


  const handleCollectionItemPress = (orb: any, index: number) => {
    Alert.alert(
      settings.language === 'zh' ? "融合光球" : "Merge Orb",
      settings.language === 'zh' ? "將此光球能量融入主光球？(+40分鐘修煉)" : "Absorb this orb into your main orb? (+40 min progress)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Merge",
          onPress: async () => {
             // Add layers from absorbed orb or just add count
             const newLayers = [...currentOrb.layers];
             // Add up to 3 layers from the absorbed orb
             for(let i=0; i<3; i++) {
                 if (orb.layers[i]) newLayers.push(orb.layers[i]);
                 else newLayers.push(CHAKRA_COLORS[newLayers.length % 7]);
             }
             
             const updatedOrb = {
                 ...currentOrb,
                 layers: newLayers,
                 level: newLayers.length,
                 isAwakened: newLayers.length >= 21
             };
             
             // Remove from history
             const newHistory = [...orbHistory];
             newHistory.splice(index, 1);
             
             await updateOrbState(updatedOrb);
             await updateOrbHistory(newHistory);
             
             Alert.alert("Merged!", "Energy absorbed.");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
            colors={['#000022', '#1a0b2e', '#000000']}
            style={StyleSheet.absoluteFill}
        />

        {/* 3D Scene */}
        <View 
            style={styles.scene}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1} color="#ffaa00" />
                <pointLight position={[-5, -5, -5]} intensity={1} color="#00aaff" />
                <Starfield />
                <CrystalOrb 
                    layers={currentOrb.layers} 
                    stage={stage}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    interactionState={interactionState}
                />
                <GyroControls />
            </Canvas>
        </View>

        {/* UI Overlays */}
        <View style={styles.header}>
            <BlurView intensity={20} tint="dark" style={styles.headerBlur}>
                 <Text style={styles.title}>
                    {settings.language === 'zh' ? "光球花園" : "Light Orb Garden"}
                 </Text>
                 <View style={styles.statsRow}>
                    <View style={styles.statTag}>
                        <View style={[styles.dot, { backgroundColor: currentOrb.layers[currentOrb.layers.length-1] || '#fff' }]} />
                        <Text style={styles.statText}>
                            {currentOrb.layers.length} Layers
                        </Text>
                    </View>
                    {stage >= ORB_STAGES.AWAKENED && (
                        <View style={[styles.statTag, { backgroundColor: '#FFD70020' }]}>
                            <Star size={12} color="#FFD700" />
                            <Text style={[styles.statText, { color: '#FFD700' }]}>Awakened</Text>
                        </View>
                    )}
                 </View>
            </BlurView>
        </View>

        <View style={styles.footer}>
             <TouchableOpacity style={styles.sendButton} onPress={handleSendOrb}>
                <Gift color="#fff" size={24} />
                <Text style={styles.sendButtonText}>
                    {settings.language === 'zh' ? "贈送" : "Send"}
                </Text>
             </TouchableOpacity>

             <ScrollView horizontal style={styles.collectionList} showsHorizontalScrollIndicator={false}>
                {orbHistory.map((orb, i) => (
                    <TouchableOpacity key={i} style={styles.collectionItem} onPress={() => handleCollectionItemPress(orb, i)}>
                        <View style={[styles.miniOrb, { backgroundColor: orb.layers[orb.layers.length-1] || '#fff' }]} />
                    </TouchableOpacity>
                ))}
             </ScrollView>
        </View>

        {/* Dev Menu Modal */}
        <Modal isVisible={showDevMenu} onBackdropPress={() => setShowDevMenu(false)}>
            <View style={styles.devMenu}>
                <Text style={styles.devTitle}>Developer Menu</Text>
                <Text style={styles.devSubtitle}>{walletAddress}</Text>
                
                <TouchableOpacity style={styles.devBtn} onPress={() => handleDevAction('add_layer')}>
                    <Text>+1 Layer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devBtn} onPress={() => handleDevAction('instant_awakened')}>
                    <Text>Instant Awakened (21)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devBtn} onPress={() => handleDevAction('instant_legendary')}>
                    <Text>Instant Legendary (49)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devBtn} onPress={() => handleDevAction('instant_eternal')}>
                    <Text>Instant Eternal (108)</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.devBtn} onPress={() => handleDevAction('send_self')}>
                    <Text>Send Self Mock</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.devBtn, { backgroundColor: '#ffcccc' }]} onPress={() => handleDevAction('reset')}>
                    <Text style={{ color: 'red' }}>Reset Orb</Text>
                </TouchableOpacity>
            </View>
        </Modal>

        {/* Instructions Hint */}
        <View style={styles.hintContainer}>
             <Text style={styles.hintText}>
                {settings.language === 'zh' ? "長按聚氣 • 放開綻放" : "Hold to Gather • Release to Bloom"}
             </Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scene: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerBlur: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 10,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  sendButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  collectionList: {
    flex: 1,
  },
  collectionItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniOrb: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  devMenu: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
  },
  devTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  devSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  devBtn: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hintContainer: {
      position: 'absolute',
      bottom: 120,
      width: '100%',
      alignItems: 'center',
      pointerEvents: 'none',
  },
  hintText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
      letterSpacing: 1,
  },
  // Web Fallback
  webFallbackContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000033',
  },
  webTitle: {
      color: '#fff',
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 40,
      textShadowColor: 'rgba(0,100,255,0.5)',
      textShadowRadius: 20,
  },
  webOrb: {
      width: 200,
      height: 200,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 40,
      elevation: 20,
  },
  webInnerOrb: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#fff',
      shadowOpacity: 0.5,
      shadowRadius: 20,
  },
  webSubtitle: {
      color: 'rgba(255,255,255,0.6)',
      marginTop: 40,
      fontSize: 14,
  },
});
