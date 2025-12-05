import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Stars, Sparkles, OrbitControls } from '@react-three/drei';
import { useMeditation } from '@/providers/MeditationProvider';
import { useRouter } from 'expo-router';
import { X, Wand2, Share as ShareIcon, Download, Loader2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

// Constants
const FONT_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json';
const PARTICLE_COUNT = 3000;

function ParticleShape({ text, colors }: { text: string, colors: string[] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Create particle system
  const { positions, randomPositions, particleColors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const randPos = new Float32Array(PARTICLE_COUNT * 3);
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    
    const colorObjects = colors.map(c => new THREE.Color(c));
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random start positions (chaos)
      randPos[i * 3] = (Math.random() - 0.5) * 10;
      randPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      randPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Colors
      const color = colorObjects[Math.floor(Math.random() * colorObjects.length)];
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
      
      // Init positions
      pos[i * 3] = randPos[i * 3];
      pos[i * 3 + 1] = randPos[i * 3 + 1];
      pos[i * 3 + 2] = randPos[i * 3 + 2];
    }
    
    return { positions: pos, randomPositions: randPos, particleColors: cols };
  }, [colors]);

  // Extract vertices from Text3D geometry when it loads
  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      meshRef.current.geometry.computeBoundingBox();
      const geom = meshRef.current.geometry;
      // We need to sample points from the faces of the text geometry
      // A simple approximation is using the vertices, but text geometry has many vertices on curves and few on flats.
      // Better to just use vertices for now as "targets".
      // Since we have fixed particle count, we loop and assign target to a vertex index mod count.
      
      const count = geom.attributes.position.count;
      const targetPos = new Float32Array(PARTICLE_COUNT * 3);
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Randomly sample a vertex from the geometry
        const vIndex = Math.floor(Math.random() * count);
        targetPos[i * 3] = geom.attributes.position.array[vIndex * 3];
        targetPos[i * 3 + 1] = geom.attributes.position.array[vIndex * 3 + 1];
        targetPos[i * 3 + 2] = geom.attributes.position.array[vIndex * 3 + 2];
      }
      
      // Store targets in a custom attribute or just update logic
      // We'll update a ref for targets
      pointsRef.current.userData.targets = targetPos;
      pointsRef.current.userData.forming = true;
    }
  }, [text]); // Re-run when text changes (and mesh updates)

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    const targets = pointsRef.current.userData.targets;
    const forming = pointsRef.current.userData.forming;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let tx, ty, tz;
      
      if (targets && forming) {
        // Move towards text shape
        tx = targets[i * 3];
        ty = targets[i * 3 + 1];
        tz = targets[i * 3 + 2];
        
        // Add some noise/breathing
        tx += Math.sin(time * 2 + i) * 0.02;
        ty += Math.cos(time * 3 + i) * 0.02;
        tz += Math.sin(time * 1 + i) * 0.02;
      } else {
        // Chaos / Idling
        tx = randomPositions[i * 3] + Math.sin(time + i) * 0.5;
        ty = randomPositions[i * 3 + 1] + Math.cos(time * 0.5 + i) * 0.5;
        tz = randomPositions[i * 3 + 2] + Math.sin(time * 0.3 + i) * 0.5;
      }
      
      // Lerp current to target
      const cx = positionsAttribute.array[i * 3];
      const cy = positionsAttribute.array[i * 3 + 1];
      const cz = positionsAttribute.array[i * 3 + 2];
      
      const speed = 0.05 + (Math.random() * 0.02);
      
      positionsAttribute.array[i * 3] += (tx - cx) * speed;
      positionsAttribute.array[i * 3 + 1] += (ty - cy) * speed;
      positionsAttribute.array[i * 3 + 2] += (tz - cz) * speed;
    }
    
    positionsAttribute.needsUpdate = true;
    
    // Rotate the whole group slowly
    pointsRef.current.rotation.y += 0.002;
  });

  return (
    <>
      <Center>
        <Text3D
          ref={meshRef}
          font={FONT_URL}
          size={0.8}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {text}
          <meshBasicMaterial visible={false} />
        </Text3D>
      </Center>
      
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={PARTICLE_COUNT}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
            count={PARTICLE_COUNT}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </>
  );
}

export default function GardenMagicScreen() {
  const { currentOrb, orbHistory } = useMeditation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [inputText, setInputText] = useState("");
  const [activeText, setActiveText] = useState("LOVE"); // Default
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Unlocked colors logic
  const unlockedColors = useMemo(() => {
    const colors = new Set<string>();
    // Add current orb layers
    currentOrb.layers.forEach(c => colors.add(c));
    // Add history
    orbHistory.forEach(o => o.layers.forEach(c => colors.add(c)));
    
    // Fallback if no colors (should at least have one if level > 0, or default white)
    if (colors.size === 0) return ["#ffffff", "#ffd700"];
    
    return Array.from(colors);
  }, [currentOrb, orbHistory]);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    // Simulate processing
    setTimeout(() => {
      setActiveText(inputText);
      setIsGenerating(false);
      setInputText("");
    }, 500);
  };
  
  const handleSave = () => {
    Alert.alert("Magic Saved", "A snapshot of your creation has been saved to your gallery.");
  };
  
  const handleShare = () => {
     Alert.alert("Shared to World", "Your energy has been posted to the feed.");
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* 3D Scene */}
      <View style={styles.scene}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color={unlockedColors[0]} />
          
          <Suspense fallback={null}>
            <ParticleShape text={activeText} colors={unlockedColors} />
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={true} minDistance={2} maxDistance={10} />
        </Canvas>
      </View>

      {/* UI Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chakra Magic</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom Controls */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.bottomControls}
        >
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type your intention..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputText}
                onChangeText={setInputText}
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleGenerate}
              />
              <TouchableOpacity 
                style={[styles.generateButton, { backgroundColor: isGenerating ? '#555' : '#8B5CF6' }]}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                   <Loader2 color="white" size={20} />
                ) : (
                   <Wand2 color="white" size={20} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
               <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                 <Download color="white" size={20} />
                 <Text style={styles.actionText}>Save Video</Text>
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                 <ShareIcon color="white" size={20} />
                 <Text style={styles.actionText}>Share</Text>
               </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 20,
    marginBottom: 20,
  },
  blurContainer: {
    borderRadius: 20,
    padding: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    paddingHorizontal: 20,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  generateButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  actionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
});
