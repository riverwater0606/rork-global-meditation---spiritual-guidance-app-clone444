/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Orb, OrbDisplayMode, OrbShape, useMeditation } from '@/providers/MeditationProvider';
import { OrbFallback } from '@/components/OrbFallback';
import { canUseWebGL } from '@/lib/webglSupport';
import {
  generateAkashicGalaxyData,
  generateAscensionSpiralData,
  generateCaduceusData,
  generateEggOfLifeData,
  generateCurvedMerkabaData,
  generateCurvedMetatronData,
  generateCrownChakraData,
  generateCelticKnotData,
  generateCosmicSerpentData,
  generateDoubleHelixDNAData,
  generateEarthData,
  generateJupiterData,
  generateMarsData,
  generateNeptuneData,
  generateFlowerOfLifeCompleteData,
  generateFlowerOfLifeData,
  generateFractalTreeData,
  generateFruitOfLifeData,
  generateGoldenRectanglesData,
  generateGoldenCirclesData,
  generateGoldenSpiralData,
  generateGridOfLifeData,
  generateHaloBloomData,
  generateInfinityPrayerData,
  generateLatticeWaveData,
  generateLotusMandalaData,
  generateLotusGalaxyData,
  generateMerkabaData,
  generateMetatronsCubeData,
  generateOracleConstellationData,
  generatePhoenixSpiralData,
  generatePrismFieldData,
  generateQuantumOrbitalsData,
  generateSaturnData,
  generateSacredFlameData,
  generateSevenWavesData,
  generateSeedOfLifeData,
  generateSnowflakeMandalaData,
  generateSoulNebulaData,
  generateSphereOfCirclesData,
  generateSriYantraData,
  generateStarOfDavidData,
  generateStarburstNovaData,
  generateTorusFlowerData,
  generateTreeOfLifeData,
  generateTriquetraData,
  generateOctagramStarData,
  generateRingTorusData,
  generateUnicursalHexagramData,
  generateVectorEquilibriumData,
  generateVesicaPiscisData,
  generateVortexRingData,
  generateWaveInterferenceData,
  generateVenusData,
  generateYinYangFlowData,
} from '@/constants/sacredGeometry';

interface Orb3DPreviewProps {
  orb: Orb;
  size?: number;
  displayMode?: OrbDisplayMode;
}

const SHAPE_VIEW_PRESETS: Partial<Record<OrbShape, { x: number; z: number }>> = {
  'vortex-ring': { x: 0.48, z: 0.08 },
  'quantum-orbitals': { x: 0.42, z: 0.22 },
  'ring-torus': { x: 0.72, z: 0 },
  'grid-of-life': { x: 0.54, z: 0.2 },
  'cosmic-serpent': { x: 0.24, z: -0.14 },
  'halo-bloom': { x: 0.44, z: 0.12 },
  'seven-waves': { x: 0.32, z: -0.1 },
};

