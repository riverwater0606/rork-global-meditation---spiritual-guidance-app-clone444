import React, { useRef, useMemo } from "react";
import { useFrame } from "@/lib/r3f";
import * as THREE from "three";
import { Orb } from "@/providers/MeditationProvider";

export function MainOrb({ orb, interactionMode }: { orb: Orb; interactionMode: 'idle'|'gather'|'charge' }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  
  // Material based on status
  const material = useMemo(() => {
      if (orb.status === 'eternal') {
          return new THREE.MeshPhysicalMaterial({
              color: new THREE.Color("#FFFFFF"),
              emissive: new THREE.Color("#E0E0FF"),
              emissiveIntensity: 2,
              roughness: 0,
              metalness: 0.2,
              transmission: 1, // Glass
              thickness: 2,
              clearcoat: 1,
          });
      }
      if (orb.status === 'legendary') {
           return new THREE.MeshPhysicalMaterial({
              color: new THREE.Color("#D8B4FE"), // Purple/Gold
              emissive: new THREE.Color("#A855F7"),
              emissiveIntensity: 1,
              roughness: 0.1,
              metalness: 0.5,
              transmission: 0.8,
              thickness: 1,
          });
      }
      if (orb.status === 'awakened') {
           return new THREE.MeshStandardMaterial({
              color: new THREE.Color(orb.layers[orb.layers.length-1] || "#FCD34D"),
              emissive: new THREE.Color(orb.layers[0] || "#F59E0B"),
              emissiveIntensity: 0.5,
              roughness: 0.4,
              metalness: 0.1,
          });
      }
      // Seed
      return new THREE.MeshStandardMaterial({
          color: new THREE.Color("#FFF"),
          emissive: new THREE.Color("#FFF"),
          emissiveIntensity: 0.2,
          wireframe: true,
      });
  }, [orb.status, orb.layers]);

  // Particles
  const { positions, colors } = useMemo(() => {
    const count = orb.status === 'eternal' ? 3000 : (orb.status === 'legendary' ? 2000 : 1000);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorObj = new THREE.Color(orb.layers[orb.layers.length-1] || "#FFF");
    
    for(let i=0; i<count; i++) {
        const r = 1.2 + Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        
        col[i*3] = colorObj.r;
        col[i*3+1] = colorObj.g;
        col[i*3+2] = colorObj.b;
    }
    return { positions: pos, colors: col };
  }, [orb.status, orb.layers]);

  useFrame((state) => {
      const time = state.clock.getElapsedTime();
      
      if (meshRef.current) {
          meshRef.current.rotation.y = time * 0.2;
          meshRef.current.rotation.z = time * 0.05;
          
          // Breathing
          const scale = 1 + Math.sin(time) * 0.05;
          let targetScale = scale;
          
          if (interactionMode === 'gather') {
              targetScale = 0.8;
              meshRef.current.rotation.y += 0.1; // Spin faster
          }
          
          meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      }
      
      if (particlesRef.current) {
          particlesRef.current.rotation.y = -time * 0.1;
          // Pulse particles
          if (interactionMode === 'gather') {
              // Sucking in effect?
              particlesRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.05);
          } else {
              particlesRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
          }
      }
  });

  return (
    <group>
        {/* Core */}
        <mesh ref={meshRef} material={material}>
            <icosahedronGeometry args={[1, orb.status === 'seed' ? 1 : 4]} />
        </mesh>
        
        {/* Aura/Glow */}
        <mesh ref={glowRef} scale={[1.2, 1.2, 1.2]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
                color={orb.layers[0] || "#FFF"} 
                transparent 
                opacity={0.1} 
                side={THREE.BackSide} 
                blending={THREE.AdditiveBlending}
            />
        </mesh>
        
        {/* Particles */}
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.03} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>

        {/* Sacred Geometry (Only for higher levels) */}
        {(orb.status === 'legendary' || orb.status === 'eternal') && (
            <mesh rotation={[0.5, 0.5, 0]}>
                <octahedronGeometry args={[1.5, 0]} />
                <meshBasicMaterial color="#FFF" wireframe transparent opacity={0.1} />
            </mesh>
        )}
    </group>
  );
}
