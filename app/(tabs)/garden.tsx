import React, { useRef, useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder, Dimensions, Platform } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sparkles, Float, Trail } from "@react-three/drei";
import * as THREE from "three";
import { useMeditation, CHAKRA_COLORS, Orb, ORB_STAGES } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Settings, RotateCcw, Plus, Zap, Star, Gift, Layers, Merge, Eye } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import Modal from "react-native-modal";
import { DeviceMotion } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";

// --- 3D Components ---

const SacredGeometry = ({ stage }: { stage: string }) => {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.rotation.y += delta * 0.3;
    }
  });

  const geometry = useMemo(() => {
    if (stage === 'eternal') return <icosahedronGeometry args={[0.4, 0]} />;
    if (stage === 'legendary') return <octahedronGeometry args={[0.4, 0]} />;
    return <dodecahedronGeometry args={[0.3, 0]} />;
  }, [stage]);

  return (
    <mesh ref={mesh}>
      {geometry}
      <meshStandardMaterial 
        color="#fff" 
        emissive="#fff"
        emissiveIntensity={2}
        wireframe={true}
      />
    </mesh>
  );
};

const InnerLayers = ({ layers }: { layers: string[] }) => {
    return (
        <group>
            {layers.map((color, i) => (
                <mesh key={i} scale={0.5 + (i * 0.08)}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial 
                        color={color} 
                        transparent 
                        opacity={0.15} 
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
};

const CrystalShell = ({ brightness = 1 }: { brightness?: number }) => {
    return (
        <mesh>
            <sphereGeometry args={[1.2, 64, 64]} />
            <meshPhysicalMaterial 
                transmission={1}
                thickness={3} // Refraction
                roughness={0}
                clearcoat={1}
                clearcoatRoughness={0}
                ior={1.5}
                color="#ffffff"
                attenuationColor="#ffffff"
                attenuationDistance={5}
                opacity={brightness}
                transparent
            />
        </mesh>
    );
};

const OrbStardust = ({ color, count = 100 }: { color: string, count?: number }) => {
    return (
        <Sparkles 
            count={count}
            scale={4}
            size={4}
            speed={0.4}
            opacity={0.5}
            color={color}
        />
    );
};

const ActiveOrb = ({ orb, interactionState }: { orb: Orb, interactionState: any }) => {
    const group = useRef<THREE.Group>(null!);
    
    useFrame((state, delta) => {
        if (!group.current) return;
        
        // Interaction Rotation
        const { spinVelocity, mode } = interactionState.current;
        group.current.rotation.y += 0.005 + spinVelocity;
        
        // Scale Pulse
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 1.5) * 0.02 + 1;
        
        let targetScale = pulse;
        if (mode === 'gather') targetScale = 0.8;
        if (mode === 'explode') targetScale = 1.4;
        
        group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <group ref={group}>
            <SacredGeometry stage={orb.stage} />
            <InnerLayers layers={orb.layers} />
            <CrystalShell brightness={orb.brightness} />
            {orb.layers.length > 0 && (
                 <OrbStardust color={orb.layers[orb.layers.length-1]} count={50 + (orb.minutes / 10)} />
            )}
            {orb.stage !== 'growing' && (
                <Sparkles count={50} scale={6} size={6} speed={0.2} color="#FFD700" /> // Gold sparkles for awakened+
            )}
        </group>
    );
};

const CollectionOrbDisplay = ({ orb, position, onClick, isSelected }: { orb: Orb, position: [number, number, number], onClick: () => void, isSelected: boolean }) => {
    const group = useRef<THREE.Group>(null!);
    
    useFrame((state) => {
        if(group.current) {
            group.current.rotation.y += 0.01;
            if (isSelected) {
                group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 5) * 0.1;
            }
        }
    });

    return (
        <group position={position} ref={group} onClick={onClick}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh scale={0.5}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshPhysicalMaterial 
                        color={orb.layers[orb.layers.length-1] || "#fff"}
                        transmission={0.6}
                        thickness={1}
                        roughness={0.2}
                    />
                </mesh>
                {isSelected && (
                    <mesh scale={0.6}>
                         <sphereGeometry args={[1, 32, 32]} />
                         <meshBasicMaterial color="#fff" wireframe transparent opacity={0.3} />
                    </mesh>
                )}
            </Float>
        </group>
    );
};

const GardenScene = ({ 
    activeOrb, 
    collection, 
    viewMode, 
    interactionState,
    selectedOrbs,
    toggleSelection
}: { 
    activeOrb: Orb, 
    collection: Orb[], 
    viewMode: 'active' | 'collection',
    interactionState: any,
    selectedOrbs: string[],
    toggleSelection: (id: string) => void
}) => {
    const { camera } = useThree();
    const [gyro, setGyro] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (Platform.OS !== 'web') {
             DeviceMotion.setUpdateInterval(50);
             const sub = DeviceMotion.addListener(data => {
                if (data.rotation) {
                    // Simple tilt effect
                    setGyro({ x: data.rotation.beta, y: data.rotation.gamma });
                }
             });
             return () => sub.remove();
        }
    }, []);

    useFrame(() => {
        // Gyro Camera movement
        if (viewMode === 'active') {
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, gyro.y * 2, 0.05);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, gyro.x * 2, 0.05);
            camera.lookAt(0, 0, 0);
        }
    });

    if (viewMode === 'collection') {
        return (
            <group>
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {collection.map((orb, index) => {
                    // Spiral layout
                    const angle = index * 0.8;
                    const radius = 2 + (index * 0.2);
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius - 5;
                    const y = Math.sin(index * 0.5) * 1;

                    return (
                        <CollectionOrbDisplay 
                            key={orb.id} 
                            orb={orb} 
                            position={[x, y, z]} 
                            onClick={() => toggleSelection(orb.id)}
                            isSelected={selectedOrbs.includes(orb.id)}
                        />
                    );
                })}
            </group>
        );
    }

    return (
        <group>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#fff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#4c1d95" />
            
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <ActiveOrb orb={activeOrb} interactionState={interactionState} />
            </Float>
            
            <Trail width={2} color={activeOrb.layers[activeOrb.layers.length-1] || "#fff"} length={5} attenuation={(t) => t * t}>
               {/* Trail effect logic would go here if attached to a moving object */}
            </Trail>
        </group>
    );
};


