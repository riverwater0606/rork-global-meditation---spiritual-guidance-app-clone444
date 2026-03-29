/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Orb, OrbShape, useMeditation } from '@/providers/MeditationProvider';
import { generateMerkabaData, generateEarthData, generateFlowerOfLifeCompleteData, PARTICLE_COUNT } from '@/constants/sacredGeometry';

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
    
    // Generate based on shape
    if (shape === 'merkaba') {
      const data = generateMerkabaData();
      // Scale down to match particleCount
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
    } else if (shape === 'earth') {
      const data = generateEarthData();
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
    } else if (shape === 'flower-of-life-complete') {
      const data = generateFlowerOfLifeCompleteData();
      // Scale down to match particleCount if needed, but generateFlowerOfLifeCompleteData returns fixed PARTICLE_COUNT
      // We might need to downsample if preview has fewer particles
      const srcPositions = data.positions;
      const srcColors = data.colors;
      const ratio = PARTICLE_COUNT / particleCount;
      
      for (let i = 0; i < particleCount; i++) {
        const srcIdx = Math.floor(i * ratio);
        positions[i * 3] = srcPositions[srcIdx * 3];
        positions[i * 3 + 1] = srcPositions[srcIdx * 3 + 1];
        positions[i * 3 + 2] = srcPositions[srcIdx * 3 + 2];
        colors[i * 3] = srcColors[srcIdx * 3];
        colors[i * 3 + 1] = srcColors[srcIdx * 3 + 1];
        colors[i * 3 + 2] = srcColors[srcIdx * 3 + 2];
      }
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
    } else if (shape === 'star-of-david') {
      const size = 1.2;
      
      for(let i=0; i<particleCount; i++) {
        const isUp = i % 2 === 0;
        const edge = Math.floor(Math.random() * 3);
        const t = Math.random();
        
        let p1, p2, p3;
        if (isUp) {
          p1 = {x:0, y:size};
          p2 = {x:size*Math.cos(210*Math.PI/180), y:size*Math.sin(210*Math.PI/180)};
          p3 = {x:size*Math.cos(330*Math.PI/180), y:size*Math.sin(330*Math.PI/180)};
        } else {
          p1 = {x:0, y:-size};
          p2 = {x:size*Math.cos(30*Math.PI/180), y:size*Math.sin(30*Math.PI/180)};
          p3 = {x:size*Math.cos(150*Math.PI/180), y:size*Math.sin(150*Math.PI/180)};
        }
        
        let A, B;
        if (edge === 0) { A=p1; B=p2; }
        else if (edge === 1) { A=p2; B=p3; }
        else { A=p3; B=p1; }
        
        let px = A.x + (B.x - A.x) * t;
        let py = A.y + (B.y - A.y) * t;
        const scatter = (Math.random() - 0.5) * 0.05;
        const z = isUp ? 0.05 : -0.05;
        
        positions[i*3] = px + scatter;
        positions[i*3+1] = py + scatter;
        positions[i*3+2] = z + (Math.random()-0.5)*0.02;

        colors[i*3] = 0.0;
        colors[i*3+1] = 0.8 + Math.random()*0.2;
        colors[i*3+2] = 1.0;
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
    
    let rotationSpeed = 0.001;
    
    if (shape === 'earth') {
      const autoSpeed = -0.00116;
      rotationSpeed = autoSpeed + sharedSpinVelocity;
    } else if (shape === 'merkaba') {
      rotationSpeed = 0.001 + sharedSpinVelocity;
    } else {
      rotationSpeed = 0.001 + sharedSpinVelocity;
    }
    
    pointsRef.current.rotation.y += rotationSpeed;
    
    if (shape === 'merkaba' || shape === 'earth') {
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