const OrbParticlesPreview = ({ layers, size, shape, displayMode = 'idle' }: { layers: string[]; size: number; shape: OrbShape; displayMode?: OrbDisplayMode }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const positionAttributeRef = useRef<THREE.BufferAttribute>(null);
  const displayModeRef = useRef<OrbDisplayMode>(displayMode);
  const { sharedSpinVelocity } = useMeditation();
  const pointSize = size < 96 ? 0.032 : 0.038;

  useEffect(() => {
    displayModeRef.current = displayMode;
  }, [displayMode]);

  const { positions, currentPositions, colors, groups } = useMemo(() => {
    const baseParticleCount = 24000;
    const scaleFactor = (size / 200) ** 2;
    const particleCount = Math.max(4200, Math.floor(baseParticleCount * scaleFactor));
    const positions = new Float32Array(particleCount * 3);
    const currentPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const groups = new Float32Array(particleCount);

    const colorObjects = layers.length > 0
      ? layers.map(c => new THREE.Color(c))
      : [new THREE.Color("#cccccc")];
    const sampleParticleData = (data: { positions: Float32Array; colors: Float32Array; groups?: Float32Array }) => {
      const sourceCount = data.positions.length / 3;
      const ratio = sourceCount / particleCount;

      for (let i = 0; i < particleCount; i++) {
        const srcIdx = Math.min(sourceCount - 1, Math.floor(i * ratio));
        positions[i * 3] = data.positions[srcIdx * 3];
        positions[i * 3 + 1] = data.positions[srcIdx * 3 + 1];
        positions[i * 3 + 2] = data.positions[srcIdx * 3 + 2];
        colors[i * 3] = data.colors[srcIdx * 3];
        colors[i * 3 + 1] = data.colors[srcIdx * 3 + 1];
        colors[i * 3 + 2] = data.colors[srcIdx * 3 + 2];
        groups[i] = data.groups?.[srcIdx] ?? 0;
      }
    };

    const shapeGenerators: Partial<Record<OrbShape, () => { positions: Float32Array; colors: Float32Array; groups?: Float32Array }>> = {
      'flower-of-life': generateFlowerOfLifeData,
      'flower-of-life-complete': generateFlowerOfLifeCompleteData,
      'star-of-david': generateStarOfDavidData,
      'merkaba': generateMerkabaData,
      'tree-of-life': generateTreeOfLifeData,
      'grid-of-life': generateGridOfLifeData,
      'sri-yantra': generateSriYantraData,
      'triquetra': generateTriquetraData,
      'ring-torus': generateRingTorusData,
      'golden-rectangles': generateGoldenRectanglesData,
      'double-helix-dna': generateDoubleHelixDNAData,
      'vortex-ring': generateVortexRingData,
      'fractal-tree': generateFractalTreeData,
      'wave-interference': generateWaveInterferenceData,
      'quantum-orbitals': generateQuantumOrbitalsData,
      'celtic-knot': generateCelticKnotData,
      'starburst-nova': generateStarburstNovaData,
      'lattice-wave': generateLatticeWaveData,
      'sacred-flame': generateSacredFlameData,
      'metatrons-cube': generateMetatronsCubeData,
      'torus-flower': generateTorusFlowerData,
      'lotus-mandala': generateLotusMandalaData,
      'phoenix-spiral': generatePhoenixSpiralData,
      'vesica-piscis': generateVesicaPiscisData,
      'crown-chakra': generateCrownChakraData,
      'cosmic-serpent': generateCosmicSerpentData,
      'prism-field': generatePrismFieldData,
      'halo-bloom': generateHaloBloomData,
      'infinity-prayer': generateInfinityPrayerData,
      'seed-of-life': generateSeedOfLifeData,
      'egg-of-life': generateEggOfLifeData,
      'fruit-of-life': generateFruitOfLifeData,
      'golden-spiral': generateGoldenSpiralData,
      'vector-equilibrium': generateVectorEquilibriumData,
      'curved-merkaba': generateCurvedMerkabaData,
      'curved-metatron': generateCurvedMetatronData,
      'unicursal-hexagram': generateUnicursalHexagramData,
      'yin-yang-flow': generateYinYangFlowData,
      'seven-waves': generateSevenWavesData,
      'snowflake-mandala': generateSnowflakeMandalaData,
      'golden-circles': generateGoldenCirclesData,
      'sphere-of-circles': generateSphereOfCirclesData,
      'caduceus': generateCaduceusData,
      'octagram-star': generateOctagramStarData,
      'earth': generateEarthData,
      'mars': generateMarsData,
      'venus': generateVenusData,
      'jupiter': generateJupiterData,
      'saturn': generateSaturnData,
      'neptune': generateNeptuneData,
      'akashic-galaxy': generateAkashicGalaxyData,
      'soul-nebula': generateSoulNebulaData,
      'lotus-galaxy': generateLotusGalaxyData,
      'oracle-constellation': generateOracleConstellationData,
      'ascension-spiral': generateAscensionSpiralData,
    };

    const generator = shapeGenerators[shape];

    if (generator) {
      sampleParticleData(generator());
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
        groups[i] = 0;
      }
    }

    currentPositions.set(positions);

    return { positions, currentPositions, colors, groups };
  }, [layers, size, shape]);

  useFrame((state) => {
    if (!pointsRef.current || !positionAttributeRef.current) return;

    const t = state.clock.elapsedTime;
    let rotationSpeed = 0.001 + sharedSpinVelocity;
    if (shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'saturn' || shape === 'neptune') {
      rotationSpeed = -0.00116 + sharedSpinVelocity;
    }

    pointsRef.current.rotation.y += rotationSpeed;
    if (shape === 'merkaba' || shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'saturn' || shape === 'neptune') {
      pointsRef.current.rotation.z = 0;
      pointsRef.current.rotation.x = 0;
    } else {
      const viewPreset = SHAPE_VIEW_PRESETS[shape];
      if (viewPreset) {
        pointsRef.current.rotation.x = viewPreset.x;
        pointsRef.current.rotation.z = viewPreset.z;
      } else {
        pointsRef.current.rotation.x = 0;
        pointsRef.current.rotation.z = 0;
      }
    }

    if (shape === 'default' || shape === 'earth' || shape === 'mars' || shape === 'venus' || shape === 'jupiter' || shape === 'saturn' || shape === 'neptune') {
      return;
    }

    const particleCount = groups.length;
    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;
      const g = groups[i];
      let tx = positions[ix];
      let ty = positions[iy];
      let tz = positions[iz];

      if (shape === 'flower-of-life' || shape === 'flower-of-life-complete') {
        const pulse = 1 + Math.sin(t * 2) * 0.03;
        tx *= pulse;
        ty *= pulse;
        tz *= pulse;
        if (g === 0 || g === 2) {
          const glow = 1 + Math.sin(t * 3 + i * 0.01) * 0.05;
          tx *= glow;
          ty *= glow;
        }
      } else if (shape === 'star-of-david') {
        const starPulse = 1 + Math.sin(t * 2.2) * 0.04;
        tx *= starPulse;
        ty *= starPulse;
        if (g === 2 || g === 3) {
          const pointGlow = 1 + Math.sin(t * 4 + i * 0.03) * 0.12;
          tx *= pointGlow;
          ty *= pointGlow;
          tz *= pointGlow;
        }
      } else if (shape === 'merkaba') {
        if (g === 2) {
          const corePulse = 1 + Math.pow(Math.sin(t * 3), 2) * 0.12;
          tx *= corePulse;
          ty *= corePulse;
          tz *= corePulse;
        } else {
          const angle = g === 0 ? t * (Math.PI * 2 / 12) : -t * (Math.PI * 2 / 15);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx = tx * cos - tz * sin;
          const rz = tx * sin + tz * cos;
          tx = rx;
          tz = rz;
        }
      } else if (shape === 'tree-of-life') {
        const rise = Math.sin(t * 0.9 + ty * 2.5) * 0.03;
        ty += rise;
        if (g === 0 || g === 1) {
          const nodePulse = 1 + Math.sin(t * 3.2 + i * 0.02) * 0.08;
          tx *= nodePulse;
          ty *= nodePulse;
        }
      } else if (shape === 'grid-of-life') {
        const pulse = 1 + Math.sin(t * 1.5) * 0.04;
        tx *= pulse;
        ty *= pulse;
        tz *= pulse;
        if (g === 1) {
          const flow = Math.sin(t * 2 + i * 0.005) * 0.015;
          tx += flow;
          ty += flow;
          tz += flow;
        }
      } else if (shape === 'sri-yantra') {
        const yantraPulse = 1 + Math.sin(t * 2.3) * 0.035;
        tx *= yantraPulse;
        ty *= yantraPulse;
        if (g === 10 || g === 11) {
          const ringWave = Math.sin(t * 2 + Math.atan2(ty, tx) * 3) * 0.035;
          tx += ringWave;
          ty += ringWave;
        }
      } else if (shape === 'triquetra') {
        const breath = 1 + Math.sin(t * 0.8) * 0.015;
        tx *= breath;
        ty *= breath;
        tz *= breath;
        if (g <= 2) {
          const flow = Math.sin(t * 1.4 + i * 0.003) * 0.008;
          const angle = Math.atan2(ty, tx);
          tx += flow * Math.cos(angle);
          ty += flow * Math.sin(angle);
        }
      } else if (shape === 'ring-torus') {
        const angle = Math.atan2(tz, tx);
        const breath = 1 + Math.sin(t * 1.6 + angle * 2) * 0.015;
        if (g === 0) {
          tx *= breath;
          tz *= breath;
          ty += Math.sin(t * 1.8 + angle * 3) * 0.008;
        } else if (g === 1) {
          const torusFlow = Math.sin(t * 2.2 + angle * 3) * 0.018;
          tx += torusFlow * Math.cos(angle + Math.PI / 2);
          tz += torusFlow * Math.sin(angle + Math.PI / 2);
          ty += Math.cos(t * 1.7 + angle * 4) * 0.01;
        }
        if (g === 2) {
          const corePulse = 1 + Math.sin(t * 4.1) * 0.11;
          tx *= corePulse;
          tz *= corePulse;
        }
      } else if (shape === 'golden-rectangles') {
        const phiPulse = 1 + Math.sin(t * 1.618) * 0.035;
        tx *= phiPulse;
        ty *= phiPulse;
        tz *= phiPulse;
        if (g === 3 || g === 4) {
          const coreGlow = 1 + Math.sin(t * 3.5) * 0.1;
          tx *= coreGlow;
          ty *= coreGlow;
          tz *= coreGlow;
        }
      } else if (shape === 'double-helix-dna') {
        const dnaPulse = 1 + Math.sin(t * 1.5) * 0.03;
        tx *= dnaPulse;
        ty *= dnaPulse;
        tz *= dnaPulse;
        if (g === 0 || g === 1) {
          const helixFlow = Math.sin(t * 2.5 + ty * 4) * 0.02;
          tx += helixFlow * Math.cos(ty * 3 + (g === 1 ? Math.PI : 0));
          tz += helixFlow * Math.sin(ty * 3 + (g === 1 ? Math.PI : 0));
        }
      } else if (shape === 'vortex-ring') {
        const angle = Math.atan2(tz, tx);
        const swirl = Math.sin(t * 2 + angle * 3) * 0.025;
        tx += swirl * Math.cos(angle + Math.PI / 2);
        tz += swirl * Math.sin(angle + Math.PI / 2);
        if (g === 2) {
          const corePulse = 1 + Math.sin(t * 4) * 0.12;
          tx *= corePulse;
          tz *= corePulse;
        }
      } else if (shape === 'fractal-tree') {
        const sway = Math.sin(t * 0.8 + ty * 2) * 0.02;
        tx += sway;
        tz += sway * 0.5;
        if (g === 1) {
          const leafGlow = 1 + Math.sin(t * 3 + i * 0.02) * 0.1;
          tx *= leafGlow;
          ty *= leafGlow;
          tz *= leafGlow;
        }
      } else if (shape === 'wave-interference') {
        ty += Math.sin(t * 1.5) * 0.02;
        if (g <= 2) {
          const ripple = Math.sin(t * 2.2 + Math.sqrt(tx * tx + tz * tz) * 4) * 0.025;
          ty += ripple;
          tz += g === 1 ? ripple * 0.5 : 0;
        }
      } else if (shape === 'quantum-orbitals') {
        const orbitalTwist = Math.sin(t * 2.4 + i * 0.008) * 0.03;
        const radius = Math.sqrt(tx * tx + tz * tz) || 1;
        tx += orbitalTwist * (-tz / radius);
        tz += orbitalTwist * (tx / radius);
        if (g === 7) {
          const nucleusPulse = 1 + Math.sin(t * 4.2) * 0.1;
          tx *= nucleusPulse;
          ty *= nucleusPulse;
          tz *= nucleusPulse;
        } else if (g === 6) {
          const ringPulse = 1 + Math.sin(t * 3.4) * 0.06;
          tx *= ringPulse;
          ty *= ringPulse;
        }
      } else if (shape === 'celtic-knot') {
        const weave = Math.sin(t * 1.8 + i * 0.004) * 0.012;
        const angle = Math.atan2(ty, tx);
        tx += weave * Math.cos(angle);
        ty += weave * Math.sin(angle);
        if (g === 2 || g === 3) {
          const knotPulse = 1 + Math.sin(t * 3.3) * 0.09;
          tx *= knotPulse;
          ty *= knotPulse;
        }
      } else if (shape === 'starburst-nova') {
        const dist = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
        const burst = Math.sin(t * 2.6 + dist * 3) * 0.04;
        tx += burst * (tx / dist);
        ty += burst * (ty / dist);
        tz += burst * (tz / dist);
        if (g === 0 || g === 3) {
          const flash = 1 + Math.sin(t * 5 + i * 0.01) * 0.14;
          tx *= flash;
          ty *= flash;
          tz *= flash;
        }
      } else if (shape === 'lattice-wave') {
        const latticeWave = Math.sin(t * 2 + (tx + ty + tz) * 2.5) * 0.025;
        tx += latticeWave;
        ty += latticeWave * 0.8;
        tz += latticeWave * 0.6;
        if (g === 2) {
          const nodeGlow = 1 + Math.sin(t * 3.4 + i * 0.01) * 0.08;
          tx *= nodeGlow;
          ty *= nodeGlow;
          tz *= nodeGlow;
        }
      } else if (shape === 'sacred-flame') {
        const flameRise = Math.sin(t * 3 + i * 0.007) * 0.02;
        ty += Math.abs(flameRise) + (Math.sin(t * 1.2) * 0.02);
        tx += Math.sin(t * 2.4 + ty * 3) * 0.015;
        tz += Math.cos(t * 2.1 + ty * 3) * 0.015;
        if (g === 1 || g === 2) {
          const emberPulse = 1 + Math.sin(t * 4.5) * 0.12;
          tx *= emberPulse;
          ty *= emberPulse;
          tz *= emberPulse;
        }
      } else if (shape === 'vesica-piscis') {
        const pulse = 1 + Math.sin(t * 1.8) * 0.025;
        tx *= pulse;
        ty *= pulse;
        if (g === 2) {
          const gateGlow = 1 + Math.sin(t * 3.8 + Math.abs(ty) * 5) * 0.09;
          tx *= gateGlow;
          ty *= gateGlow;
        }
      } else if (shape === 'yin-yang-flow') {
        const angle = Math.atan2(ty, tx);
        const polarity = g === 0 || g === 3 ? -1 : 1;
        const phase = polarity > 0 ? 0 : Math.PI;
        const tide = Math.sin(t * 1.65 + angle * 2 + phase) * 0.02;
        tx += tide * Math.cos(angle + Math.PI / 2);
        ty += tide * Math.sin(angle + Math.PI / 2);
        if (g === 4) {
          tz += Math.sin(t * 1.4 + angle * 4) * 0.004;
        } else {
          tz += polarity * Math.sin(t * 2.2 + angle * 3 + phase) * 0.018;
          const breath = 1 + Math.sin(t * 1.35 + phase) * 0.022;
          tx *= breath;
          ty *= breath;
        }
        if (g === 2 || g === 3) {
          const seedGlow = 1 + Math.sin(t * 4.1) * 0.1;
          tx *= seedGlow;
          ty *= seedGlow;
          tz *= seedGlow;
        }
      } else if (shape === 'infinity-prayer') {
        const sweep = Math.sin(t * 2.1 + Math.abs(tx) * 4) * 0.018;
        ty += sweep;
        tz += Math.cos(t * 1.8 + Math.abs(tx) * 5) * 0.015;
        if (g === 2) {
          const knotGlow = 1 + Math.sin(t * 4.5) * 0.1;
          tx *= knotGlow;
          ty *= knotGlow;
        }
      } else if (shape === 'curved-merkaba') {
        if (g === 2) {
          const corePulse = 1 + Math.pow(Math.sin(t * 3), 2) * 0.12;
          tx *= corePulse;
          ty *= corePulse;
          tz *= corePulse;
        } else if (g === 3) {
          const halo = 1 + Math.sin(t * 2.3 + Math.atan2(ty, tx) * 3) * 0.05;
          tx *= halo;
          ty *= halo;
          tz *= 1 + Math.cos(t * 1.8 + Math.atan2(tz, tx) * 2) * 0.04;
        } else {
          const dir = g === 0 ? 1 : -1;
          const angle = dir * t * (Math.PI * 2 / 14);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx = tx * cos - tz * sin;
          const rz = tx * sin + tz * cos;
          tx = rx;
          tz = rz;
        }
      } else if (shape === 'vector-equilibrium') {
        const radius = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
        if (g === 2) {
          const nodeGlow = 1 + Math.sin(t * 4.1 + radius * 4) * 0.12;
          tx *= nodeGlow;
          ty *= nodeGlow;
          tz *= nodeGlow;
        } else {
          const breathe = 1 + Math.sin(t * 1.6) * 0.022;
          tx *= breathe;
          ty *= breathe;
          tz *= breathe;
        }
      } else if (shape === 'curved-metatron') {
        const angle = Math.atan2(ty, tx);
        const sway = Math.sin(t * 2 + angle * 6) * 0.018;
        tx += sway * Math.cos(angle);
        ty += sway * Math.sin(angle);
        if (g === 0) {
          const nodeGlow = 1 + Math.sin(t * 3.8 + i * 0.01) * 0.1;
          tx *= nodeGlow;
          ty *= nodeGlow;
        }
      } else if (shape === 'sphere-of-circles') {
        const latPulse = 1 + Math.sin(t * 1.7 + ty * 5) * 0.025;
        tx *= latPulse;
        tz *= latPulse;
      } else if (shape === 'octagram-star') {
        const burst = 1 + Math.sin(t * 2.6 + Math.atan2(ty, tx) * 4) * 0.05;
        tx *= burst;
        ty *= burst;
        if (g === 0) {
          tz += Math.sin(t * 3.8 + i * 0.02) * 0.035;
        }
      } else if (shape === 'golden-circles') {
        const ringWave = Math.sin(t * 1.618 + Math.atan2(ty, tx) * 3) * 0.016;
        tx += ringWave * Math.cos(Math.atan2(ty, tx));
        ty += ringWave * Math.sin(Math.atan2(ty, tx));
      } else if (shape === 'metatrons-cube' || shape === 'halo-bloom' || shape === 'seed-of-life' || shape === 'fruit-of-life' || shape === 'curved-metatron' || shape === 'unicursal-hexagram' || shape === 'golden-circles' || shape === 'sphere-of-circles' || shape === 'octagram-star') {
        const pulse = 1 + Math.sin(t * 2.1 + i * 0.001) * 0.035;
        tx *= pulse;
        ty *= pulse;
        if (g === 0 || g === 2) {
          const glow = 1 + Math.sin(t * 4 + i * 0.01) * 0.08;
          tx *= glow;
          ty *= glow;
        }
      } else if (shape === 'torus-flower' || shape === 'lotus-mandala' || shape === 'crown-chakra' || shape === 'egg-of-life' || shape === 'vector-equilibrium' || shape === 'snowflake-mandala' || shape === 'curved-merkaba') {
        const angle = Math.atan2(ty, tx);
        const bloom = Math.sin(t * 1.7 + angle * 4) * 0.02;
        tx += bloom * Math.cos(angle);
        ty += bloom * Math.sin(angle);
        tz += Math.sin(t * 2 + i * 0.005) * 0.015;
      } else if (shape === 'phoenix-spiral' || shape === 'cosmic-serpent' || shape === 'golden-spiral' || shape === 'seven-waves' || shape === 'caduceus') {
        const ascend = Math.sin(t * 2.5 + i * 0.006) * 0.02;
        ty += ascend;
        tx += Math.cos(t * 1.8 + ty * 2) * 0.018;
        tz += Math.sin(t * 1.6 + ty * 2) * 0.018;
      } else if (shape === 'prism-field') {
        const shimmer = Math.sin(t * 2.8 + (tx + ty + tz) * 3) * 0.022;
        tx += shimmer;
        ty += shimmer * 0.8;
        tz += shimmer * 0.6;
      }

      if (displayModeRef.current === 'diffused') {
        const radius = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
        const spread = 1.28 + Math.sin(t * 1.6 + g * 0.8) * 0.05;
        tx = (tx / radius) * radius * spread;
        ty = (ty / radius) * radius * (spread + 0.02);
        tz = (tz / radius) * radius * spread;
      }

      currentPositions[ix] += (tx - currentPositions[ix]) * 0.12;
      currentPositions[iy] += (ty - currentPositions[iy]) * 0.12;
      currentPositions[iz] += (tz - currentPositions[iz]) * 0.12;
    }

    positionAttributeRef.current.array.set(currentPositions);
    positionAttributeRef.current.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttributeRef}
          attach="attributes-position"
          args={[currentPositions, 3]}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
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
  size = 200,
  displayMode = 'idle',
}) => {
  const shape = orb.shape || 'default';
  const cameraZ = size < 96 ? 3.15 : 3.35;
  const webGLAvailable = canUseWebGL();
  const shellRadius = size < 96 ? 20 : size < 160 ? 26 : 32;
  const shellPadding = size < 96 ? 6 : 10;
  const shellStyle = {
    height: size,
    borderRadius: shellRadius,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden' as const,
    padding: shellPadding,
  };

  const renderCanvas = () => (
    <View style={[styles.shell, shellStyle]}>
      <Canvas camera={{ position: [0, 0, cameraZ] }}>
        <ambientLight intensity={0.68} />
        <pointLight position={[5, 5, 5]} intensity={0.62} />
        <OrbParticlesPreview layers={orb.layers} size={size} shape={shape} displayMode={displayMode} />
      </Canvas>
    </View>
  );

  if (Platform.OS === 'web' && !webGLAvailable) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { height: size }]}>
        <OrbFallback layers={orb.layers} size={Math.min(size, 240)} isAwakened={orb.isAwakened} />
      </View>
    );
  }
  
  if (Platform.OS === 'web') {
    return <View style={[styles.container, { height: size }]}>{renderCanvas()}</View>;
  }

  return (
    <View style={[styles.container, { height: size }]}>{renderCanvas()}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  shell: {
    width: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
