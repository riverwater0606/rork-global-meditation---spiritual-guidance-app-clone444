import * as THREE from "three";
import {
  generateMerkabaData, generateEarthData, generateFlowerOfLifeData, generateFlowerOfLifeCompleteData, generateTreeOfLifeData,
  generateGridOfLifeData, generateSriYantraData, generateStarOfDavidData, generateTriquetraData, generateGoldenRectanglesData,
  generateDoubleHelixDNAData, generateVortexRingData, generateFractalTreeData, generateWaveInterferenceData,
  generateQuantumOrbitalsData, generateCelticKnotData, generateStarburstNovaData, generateLatticeWaveData,
  generateSacredFlameData, PARTICLE_COUNT
} from "@/constants/sacredGeometry";
import { OrbShape } from "@/providers/MeditationProvider";

export function generateOrbParticleData(layers: string[], shape: OrbShape) {
  const particleCount = PARTICLE_COUNT;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const targetPositions = new Float32Array(particleCount * 3);
  const heartPositions = new Float32Array(particleCount * 3);
  const groups = new Float32Array(particleCount);
  const colorObjects = layers.length ? layers.map((c) => new THREE.Color(c)) : [new THREE.Color("#fff")];

  const map: Record<string, any> = {
    "flower-of-life": generateFlowerOfLifeData,
    "flower-of-life-complete": generateFlowerOfLifeCompleteData,
    "star-of-david": generateStarOfDavidData,
    merkaba: generateMerkabaData,
    "tree-of-life": generateTreeOfLifeData,
    "grid-of-life": generateGridOfLifeData,
    "sri-yantra": generateSriYantraData,
    triquetra: generateTriquetraData,
    "golden-rectangles": generateGoldenRectanglesData,
    "double-helix-dna": generateDoubleHelixDNAData,
    "vortex-ring": generateVortexRingData,
    "fractal-tree": generateFractalTreeData,
    "wave-interference": generateWaveInterferenceData,
    "quantum-orbitals": generateQuantumOrbitalsData,
    "celtic-knot": generateCelticKnotData,
    "starburst-nova": generateStarburstNovaData,
    "lattice-wave": generateLatticeWaveData,
    "sacred-flame": generateSacredFlameData,
    earth: generateEarthData,
  };

  const generator = map[shape];
  if (generator) {
    const data = generator();
    targetPositions.set(data.positions);
    colors.set(data.colors);
    groups.set(data.groups);
  }

  for (let i = 0; i < particleCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.random() * 0.2;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const heartT = (i / particleCount) * Math.PI * 2;
    heartPositions[i * 3] = 1.5 * 16 * Math.sin(heartT) ** 3 / 17;
    heartPositions[i * 3 + 1] = 1.5 * (13 * Math.cos(heartT) - 5 * Math.cos(2 * heartT) - 2 * Math.cos(3 * heartT) - Math.cos(4 * heartT)) / 17;
    heartPositions[i * 3 + 2] = 0;

    if (colors[i * 3] === 0 && colors[i * 3 + 1] === 0 && colors[i * 3 + 2] === 0) {
      const c = colorObjects[Math.floor(Math.random() * colorObjects.length)] || new THREE.Color("#fff");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
  }

  return { positions, colors, targetPositions, heartPositions, groups };
}
