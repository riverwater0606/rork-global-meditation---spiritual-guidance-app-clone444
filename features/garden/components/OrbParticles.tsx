import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbShape } from "@/providers/MeditationProvider";
import {
  generateMerkabaData,
  generateEarthData,
  generateFlowerOfLifeData,
  generateFlowerOfLifeCompleteData,
  generateTreeOfLifeData,
  generateGridOfLifeData,
  generateSriYantraData,
  generateStarOfDavidData,
  generateTriquetraData,
  generateGoldenRectanglesData,
  generateDoubleHelixDNAData,
  generateVortexRingData,
  generateFractalTreeData,
  generateWaveInterferenceData,
  generateQuantumOrbitalsData,
  generateCelticKnotData,
  generateStarburstNovaData,
  generateLatticeWaveData,
  generateSacredFlameData,
  PARTICLE_COUNT,
} from "@/constants/sacredGeometry";

export const OrbParticles = ({ layers, interactionState, shape }: { layers: string[], interactionState: any, shape: OrbShape }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const colorAttributeRef = useRef<THREE.BufferAttribute>(null!);
  
  // Pre-calculate positions for Sacred Geometry
  const { positions, colors, targetPositions, heartPositions, groups } = useMemo(() => {
    const particleCount = PARTICLE_COUNT;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3); // The destination shape
    const heartPositions = new Float32Array(particleCount * 3); // Heart shape for sending
    const groups = new Float32Array(particleCount); // Group ID for animation
    
    const colorObjects = layers.length > 0 ? layers.map(c => new THREE.Color(c)) : [new THREE.Color("#ffffff")];
    
    // Helper: Random point in sphere
    const setRandomSphere = (i: number) => {
      const r = 1.0 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Default colors
      const layerIndex = Math.floor(Math.random() * layers.length);
      const c = colorObjects[layerIndex] || new THREE.Color("#ffffff");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    };

    // --- GEOMETRY GENERATORS ---

    // 0. Default Sphere
    const generateSphere = () => {
      for(let i=0; i<particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 1.0 + Math.random() * 0.2; // Natural sphere with slight fuzziness
        
        targetPositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        targetPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        targetPositions[i*3+2] = r * Math.cos(phi);
        
        // Reset colors to layers
        const layerIndex = Math.floor(Math.random() * layers.length);
        const c = colorObjects[layerIndex] || new THREE.Color("#ffffff");
        colors[i*3] = c.r;
        colors[i*3+1] = c.g;
        colors[i*3+2] = c.b;
      }
    };

    // 1. Flower of Life (3D with sacred geometry points)
    const generateFlowerOfLife = () => {
      const data = generateFlowerOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 1.5 Flower of Life Complete
    const generateFlowerOfLifeComplete = () => {
      const data = generateFlowerOfLifeCompleteData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 2. Star of David (Interlocking Triangles) with Light Beams
    const generateStarOfDavid = () => {
      const data = generateStarOfDavidData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 3. Merkaba (Star Tetrahedron)
    const generateMerkaba = () => {
      const data = generateMerkabaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 4. Tree of Life
    const generateTreeOfLife = () => {
      const data = generateTreeOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 6. Grid of Life (64 Tetrahedron)
    const generateGridOfLife = () => {
      const data = generateGridOfLifeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 7. Sri Yantra
    const generateSriYantra = () => {
      const data = generateSriYantraData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 8. Triquetra
    const generateTriquetra = () => {
      const data = generateTriquetraData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 9. Golden Rectangles
    const generateGoldenRectangles = () => {
      const data = generateGoldenRectanglesData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 10. Double Helix DNA
    const generateDoubleHelixDNA = () => {
      const data = generateDoubleHelixDNAData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 11. Vortex Ring
    const generateVortexRing = () => {
      const data = generateVortexRingData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 12. Fractal Tree
    const generateFractalTree = () => {
      const data = generateFractalTreeData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 13. Wave Interference
    const generateWaveInterference = () => {
      const data = generateWaveInterferenceData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 14. Quantum Orbitals
    const generateQuantumOrbitals = () => {
      const data = generateQuantumOrbitalsData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 15. Celtic Knot
    const generateCelticKnot = () => {
      const data = generateCelticKnotData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 16. Starburst Nova
    const generateStarburstNova = () => {
      const data = generateStarburstNovaData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 17. Lattice Wave
    const generateLatticeWave = () => {
      const data = generateLatticeWaveData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 18. Sacred Flame
    const generateSacredFlame = () => {
      const data = generateSacredFlameData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 5. Earth
    const generateEarth = () => {
      const data = generateEarthData();
      targetPositions.set(data.positions);
      colors.set(data.colors);
      groups.set(data.groups);
    };

    // 6. Heart (For Sending)
    const generateHeart = () => {
      for(let i=0; i<particleCount; i++) {
        // Parametric Heart
        // x = 16 sin^3(t)
        // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
        
        // We want a filled heart, so we can vary the "radius" or just layer multiple curves
        // Or simply distribute points along the curve with some noise
        
        const t = Math.random() * Math.PI * 2;
        const scale = 0.05;
        
        // Base curve
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        
        // Add thickness/volume
        // Random point inside unit sphere * thickness
        const thickness = 0.2;
        
        // Pull towards center to make it solid?
        // Let's keep it as a thick shell for better definition
        
        heartPositions[i*3] = hx * scale + (Math.random()-0.5)*thickness;
        heartPositions[i*3+1] = hy * scale + (Math.random()-0.5)*thickness + 0.2; // Shift up slightly
        heartPositions[i*3+2] = (Math.random()-0.5) * 0.5; // Depth
      }
    };

    // Initialize random sphere positions first (start state)
    for(let i=0; i<particleCount; i++) setRandomSphere(i);
    
    // Generate Target Shape based on prop
    if (shape === 'flower-of-life') generateFlowerOfLife();
    else if (shape === 'flower-of-life-complete') generateFlowerOfLifeComplete();
    else if (shape === 'star-of-david') generateStarOfDavid();
    else if (shape === 'merkaba') generateMerkaba();
    else if (shape === 'tree-of-life') generateTreeOfLife();
    else if (shape === 'earth') generateEarth();
    else if (shape === 'grid-of-life') generateGridOfLife();
    else if (shape === 'sri-yantra') generateSriYantra();
    else if (shape === 'triquetra') generateTriquetra();
    else if (shape === 'golden-rectangles') generateGoldenRectangles();
    else if (shape === 'double-helix-dna') generateDoubleHelixDNA();
    else if (shape === 'vortex-ring') generateVortexRing();
    else if (shape === 'fractal-tree') generateFractalTree();
    else if (shape === 'wave-interference') generateWaveInterference();
    else if (shape === 'quantum-orbitals') generateQuantumOrbitals();
    else if (shape === 'celtic-knot') generateCelticKnot();
    else if (shape === 'starburst-nova') generateStarburstNova();
    else if (shape === 'lattice-wave') generateLatticeWave();
    else if (shape === 'sacred-flame') generateSacredFlame();
    else generateSphere(); // Default
    
    // Always generate heart positions so they are ready
    generateHeart();
    
    return { positions, colors, targetPositions, heartPositions, groups };
  }, [layers, shape]);

  // Use a buffer attribute for current positions to interpolate
  const currentPositions = useMemo(() => {
    // Start with random sphere positions (from useMemo above)
    // We clone positions to be the mutable current state
    return new Float32Array(positions);
  }, [positions]); // Reset when positions (shape source) changes

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const { mode, spinVelocity, progress } = interactionState.current;
    
    // Friction for spin - REMOVED per user request (perpetual spin)
    // if (Math.abs(spinVelocity) > 0.0001) {
    //    interactionState.current.spinVelocity *= 0.98; 
    // } else {
    //    interactionState.current.spinVelocity = 0;
    // }
    
    // Cap max speed to avoid dizziness
    if (Math.abs(interactionState.current.spinVelocity) > 2.0) {
      interactionState.current.spinVelocity = 2.0 * Math.sign(interactionState.current.spinVelocity);
    }

    // Rotation Logic
    let rotationSpeed = 0.001 + spinVelocity;
    
    // Earth: 90s rotation (approx 0.0011 rad/frame at 60fps) + User Control
    if (shape === 'earth') {
       // Auto rotation: 1 rev / 90s (Clockwise from North = Negative Y)
       // 2PI / (90 * 60) ~= 0.00116
       const autoSpeed = -0.00116; 
       rotationSpeed = autoSpeed + spinVelocity;
    }
    
    if (mode === 'gather') rotationSpeed = 0.02 + (progress * 0.1); 
    if (mode === 'meditating') rotationSpeed = 0.005; // Gentle rotation during meditation
    pointsRef.current.rotation.y += rotationSpeed;
    
    // Apply X rotation (vertical tilt from gestures)
    const rotationSpeedX = interactionState.current.spinVelocityX || 0;
    if (shape !== 'merkaba' && shape !== 'earth') {
      pointsRef.current.rotation.x += rotationSpeedX;
    }
    
    // Merkaba needs to stay upright (no Z tilt from gestures if we supported them)
    // Actually standard rotation is only Y.
    // If we want to allow user to tilt earth? 
    // For now keep Y rotation.
    
    if (shape === 'merkaba' || shape === 'earth') {
       pointsRef.current.rotation.z = 0;
       // Earth needs to be upright
       pointsRef.current.rotation.x = 0; 
    }
    
    // Access geometry attributes
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    
    // Time-based animations
    const t = state.clock.elapsedTime;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      
      let tx = targetPositions[ix];
      let ty = targetPositions[iy];
      let tz = targetPositions[iz];
      
      // SHAPE ANIMATIONS
      if (shape === 'flower-of-life' || shape === 'flower-of-life-complete') {
         const g = groups[i];
         // Gentle pulse for all particles
         const pulse = 1.0 + Math.sin(t * 2) * 0.03;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         if (shape === 'flower-of-life-complete') {
            // For complete version:
            // Group 1: Circles -> Subtle breathing
            if (g === 1) {
              const breath = 1.0 + Math.sin(t * 1.5 + ix * 0.0001) * 0.01;
              tx *= breath; ty *= breath;
            }
            // Group 2: Outer Circle -> Slow rotation or shine?
            if (g === 2) {
               // Make outer ring shimmer
               const shimmer = 1.0 + Math.sin(t * 3 + Math.atan2(ty, tx)*5) * 0.02;
               tx *= shimmer; ty *= shimmer;
            }
         } else {
             // Old logic
             // Key intersection points (g=0) glow brighter
             if (g === 0) {
               const glow = 1.0 + Math.sin(t * 4 + i * 0.01) * 0.08;
               tx *= glow; ty *= glow; tz *= glow;
             }
             // Outer ring (g=2) subtle wave
             if (g === 2) {
               const wave = Math.sin(t * 1.5 + Math.atan2(ty, tx) * 3) * 0.02;
               tx += wave; ty += wave;
             }
         }
      } else if (shape === 'merkaba') {
         const g = groups[i];
         if (g === 2) {
           // Center pulse
           const s = 1 + Math.pow(Math.sin(t * 3), 2) * 0.1; // Faster, sharp pulse
           tx *= s; ty *= s; tz *= s;
         } else {
           // Rotation
           // T1 (Gold, g=0): Left 12s -> 2PI/12 rad/s
           // T2 (Silver, g=1): Right 15s -> -2PI/15 rad/s
           
           let ang = 0;
           if (g === 0) {
              ang = t * (Math.PI * 2 / 12);
           } else {
              ang = -t * (Math.PI * 2 / 15);
           }
           
           const cos = Math.cos(ang);
           const sin = Math.sin(ang);
           
           // Rotate around Y axis
           const rx = tx * cos - tz * sin;
           const rz = tx * sin + tz * cos;
           tx = rx; tz = rz;
         }
      } else if (shape === 'grid-of-life') {
         const g = groups[i];
         // Pulsing effect for the entire structure
         const pulse = 1.0 + Math.sin(t * 1.5) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Vertex nodes (g=0) - bright pulsing glow
         if (g === 0) {
           const glow = 1.0 + Math.sin(t * 3 + i * 0.02) * 0.1;
           tx *= glow; ty *= glow; tz *= glow;
         }
         // Edge lines (g=1) - flowing energy along edges
         else if (g === 1) {
           const flow = Math.sin(t * 2 + i * 0.005) * 0.015;
           tx += flow; ty += flow; tz += flow;
         }
         // Inner grid (g=2) - subtle breathing
         else if (g === 2) {
           const breath = 1.0 + Math.sin(t * 2.5 + i * 0.01) * 0.06;
           tx *= breath; ty *= breath; tz *= breath;
         }
         // Outer boundary (g=3) - wave effect
         else if (g === 3) {
           const wave = Math.sin(t * 1.2 + Math.atan2(ty, tx) * 4) * 0.03;
           tx += wave; ty += wave;
         }
      } else if (shape === 'star-of-david') {
         const g = groups[i];
         // Sacred pulsing for entire star
         const pulse = 1.0 + Math.sin(t * 2) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Triangle 1 edges (g=0) - blue waves flowing
         if (g === 0) {
           const wave = Math.sin(t * 2.5 + i * 0.008) * 0.025;
           tx += wave; ty += wave;
         }
         // Triangle 2 edges (g=1) - gold waves flowing
         else if (g === 1) {
           const wave = Math.sin(t * 2.3 + i * 0.008) * 0.025;
           tx += wave; ty += wave;
         }
         // Vertex nodes (g=2) - bright pulsing star points
         else if (g === 2) {
           const pointGlow = 1.0 + Math.sin(t * 4 + i * 0.05) * 0.15;
           tx *= pointGlow; ty *= pointGlow; tz *= pointGlow;
         }
         // Center core (g=3) - sacred center bright pulse
         else if (g === 3) {
           const coreGlow = 1.0 + Math.sin(t * 3.5) * 0.18;
           tx *= coreGlow; ty *= coreGlow; tz *= coreGlow;
         }
         // Center hexagon (g=4) - rotating energy ring
         else if (g === 4) {
           const hexRotation = Math.sin(t * 2 + Math.atan2(ty, tx) * 6) * 0.04;
           tx += hexRotation * Math.cos(Math.atan2(ty, tx));
           ty += hexRotation * Math.sin(Math.atan2(ty, tx));
           
           const hexGlow = 1.0 + Math.sin(t * 3.2 + Math.atan2(ty, tx) * 6) * 0.08;
           tx *= hexGlow; ty *= hexGlow;
         }
         // Outer ambient glow (g=5) - radiating energy
         else if (g === 5) {
           const radialPulse = Math.sin(t * 1.8 + Math.sqrt(tx*tx + ty*ty) * 3) * 0.035;
           const angle = Math.atan2(ty, tx);
           tx += radialPulse * Math.cos(angle);
           ty += radialPulse * Math.sin(angle);
         }
      } else if (shape === 'earth') {
          // Earth Animation: 
          // 1. Slow rotation of the "texture" (points) relative to the frame?
          // No, we rotate the whole group in the standard rotation logic below.
          // But user asked for "Unlock rotation... let user control".
          // And also "90s slow rotation".
          
          // If we want the particles to move *on* the sphere while the sphere is static?
          // No, usually we rotate the sphere container.
          
          // Let's handle Earth rotation in the main rotation logic (outside loop)
      } else if (shape === 'sri-yantra') {
         const g = groups[i];
         // Sacred pulsing for entire yantra
         const pulse = 1.0 + Math.sin(t * 2.5) * 0.04;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Bindu (g=0) - central point bright pulsing
         if (g === 0) {
           const binduGlow = 1.0 + Math.sin(t * 4) * 0.15;
           tx *= binduGlow; ty *= binduGlow; tz *= binduGlow;
         }
         // Triangles (g=1-9) - alternating wave based on group
         else if (g >= 1 && g <= 9) {
           const triangleWave = Math.sin(t * 3 + g * 0.5) * 0.03;
           tx += triangleWave; ty += triangleWave;
         }
         // Intersection nodes (g=10) - bright glow
         else if (g === 10) {
           const nodeGlow = 1.0 + Math.sin(t * 5 + i * 0.03) * 0.12;
           tx *= nodeGlow; ty *= nodeGlow; tz *= nodeGlow;
         }
         // Outer circles (g=11) - rotating wave
         else if (g === 11) {
           const outerWave = Math.sin(t * 2 + Math.atan2(ty, tx) * 3) * 0.04;
           tx += outerWave; ty += outerWave;
         }
      } else if (shape === 'triquetra') {
         const g = groups[i];
         // Extremely subtle unified breathing - entire form breathes as one eternal presence
         const breath = 1.0 + Math.sin(t * 0.8) * 0.015;
         tx *= breath; ty *= breath; tz *= breath;
         
         // Arc particles (g=0,1,2) - the three sacred strands flow with barely perceptible energy
         if (g === 0 || g === 1 || g === 2) {
           const subtleFlow = Math.sin(t * 1.5 + i * 0.003) * 0.008;
           const angle = Math.atan2(ty, tx);
           tx += subtleFlow * Math.cos(angle);
           ty += subtleFlow * Math.sin(angle);
         }
         // Center luminescence (g=4) - soft eternal light
         else if (g === 4) {
           const coreGlow = 1.0 + Math.sin(t * 2.0) * 0.08;
           tx *= coreGlow; ty *= coreGlow; tz *= coreGlow;
         }
         // Ambient halo (g=5) - slow ethereal presence
         else if (g === 5) {
           const drift = Math.sin(t * 0.6 + Math.atan2(ty, tx) * 2) * 0.015;
           const angle = Math.atan2(ty, tx);
           tx += drift * Math.cos(angle);
           ty += drift * Math.sin(angle);
         }
      } else if (shape === 'golden-rectangles') {
         const g = groups[i];
         // Divine proportion breathing for entire structure
         const pulse = 1.0 + Math.sin(t * 1.8) * 0.035;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Rectangle edges (g=0,1,2) - flowing golden energy
         if (g === 0) {
           // XY plane rectangle - horizontal wave
           const wave = Math.sin(t * 2.2 + tx * 3) * 0.02;
           tx += wave; ty += wave * 0.5;
         }
         else if (g === 1) {
           // YZ plane rectangle - vertical wave
           const wave = Math.sin(t * 2.0 + ty * 3) * 0.02;
           ty += wave; tz += wave * 0.5;
         }
         else if (g === 2) {
           // ZX plane rectangle - depth wave
           const wave = Math.sin(t * 2.4 + tz * 3) * 0.02;
           tz += wave; tx += wave * 0.5;
         }
         // Intersection nodes (g=3) - bright golden glow
         else if (g === 3) {
           const nodeGlow = 1.0 + Math.sin(t * 3.5 + i * 0.03) * 0.12;
           tx *= nodeGlow; ty *= nodeGlow; tz *= nodeGlow;
         }
         // Sacred center (g=4) - phi ratio pulse
         else if (g === 4) {
           const phiPulse = 1.0 + Math.sin(t * 2.618) * 0.15; // 2.618 ≈ φ + 1
           tx *= phiPulse; ty *= phiPulse; tz *= phiPulse;
         }
         // Outer aura (g=5) - radiating divine proportion
         else if (g === 5) {
           const radialPulse = Math.sin(t * 1.618 + Math.sqrt(tx*tx + ty*ty + tz*tz) * 2) * 0.025;
           const dist = Math.sqrt(tx*tx + ty*ty + tz*tz);
           if (dist > 0.001) {
             tx += radialPulse * (tx / dist);
             ty += radialPulse * (ty / dist);
             tz += radialPulse * (tz / dist);
           }
         }
      } else if (shape === 'double-helix-dna') {
         const g = groups[i];
         // Gentle pulse for entire DNA structure
         const pulse = 1.0 + Math.sin(t * 1.5) * 0.03;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Strand 1 (g=0) - flowing cyan energy upward
         if (g === 0) {
           const flow = Math.sin(t * 2.5 + ty * 4) * 0.02;
           tx += flow * Math.cos(ty * 3);
           tz += flow * Math.sin(ty * 3);
         }
         // Strand 2 (g=1) - flowing teal energy downward
         else if (g === 1) {
           const flow = Math.sin(t * 2.3 - ty * 4) * 0.02;
           tx += flow * Math.cos(ty * 3 + Math.PI);
           tz += flow * Math.sin(ty * 3 + Math.PI);
         }
         // Base pair connections (g=2) - pulsing bridges
         else if (g === 2) {
           const connectionPulse = 1.0 + Math.sin(t * 4 + i * 0.05) * 0.08;
           tx *= connectionPulse;
           tz *= connectionPulse;
         }
         // Trail particles (g=3) - floating around helix
         else if (g === 3) {
           const drift = Math.sin(t * 1.2 + i * 0.01) * 0.04;
           tx += drift;
           tz += drift * 0.5;
         }
         // Ambient particles (g=4) - subtle cosmic drift
         else if (g === 4) {
           const cosmicDrift = Math.sin(t * 0.8 + i * 0.005) * 0.02;
           tx += cosmicDrift;
           ty += cosmicDrift * 0.3;
         }
      } else if (shape === 'vortex-ring') {
         const g = groups[i];
         // Gentle breathing pulse for the torus
         const pulse = 1.0 + Math.sin(t * 1.8) * 0.025;
         tx *= pulse; ty *= pulse; tz *= pulse;
         
         // Torus surface (g=0) - swirling motion around the ring
         if (g === 0) {
           const angle = Math.atan2(tz, tx);
           const swirl = Math.sin(t * 2 + angle * 3) * 0.025;
           tx += swirl * Math.cos(angle + Math.PI / 2);
           tz += swirl * Math.sin(angle + Math.PI / 2);
         }
         // Flow lines (g=1) - spiraling energy
         else if (g === 1) {
           const spiral = Math.sin(t * 3 + i * 0.01) * 0.03;
           const angle = Math.atan2(tz, tx);
           tx += spiral * Math.cos(angle);
           tz += spiral * Math.sin(angle);
           ty += Math.sin(t * 2.5 + i * 0.02) * 0.015;
         }
         // Core ring (g=2) - bright pulsing center
         else if (g === 2) {
           const coreGlow = 1.0 + Math.sin(t * 4) * 0.12;
           tx *= coreGlow;
           tz *= coreGlow;
         }
         // Outer vortex (g=3) - particles being drawn in
         else if (g === 3) {
           const inwardPull = Math.sin(t * 1.5 + i * 0.008) * 0.04;
           const angle = Math.atan2(tz, tx);
           tx -= inwardPull * Math.cos(angle);
           tz -= inwardPull * Math.sin(angle);
         }
         // Ambient dust (g=4) - slow cosmic drift
         else if (g === 4) {
           const drift = Math.sin(t * 0.7 + i * 0.003) * 0.015;
           tx += drift;
           tz += drift * 0.5;
         }
      } else if (shape === 'fractal-tree') {
         const g = groups[i];
         // Gentle swaying motion like wind through branches
         const sway = Math.sin(t * 0.8 + ty * 2) * 0.02;
         tx += sway;
         tz += sway * 0.5;
         
         // Branch particles (g=0) - subtle breathing
         if (g === 0) {
           const breath = 1.0 + Math.sin(t * 1.5 + ty * 3) * 0.015;
           tx *= breath;
           tz *= breath;
         }
         // Leaf particles (g=1) - glowing pulse at endpoints
         else if (g === 1) {
           const leafGlow = 1.0 + Math.sin(t * 3 + i * 0.02) * 0.1;
           tx *= leafGlow;
           ty *= leafGlow;
           tz *= leafGlow;
         }
         // Glow particles (g=2) - floating ambient
         else if (g === 2) {
           const floatY = Math.sin(t * 1.2 + i * 0.01) * 0.03;
           ty += floatY;
         }
         // Ambient particles (g=3) - gentle drift
         else if (g === 3) {
           const drift = Math.sin(t * 0.6 + i * 0.005) * 0.02;
           tx += drift;
           tz += drift * 0.3;
         }
      } else if (shape === 'wave-interference') {
         const g = groups[i];
         // Global wave motion
         const globalWave = Math.sin(t * 1.5) * 0.02;
         ty += globalWave;
         
         // Wave 1 (g=0) - horizontal oscillation
         if (g === 0) {
           const oscillate = Math.sin(t * 2.5 + tx * 5) * 0.03;
           ty += oscillate;
         }
         // Wave 2 (g=1) - vertical oscillation
         else if (g === 1) {
           const oscillate = Math.sin(t * 2.3 + tx * 5) * 0.03;
           tz += oscillate;
         }
         // Interference surface (g=2) - rippling effect
         else if (g === 2) {
           const ripple = Math.sin(t * 2 + Math.sqrt(tx*tx + tz*tz) * 4) * 0.025;
           ty += ripple;
         }
         // Node particles (g=3) - bright pulsing
         else if (g === 3) {
           const nodePulse = 1.0 + Math.sin(t * 4 + i * 0.03) * 0.12;
           tx *= nodePulse;
           ty *= nodePulse;
           tz *= nodePulse;
         }
         // Ambient particles (g=4) - slow drift
         else if (g === 4) {
           const drift = Math.sin(t * 0.8 + i * 0.004) * 0.015;
           tx += drift;
           tz += drift * 0.5;
         }
      } 

      // Modifiers based on mode
      if (mode === 'gather') {
        const tighten = 1.0 - (progress * 0.8); 
        tx *= tighten; ty *= tighten; tz *= tighten;
        
        const jitter = 0.05 * progress;
        tx += (Math.random() - 0.5) * jitter;
        ty += (Math.random() - 0.5) * jitter;
        tz += (Math.random() - 0.5) * jitter;
      } 
      else if (mode === 'heart') {
         tx = heartPositions[ix];
         ty = heartPositions[iy];
         tz = heartPositions[iz];

         const beat = 1.0 + Math.sin(state.clock.elapsedTime * 15) * 0.05;
         tx *= beat; ty *= beat; tz *= beat;
      }
      else if (mode === 'store') {
        tx *= 0.01;
        ty = ty * 0.01 - 3.0; 
        tz *= 0.01;
      }
      else if (mode === 'explode') {
         // Heart flying away effect (Gift sent)
         tx = heartPositions[ix];
         ty = heartPositions[iy];
         tz = heartPositions[iz];
         
         const flyScale = 2.0;
         tx *= flyScale + (Math.random() - 0.5) * 0.5;
         ty = ty * flyScale + 5.0; // Fly UP off screen
         tz *= flyScale + (Math.random() - 0.5) * 0.5;
      }
      else if (mode === 'diffused') {
         // Scatter outward like a cloud/nebula
         // We use the original position but scale it up and add some sine wave movement
         const scatter = 1.5 + Math.sin(t + i * 0.1) * 0.2;
         tx *= scatter;
         ty *= scatter;
         tz *= scatter;
      }
      else if (mode === 'meditating') {
         // Gentle breathing effect
         const breath = 1.0 + Math.sin(t * 0.5) * 0.05;
         tx *= breath;
         ty *= breath;
         tz *= breath;
      }
      
      const lerpFactor = 0.1;
      currentPositions[ix] += (tx - currentPositions[ix]) * lerpFactor;
      currentPositions[iy] += (ty - currentPositions[iy]) * lerpFactor;
      currentPositions[iz] += (tz - currentPositions[iz]) * lerpFactor;
    }
    
    positionAttribute.array.set(currentPositions);
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          ref={colorAttributeRef}
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};
