import React, { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Orb } from "@/providers/MeditationProvider";
import { MainOrb } from "./MainOrb";
import { BackgroundStars } from "./Background";
import { FloatingOrb } from "./FloatingOrb";

interface Props {
  orb: Orb;
  collectedOrbs: Orb[];
  gyro: { x: number; y: number; z: number };
  interactionMode: 'idle' | 'gather' | 'charge';
  onMerge: (id: string) => void;
}

export function GardenScene({ orb, collectedOrbs, gyro, interactionMode, onMerge }: Props) {
  const { camera } = useThree();
  
  // Parallax Effect
  useFrame(() => {
    // Gyro values usually small, e.g., 0.1
    // Move camera slightly
    const targetX = gyro.y * 2; // Tilt left/right moves camera x
    const targetY = gyro.x * 2; // Tilt up/down moves camera y
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4B0082" />
      
      <BackgroundStars />
      
      <MainOrb 
        orb={orb} 
        interactionMode={interactionMode} 
      />
      
      {/* Floating Collected Orbs (Synthesis candidates) */}
      {collectedOrbs.map((cOrb, index) => {
          // Position them in a circle around
          const angle = (index / collectedOrbs.length) * Math.PI * 2;
          const radius = 3;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius - 2; // slightly behind
          const y = Math.sin(index) * 1;
          
          return (
              <FloatingOrb 
                key={cOrb.id}
                orb={cOrb}
                position={[x, y, z]}
                onMerge={() => onMerge(cOrb.id)}
              />
          );
      })}
    </>
  );
}
