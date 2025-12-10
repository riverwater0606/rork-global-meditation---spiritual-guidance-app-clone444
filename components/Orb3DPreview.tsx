import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Orb } from '@/providers/MeditationProvider';

interface Orb3DPreviewProps {
  orb: Orb;
  size?: number;
}

const OrbParticlesPreview = ({ layers }: { layers: string[] }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  
  const { positions, colors } = useMemo(() => {
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 
      ? layers.map(c => new THREE.Color(c)) 
      : [new THREE.Color("#cccccc")];
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0 + Math.random() * 0.15;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      const layerIndex = Math.floor(Math.random() * colorObjects.length);
      const c = colorObjects[layerIndex];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    
    return { positions, colors };
  }, [layers]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.3;
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
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

export const Orb3DPreview: React.FC<Orb3DPreviewProps> = ({ 
  orb, 
  size = 200 
}) => {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height: size }]}>
        <Canvas camera={{ position: [0, 0, 3.5] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.5} />
          <OrbParticlesPreview layers={orb.layers} />
        </Canvas>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: size }]}>
      <Canvas camera={{ position: [0, 0, 3.5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.5} />
        <OrbParticlesPreview layers={orb.layers} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
