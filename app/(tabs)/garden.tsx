import React, { useRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Settings, RotateCcw, Plus, Zap, Star, Gift } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import Modal from "react-native-modal";

const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";

// Orb Component
const OrbParticles = ({ layers, interactionState }: { layers: string[], isAwakened: boolean, interactionState: any }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Create particles based on layers
  const { positions, colors } = useMemo(() => {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    for (let i = 0; i < particleCount; i++) {
      const layerIndex = Math.floor(Math.random() * layers.length);
      const color = colorObjects[layerIndex] || new THREE.Color("#888");
      
      const minR = 0.5 + (layerIndex * 0.2);
      const maxR = 0.7 + (layerIndex * 0.2);
      const r = minR + Math.random() * (maxR - minR);
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [layers]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const { mode, spinVelocity } = interactionState.current;
    
    pointsRef.current.rotation.y += 0.005 + spinVelocity;
    pointsRef.current.rotation.z += 0.002;

    const pulse = Math.sin(time * 2) * 0.05 + 1;
    
    let scale = pulse;
    if (mode === 'gather') {
      scale = 0.5;
    } else if (mode === 'explode') {
      scale = 2.0;
    }
    
    pointsRef.current.scale.setScalar(THREE.MathUtils.lerp(pointsRef.current.scale.x, scale, 0.1));
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, updateOrbState, updateOrbHistory } = useMeditation();
  const { walletAddress } = useUser();
  const interactionState = useRef({ mode: 'idle', spinVelocity: 0 });
  const [showDevMenu, setShowDevMenu] = useState(false);
  const longPressTimer = useRef<any>(undefined);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        interactionState.current.mode = 'gather';
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
        interactionState.current.spinVelocity = gestureState.vx * 0.05;
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

  const handleDevAction = async (action: string) => {
    setShowDevMenu(false);
    
    switch (action) {
      case "add_layer": {
        const nextLevel = currentOrb.level + 1;
        const newLayer = CHAKRA_COLORS[currentOrb.level % 7];
        const updatedOrb = {
          ...currentOrb,
          level: nextLevel,
          layers: [...currentOrb.layers, newLayer],
          isAwakened: nextLevel >= 7
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "instant_awakened": {
        const updatedOrb = {
          ...currentOrb,
          level: 7,
          layers: CHAKRA_COLORS,
          isAwakened: true,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "instant_legendary": {
        const updatedOrb = {
          ...currentOrb,
          level: 7,
          layers: CHAKRA_COLORS,
          isAwakened: true,
          createdAt: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString()
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "instant_eternal": {
        const updatedOrb = {
          ...currentOrb,
          level: 7,
          layers: CHAKRA_COLORS,
          isAwakened: true,
          createdAt: new Date(Date.now() - 108 * 24 * 60 * 60 * 1000).toISOString()
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "send_self": {
        const mockOrb = {
          ...currentOrb,
          id: `orb-mock-${Date.now()}`,
          sender: "Me (Dev)",
          message: "From the void.",
          createdAt: new Date().toISOString()
        };
        await updateOrbHistory([mockOrb, ...orbHistory]);
        break;
      }
      case "reset": {
        const newOrb = {
          id: `orb-${Date.now()}`,
          level: 0,
          layers: [],
          isAwakened: false,
          createdAt: new Date().toISOString(),
        };
        await updateOrbState(newOrb);
        break;
      }
    }
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
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {settings.language === 'zh' ? "光球花園" : "Light Orb Garden"}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
           {currentOrb.layers.length}/7 Layers • {currentOrb.isAwakened ? "Awakened" : "Growing"}
        </Text>
      </View>

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
        
        <View style={styles.instructions}>
           <Text style={styles.instructionText}>
             {settings.language === 'zh' ? "長按聚集 • 放開綻放 • 拖動旋轉" : "Hold to Gather • Release to Bloom • Drag to Spin"}
           </Text>
        </View>
      </View>

      <Modal
        isVisible={showDevMenu}
        onBackdropPress={() => setShowDevMenu(false)}
        onBackButtonPress={() => setShowDevMenu(false)}
        backdropOpacity={0.8}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={[styles.devMenu, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.devTitle, { color: currentTheme.text }]}>Dev Menu</Text>
          <Text style={[styles.devSubtitle, { color: currentTheme.textSecondary }]}>{walletAddress?.slice(0, 10)}...</Text>
          
          <ScrollView style={{ maxHeight: 400 }}>
            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('add_layer')}>
              <Plus size={20} color={currentTheme.text} />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: +1 layer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_awakened')}>
              <Zap size={20} color="#F59E0B" />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: Instant Awakened (21d)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_legendary')}>
              <Star size={20} color="#8B5CF6" />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: Instant Legendary (49d)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_eternal')}>
              <Star size={20} color="#EC4899" />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: Instant Eternal (108d)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('send_self')}>
              <Gift size={20} color={currentTheme.text} />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: Send orb to myself</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('reset')}>
              <RotateCcw size={20} color={currentTheme.text} />
              <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Dev: Reset orb</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={[styles.button, { marginTop: 20, backgroundColor: currentTheme.primary }]} onPress={() => setShowDevMenu(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  devMenu: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  devTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  devSubtitle: {
    fontSize: 12,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  devOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    gap: 10,
  },
  devOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
