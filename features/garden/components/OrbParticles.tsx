import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbShape } from "@/providers/MeditationProvider";
import { generateOrbParticleData } from "@/features/garden/services/orbGeometry";

export const OrbParticles = ({ layers, interactionState, shape }: { layers: string[]; interactionState: any; shape: OrbShape }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const colorAttributeRef = useRef<THREE.BufferAttribute>(null!);
  const { positions, colors, targetPositions, heartPositions } = useMemo(
    () => generateOrbParticleData(layers, shape),
    [layers, shape]
  );

  useFrame(() => {
    if (!pointsRef.current) return;
    const { mode, spinVelocity, progress } = interactionState.current;
    pointsRef.current.rotation.y += spinVelocity * 0.02;
    if (mode === "heart") {
      for (let i = 0; i < positions.length; i += 1) {
        positions[i] += (heartPositions[i] - positions[i]) * 0.06;
      }
      (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    } else if (mode === "idle" || mode === "gather") {
      for (let i = 0; i < positions.length; i += 1) {
        positions[i] += (targetPositions[i] - positions[i]) * (0.02 + progress * 0.03);
      }
      (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    if (colorAttributeRef.current) colorAttributeRef.current.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute ref={colorAttributeRef} attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
