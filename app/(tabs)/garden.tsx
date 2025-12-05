import React, { useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, PanResponder } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";

// Orb Component
const OrbParticles = ({ layers, interactionState }: { layers: string[], isAwakened: boolean, interactionState: any }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  
  // Create particles based on layers
  const { positions, colors, sizes } = useMemo(() => {
    const particleCount = 6000; // Increased for density
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    for (let i = 0; i < particleCount; i++) {
      const layerIndex = Math.floor(Math.random() * layers.length);
      const color = colorObjects[layerIndex] || new THREE.Color("#888");
      
      // Volumetric sphere distribution
      const r = 0.5 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = color.r + (Math.random() - 0.5) * 0.1; // Slight color variation
      colors[i * 3 + 1] = color.g + (Math.random() - 0.5) * 0.1;
      colors[i * 3 + 2] = color.b + (Math.random() - 0.5) * 0.1;
      
      sizes[i] = Math.random(); 
    }
    
    return { positions, colors, sizes };
  }, [layers]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScale: { value: 1.0 },
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { mode, spinVelocity } = interactionState.current;
    
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002 + spinVelocity;
      pointsRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
    }

    // Core pulsing
    if (glowRef.current) {
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.05;
      glowRef.current.scale.setScalar(pulse);
    }

    // Interaction scale
    let targetScale = 1.0;
    if (mode === 'gather') targetScale = 0.3;
    else if (mode === 'explode') targetScale = 2.2;
    
    uniforms.uScale.value = THREE.MathUtils.lerp(uniforms.uScale.value, targetScale, 0.1);
    uniforms.uTime.value = time;
  });

  return (
    <group>
      {/* Core Glow - Solid Center */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color={layers[layers.length - 1] || "#ffffff"}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Particles */}
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
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            attribute float size;
            varying vec3 vColor;
            uniform float uTime;
            uniform float uScale;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              vec3 n = normalize(pos); // Calculate normal for sphere
              
              // Organic noise movement
              float noise = sin(pos.x * 4.0 + uTime) * 0.05 + 
                           sin(pos.y * 4.0 + uTime) * 0.05 + 
                           sin(pos.z * 4.0 + uTime) * 0.05;
              
              pos += n * noise;
              pos *= uScale;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (150.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            void main() {
              vec2 xy = gl_PointCoord.xy - vec2(0.5);
              float r = length(xy);
              if (r > 0.5) discard;
              
              // Soft gradient glow
              float alpha = 1.0 - smoothstep(0.0, 0.5, r);
              alpha = pow(alpha, 1.5);
              
              gl_FragColor = vec4(vColor, alpha);
            }
          `}
        />
      </points>
    </group>
  );
};

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, devAddLayer, devInstantOrb, devResetOrb, devSendOrbToSelf } = useMeditation();
  const { walletAddress } = useUser();
  const interactionState = useRef({ mode: 'idle', spinVelocity: 0 });
  
  const DEV_WALLET_ADDRESS = "0xf683cbce6d42918907df66040015fcbdad411d9d";
  const isDev = walletAddress === DEV_WALLET_ADDRESS;
  const [showDevMenu, setShowDevMenu] = React.useState(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        interactionState.current.mode = 'gather';
      },
      onPanResponderMove: (_, gestureState) => {
        interactionState.current.spinVelocity = gestureState.vx * 0.05;
      },
      onPanResponderRelease: () => {
        interactionState.current.mode = 'explode';
        setTimeout(() => {
          interactionState.current.mode = 'idle';
          interactionState.current.spinVelocity = 0;
        }, 1000);
      },
    })
  ).current;

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
        
        <View style={styles.instructions}>
           <Text style={styles.instructionText}>
             {settings.language === 'zh' ? "長按聚集 • 放開綻放 • 拖動旋轉" : "Hold to Gather • Release to Bloom • Drag to Spin"}
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
