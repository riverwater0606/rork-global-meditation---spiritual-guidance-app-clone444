import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Orb, OrbShape, useMeditation } from '@/providers/MeditationProvider';
import { 
  generateMerkabaData,
  generateSeedOfLifeData,
  generateVesicaPiscisData,
  generateTorusData,
  generateSriYantraData,
  generateGoldenSpiralData,
  generateVectorEquilibriumData,
  generateMetatronsCubeData,
  generatePlatonicSolidsData,
  PARTICLE_COUNT 
} from '@/constants/sacredGeometry';

interface Orb3DPreviewProps {
  orb: Orb;
  size?: number;
}

const OrbParticlesPreview = ({ layers, size, shape }: { layers: string[]; size: number; shape: OrbShape }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const { sharedSpinVelocity } = useMeditation();
  
  const { positions, colors } = useMemo(() => {
    const baseParticleCount = 20000;
    const scaleFactor = (size / 200) ** 2;
    const particleCount = Math.floor(baseParticleCount * scaleFactor);
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 
      ? layers.map(c => new THREE.Color(c)) 
      : [new THREE.Color("#cccccc")];
    
    const copyScaledData = (data: { positions: Float32Array; colors: Float32Array }) => {
      const scaleFactor = particleCount / PARTICLE_COUNT;
      for (let i = 0; i < particleCount; i++) {
        const srcIdx = Math.floor(i / scaleFactor);
        positions[i * 3] = data.positions[srcIdx * 3];
        positions[i * 3 + 1] = data.positions[srcIdx * 3 + 1];
        positions[i * 3 + 2] = data.positions[srcIdx * 3 + 2];
        colors[i * 3] = data.colors[srcIdx * 3];
        colors[i * 3 + 1] = data.colors[srcIdx * 3 + 1];
        colors[i * 3 + 2] = data.colors[srcIdx * 3 + 2];
      }
    };

    // Generate based on shape
    if (shape === 'merkaba') {
      copyScaledData(generateMerkabaData());
    } else if (shape === 'seed-of-life') {
      copyScaledData(generateSeedOfLifeData());
    } else if (shape === 'vesica-piscis') {
      copyScaledData(generateVesicaPiscisData());
    } else if (shape === 'torus') {
      copyScaledData(generateTorusData());
    } else if (shape === 'sri-yantra') {
      copyScaledData(generateSriYantraData());
    } else if (shape === 'golden-spiral') {
      copyScaledData(generateGoldenSpiralData());
    } else if (shape === 'vector-equilibrium') {
      copyScaledData(generateVectorEquilibriumData());
    } else if (shape === 'metatrons-cube') {
      copyScaledData(generateMetatronsCubeData());
    } else if (shape === 'platonic-solids') {
      copyScaledData(generatePlatonicSolidsData(0));
    } else if (shape === 'flower-of-life') {
      const circleRadius = 0.5;
      const centers: {x:number, y:number}[] = [{x:0,y:0}];
      
      for(let i=0; i<6; i++) {
        const angle = i * Math.PI / 3;
        centers.push({ x: Math.cos(angle)*circleRadius, y: Math.sin(angle)*circleRadius });
      }
      for(let i=0; i<6; i++) {
        const angle = i * Math.PI / 3;
        centers.push({ x: 2*Math.cos(angle)*circleRadius, y: 2*Math.sin(angle)*circleRadius });
        const angleMid = angle + Math.PI/6;
        centers.push({ x: Math.sqrt(3)*Math.cos(angleMid)*circleRadius, y: Math.sqrt(3)*Math.sin(angleMid)*circleRadius });
      }

      for (let i = 0; i < particleCount; i++) {
        const circleIdx = i % centers.length;
        const center = centers[circleIdx];
        const theta = Math.random() * Math.PI * 2;
        const r = circleRadius * (0.98 + Math.random()*0.04);
        
        positions[i*3] = center.x + r * Math.cos(theta);
        positions[i*3+1] = center.y + r * Math.sin(theta);
        positions[i*3+2] = (Math.random() - 0.5) * 0.05;
        
        colors[i*3] = 1.0;
        colors[i*3+1] = 0.5 + Math.random()*0.5;
        colors[i*3+2] = 0.5 + Math.random()*0.5;
      }
    } else {
      // Default sphere
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
    }
    
    return { positions, colors };
  }, [layers, size, shape]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    let rotationSpeed = 0.001 + sharedSpinVelocity;
    pointsRef.current.rotation.y += rotationSpeed;
    
    if (shape === 'merkaba') {
      pointsRef.current.rotation.z = 0;
      pointsRef.current.rotation.x = 0;
    }
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
  const shape = orb.shape || 'default';
  
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height: size }]}>
        <Canvas camera={{ position: [0, 0, 3.5] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={0.5} />
          <OrbParticlesPreview layers={orb.layers} size={size} shape={shape} />
        </Canvas>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: size }]}>
      <Canvas camera={{ position: [0, 0, 3.5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.5} />
        <OrbParticlesPreview layers={orb.layers} size={size} shape={shape} />
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
