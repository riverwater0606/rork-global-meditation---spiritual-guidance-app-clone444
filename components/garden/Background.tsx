import React, { useMemo, useRef } from "react";
import { useFrame } from "@/lib/r3f";
import * as THREE from "three";

export function BackgroundStars() {
  const ref = useRef<THREE.Points>(null!);
  
  const { positions } = useMemo(() => {
      const count = 5000;
      const positions = new Float32Array(count * 3);
      for(let i=0; i<count; i++) {
          positions[i*3] = (Math.random() - 0.5) * 50;
          positions[i*3+1] = (Math.random() - 0.5) * 50;
          positions[i*3+2] = (Math.random() - 0.5) * 50;
      }
      return { positions };
  }, []);

  useFrame((state) => {
      // Rotate background slowly
      if (ref.current) {
          ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      }
  });

  return (
    <points ref={ref}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#FFF" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}
