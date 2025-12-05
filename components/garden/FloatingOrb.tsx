import React, { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@/lib/r3f";
import * as THREE from "three";
import { Orb } from "@/providers/MeditationProvider";

export function FloatingOrb({ orb, position, onMerge }: { orb: Orb, position: [number, number, number], onMerge: () => void }) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
      if (!ref.current) return;
      const time = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(time + position[0]) * 0.2;
      ref.current.rotation.y += 0.01;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      // Animation to center
      onMerge();
  };

  return (
    <mesh 
        ref={ref} 
        position={position} 
        onClick={handleClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.2 : 1}
    >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
            color={orb.layers[orb.layers.length-1] || "#888"} 
            emissive={orb.layers[0] || "#888"}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
        />
    </mesh>
  );
}