// --- Main Screen ---

export default function GardenScreen() {
    const { currentTheme, settings } = useSettings();
    const { currentOrb, sendOrb, orbHistory, synthesizeOrbs, updateOrbState, updateOrbHistory } = useMeditation();
    const { walletAddress } = useUser();
    
    const [viewMode, setViewMode] = useState<'active' | 'collection'>('active');
    const [selectedOrbs, setSelectedOrbs] = useState<string[]>([]);
    
    const [showDevMenu, setShowDevMenu] = useState(false);
    const interactionState = useRef({ mode: 'idle', spinVelocity: 0 });
    const longPressTimer = useRef<any>(undefined);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                interactionState.current.mode = 'gather';
                // Dev Menu Trigger
                longPressTimer.current = setTimeout(() => {
                    if (walletAddress === DEV_WALLET) {
                        setShowDevMenu(true);
                    }
                }, 5000);
            },
            onPanResponderMove: (_, gestureState) => {
                if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = undefined;
                    }
                }
                interactionState.current.spinVelocity = gestureState.vx * 0.1;
            },
            onPanResponderRelease: () => {
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = undefined;
                }
                interactionState.current.mode = 'explode';
                setTimeout(() => {
                    interactionState.current.mode = 'idle';
                    interactionState.current.spinVelocity = 0;
                }, 1000);
            },
        })
    ).current;

    const toggleSelection = (id: string) => {
        if (selectedOrbs.includes(id)) {
            setSelectedOrbs(selectedOrbs.filter(oid => oid !== id));
        } else {
            if (selectedOrbs.length < 2) {
                setSelectedOrbs([...selectedOrbs, id]);
            } else {
                // Replace the first one
                setSelectedOrbs([selectedOrbs[1], id]);
            }
        }
    };

    const handleSynthesize = async () => {
        if (selectedOrbs.length !== 2) return;
        
        Alert.alert(
            "Synthesize Orbs",
            "Merge these two souls into a higher form? (+40 min bonus)",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Merge", 
                    onPress: async () => {
                        await synthesizeOrbs(selectedOrbs[0], selectedOrbs[1]);
                        setSelectedOrbs([]);
                        Alert.alert("Synthesis Complete", "A new star is born.");
                    } 
                }
            ]
        );
    };

    const handleSendOrb = () => {
        if (currentOrb.stage === 'growing' && currentOrb.minutes < 10) {
             Alert.alert("Orb too weak", "Meditate at least 10 minutes to send.");
             return;
        }

        Alert.alert(
            "Send Orb",
            "Send this orb to a friend via World App?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send",
                    onPress: async () => {
                        // MiniKit Logic
                         if (MiniKit && MiniKit.isInstalled()) {
                           try {
                              await MiniKit.commands.transferNft({
                                collectionAddress: "0x1234567890123456789012345678901234567890", 
                                tokenId: "1", 
                                recipient: "0xFriendAddress", 
                              });
                           } catch (e) {
                             console.warn("MiniKit transfer failed/mocked", e);
                           }
                         }
                         await sendOrb("friend-id", "Sending love and light.");
                         Alert.alert("Sent!", "Your light has traveled.");
                    }
                }
            ]
        );
    };

    // Dev Actions
    const handleDevAction = async (action: string) => {
        setShowDevMenu(false);
        switch (action) {
            case "add_layer":
                const nextLevel = currentOrb.level + 1;
                const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
                await updateOrbState({
                    ...currentOrb,
                    level: nextLevel,
                    layers: [...currentOrb.layers, newLayer]
                });
                break;
            case "instant_awakened":
                await updateOrbState({
                    ...currentOrb,
                    stage: 'awakened',
                    minutes: ORB_STAGES.AWAKENED,
                    layers: CHAKRA_COLORS,
                    level: 7
                });
                break;
             case "instant_legendary":
                await updateOrbState({
                    ...currentOrb,
                    stage: 'legendary',
                    minutes: ORB_STAGES.LEGENDARY,
                    layers: CHAKRA_COLORS,
                    level: 7
                });
                break;
             case "instant_eternal":
                await updateOrbState({
                    ...currentOrb,
                    stage: 'eternal',
                    minutes: ORB_STAGES.ETERNAL,
                    layers: CHAKRA_COLORS,
                    level: 7
                });
                break;
             case "send_self":
                // Create a mock received orb
                 const mockOrb: Orb = {
                  ...currentOrb,
                  id: `orb-mock-${Date.now()}`,
                  sender: "Me (Dev)",
                  message: "From the void.",
                  createdAt: new Date().toISOString(),
                  isArchived: true,
                  minutes: 100,
                  stage: 'legendary',
                  brightness: 1,
                  level: 7,
                  layers: CHAKRA_COLORS
                };
                await updateOrbHistory([mockOrb, ...orbHistory]);
                break;
             case "reset":
                await updateOrbState({
                    ...currentOrb,
                    level: 0,
                    layers: [],
                    stage: 'growing',
                    minutes: 0,
                    createdAt: new Date().toISOString()
                });
                break;
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0f172a', '#1e1b4b', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            {/* 3D Scene */}
            <View style={styles.sceneContainer} {...panResponder.panHandlers}>
                 <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <GardenScene 
                        activeOrb={currentOrb} 
                        collection={orbHistory}
                        viewMode={viewMode}
                        interactionState={interactionState}
                        selectedOrbs={selectedOrbs}
                        toggleSelection={toggleSelection}
                    />
                 </Canvas>
            </View>

            {/* Overlay UI */}
            <View style={styles.overlay} pointerEvents="box-none">
                
                {/* Header */}
                <BlurView intensity={20} style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {viewMode === 'active' ? "Light Orb Garden" : "Collection"}
                    </Text>
                    {viewMode === 'active' && (
                        <Text style={styles.headerSubtitle}>
                             {currentOrb.minutes} mins • {currentOrb.stage.toUpperCase()}
                        </Text>
                    )}
                </BlurView>

                {/* Progress Rewards */}
                {viewMode === 'active' && (
                    <View style={styles.progressContainer}>
                         <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${Math.min(100, (currentOrb.minutes % 30) / 30 * 100)}%` }]} />
                         </View>
                         <Text style={styles.progressText}>
                             Next Reward: {30 - (currentOrb.minutes % 30)}m
                         </Text>
                    </View>
                )}

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setViewMode(viewMode === 'active' ? 'collection' : 'active')}>
                        {viewMode === 'active' ? <Layers color="#fff" size={24} /> : <Eye color="#fff" size={24} />}
                        <Text style={styles.iconLabel}>{viewMode === 'active' ? "Collection" : "View Orb"}</Text>
                    </TouchableOpacity>

                    {viewMode === 'active' ? (
                         <TouchableOpacity style={styles.mainButton} onPress={handleSendOrb}>
                            <Send color="#fff" size={24} />
                            <Text style={styles.mainButtonText}>Send Orb</Text>
                         </TouchableOpacity>
                    ) : (
                         <TouchableOpacity 
                            style={[styles.mainButton, selectedOrbs.length !== 2 && styles.disabledButton]} 
                            onPress={handleSynthesize}
                            disabled={selectedOrbs.length !== 2}
                         >
                            <Merge color="#fff" size={24} />
                            <Text style={styles.mainButtonText}>Synthesize ({selectedOrbs.length}/2)</Text>
                         </TouchableOpacity>
                    )}
                </View>

                {/* Interaction Hint */}
                 {viewMode === 'active' && (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintText}>Hold to Gather • Drag to Spin</Text>
                    </View>
                )}
            </View>

            {/* Dev Menu Modal */}
            <Modal
                isVisible={showDevMenu}
                onBackdropPress={() => setShowDevMenu(false)}
            >
                 <View style={styles.devMenu}>
                    <Text style={styles.devTitle}>Developer Override</Text>
                    <Text style={styles.devSubtitle}>{walletAddress}</Text>
                    
                    <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('add_layer')}>
                        <Plus size={20} color="#000" />
                        <Text>+1 Layer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_awakened')}>
                        <Zap size={20} color="#F59E0B" />
                        <Text>Instant Awakened (21m)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_legendary')}>
                        <Star size={20} color="#8B5CF6" />
                        <Text>Instant Legendary (49m)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_eternal')}>
                         <Star size={20} color="#EC4899" />
                        <Text>Instant Eternal (108m)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('send_self')}>
                        <Gift size={20} color="#000" />
                        <Text>Receive Mock Orb</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('reset')}>
                        <RotateCcw size={20} color="#000" />
                        <Text>Reset</Text>
                    </TouchableOpacity>
                 </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    sceneContainer: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 20,
    },
    header: {
        marginTop: 60,
        padding: 20,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 10,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 5,
        letterSpacing: 2,
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressBar: {
        width: 200,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
        shadowColor: '#fff',
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    progressText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginBottom: 40,
    },
    iconButton: {
        alignItems: 'center',
        padding: 10,
    },
    iconLabel: {
        color: '#fff',
        fontSize: 10,
        marginTop: 5,
    },
    mainButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 40,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    disabledButton: {
        opacity: 0.5,
    },
    mainButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    hintContainer: {
        position: 'absolute',
        bottom: 20,
        width: width,
        alignItems: 'center',
    },
    hintText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        letterSpacing: 1,
    },
    devMenu: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    devTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    devSubtitle: {
        fontSize: 10,
        color: '#666',
        marginBottom: 20,
        fontFamily: 'monospace',
    },
    devOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 10,
    },
});
