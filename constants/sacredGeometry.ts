import * as THREE from 'three';
import { LAND_CAPS, CITY_CAPS, CONTINENT_COLORS } from './earthData';

export const PARTICLE_COUNT = 20000;

// Helper: Random float in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper: Random point in unit sphere
const randomInSphere = () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 1/3); // Uniform distribution
    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
};

// --- MERKABA ---
export function generateMerkabaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); 
  // Groups: 0 = Top Tetrahedron (Gold), 1 = Bottom Tetrahedron (Silver), 2 = Core (White)

  const scale = 1.1;
  const R = 1.0 * scale;

  // Tetrahedron 1 (Pointing Up)
  // Vertices: (0, R, 0), and base triangle at y = -R/3
  const t1_v = [
    new THREE.Vector3(0, R, 0), 
    new THREE.Vector3(R * Math.sqrt(8/9), -R/3, 0),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, R * Math.sqrt(2/3)),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, -R * Math.sqrt(2/3))
  ];
  // Edges: [0,1], [0,2], [0,3], [1,2], [2,3], [3,1]
  const edges = [[0,1], [0,2], [0,3], [1,2], [2,3], [3,1]];

  // Tetrahedron 2 (Pointing Down) - Inverted T1
  const t2_v = t1_v.map(v => v.clone().multiplyScalar(-1));

  const gold = new THREE.Color("#FFD700");
  const silver = new THREE.Color("#C0C0C0");
  const white = new THREE.Color("#FFFFFF");
  const paleBlue = new THREE.Color("#AFEEEE");

  const getPointOnEdge = (vArr: THREE.Vector3[], edgeIdx: number) => {
      const idx1 = edges[edgeIdx][0];
      const idx2 = edges[edgeIdx][1];
      const t = Math.random();
      return new THREE.Vector3().lerpVectors(vArr[idx1], vArr[idx2], t);
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    // 10% Core, 45% Top, 45% Bottom
    const r = Math.random();

    if (r < 0.1) {
       // Core
       g = 2;
       p = randomInSphere().multiplyScalar(0.25); // Small solid core
       c.copy(white);
    } else if (r < 0.55) {
       // Top Tetrahedron (Gold)
       g = 0;
       // 20% Vertices, 80% Edges
       if (Math.random() < 0.2) {
          const vIdx = Math.floor(Math.random() * 4);
          p.copy(t1_v[vIdx]).add(randomInSphere().multiplyScalar(0.08)); // Glow around vertex
          c.copy(white).lerp(gold, 0.2); // Very bright
       } else {
          const eIdx = Math.floor(Math.random() * 6);
          p = getPointOnEdge(t1_v, eIdx);
          p.add(randomInSphere().multiplyScalar(0.02)); // Tight edge
          c.copy(gold);
       }
    } else {
       // Bottom Tetrahedron (Silver)
       g = 1;
       if (Math.random() < 0.2) {
          const vIdx = Math.floor(Math.random() * 4);
          p.copy(t2_v[vIdx]).add(randomInSphere().multiplyScalar(0.08));
          c.copy(paleBlue); // Blueish glow
       } else {
          const eIdx = Math.floor(Math.random() * 6);
          p = getPointOnEdge(t2_v, eIdx);
          p.add(randomInSphere().multiplyScalar(0.02));
          c.copy(silver);
       }
    }

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = g;
  }

  return { positions, colors, groups };
}

// --- SEED OF LIFE (種子之生命) ---
export function generateSeedOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const circleRadius = 0.5;
  const centers = [{ x: 0, y: 0 }];
  
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    centers.push({ x: Math.cos(angle) * circleRadius, y: Math.sin(angle) * circleRadius });
  }
  
  const white = new THREE.Color("#ffffff");
  const gold = new THREE.Color("#ffd700");
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const circleIdx = i % centers.length;
    const center = centers[circleIdx];
    const theta = Math.random() * Math.PI * 2;
    const r = circleRadius * (0.95 + Math.random() * 0.1);
    
    const px = center.x + r * Math.cos(theta);
    const py = center.y + r * Math.sin(theta);
    const pz = (Math.random() - 0.5) * 0.08;
    
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    
    const c = circleIdx === 0 ? white : new THREE.Color().lerpColors(gold, white, Math.random() * 0.3);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = circleIdx;
  }
  
  return { positions, colors, groups };
}

// --- VESICA PISCIS (維西卡魚) ---
export function generateVesicaPiscisData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const circleRadius = 0.6;
  const separation = circleRadius * 0.8;
  const paleBlue = new THREE.Color("#87ceeb");
  const white = new THREE.Color("#ffffff");
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const isLeftCircle = i < PARTICLE_COUNT / 2;
    const centerX = isLeftCircle ? -separation / 2 : separation / 2;
    
    const theta = Math.random() * Math.PI * 2;
    const r = circleRadius * (0.96 + Math.random() * 0.08);
    
    const px = centerX + r * Math.cos(theta);
    const py = r * Math.sin(theta);
    const pz = (Math.random() - 0.5) * 0.05;
    
    const distToCenter = Math.sqrt(px * px + py * py);
    const isInLens = distToCenter < circleRadius * 0.5;
    
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    
    const c = isInLens ? white : paleBlue;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = isInLens ? 1 : 0;
  }
  
  return { positions, colors, groups };
}

// --- TORUS (托魯斯環) ---
export function generateTorusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const majorRadius = 0.8;
  const minorRadius = 0.3;
  const chakraColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    
    const px = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
    const py = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
    const pz = minorRadius * Math.sin(v);
    
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    
    const colorIdx = Math.floor((u / (Math.PI * 2)) * chakraColors.length) % chakraColors.length;
    const c = new THREE.Color(chakraColors[colorIdx]);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = colorIdx;
  }
  
  return { positions, colors, groups };
}

// --- SRI YANTRA (斯里揚特拉) ---
export function generateSriYantraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const size = 1.0;
  const gold = new THREE.Color("#ffd700");
  const purple = new THREE.Color("#9400d3");
  const white = new THREE.Color("#ffffff");
  
  const triangles = [];
  for (let i = 0; i < 5; i++) {
    const s = size * (0.3 + i * 0.15);
    triangles.push({ p1: { x: 0, y: s }, p2: { x: -s * 0.866, y: -s * 0.5 }, p3: { x: s * 0.866, y: -s * 0.5 }, down: false });
  }
  for (let i = 0; i < 4; i++) {
    const s = size * (0.35 + i * 0.15);
    triangles.push({ p1: { x: 0, y: -s }, p2: { x: -s * 0.866, y: s * 0.5 }, p3: { x: s * 0.866, y: s * 0.5 }, down: true });
  }
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < 100) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.03;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(theta);
      positions[i * 3 + 2] = 0;
      colors[i * 3] = white.r;
      colors[i * 3 + 1] = white.g;
      colors[i * 3 + 2] = white.b;
      groups[i] = 2;
    } else {
      const tri = triangles[Math.floor(Math.random() * triangles.length)];
      const edge = Math.floor(Math.random() * 3);
      const t = Math.random();
      
      let A, B;
      if (edge === 0) { A = tri.p1; B = tri.p2; }
      else if (edge === 1) { A = tri.p2; B = tri.p3; }
      else { A = tri.p3; B = tri.p1; }
      
      const px = A.x + (B.x - A.x) * t;
      const py = A.y + (B.y - A.y) * t;
      
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      const c = Math.random() < 0.2 ? purple : gold;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      groups[i] = tri.down ? 1 : 0;
    }
  }
  
  return { positions, colors, groups };
}

// --- GOLDEN SPIRAL (黃金螺旋) ---
export function generateGoldenSpiralData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const phi = 1.618033988749895;
  const gold = new THREE.Color("#ffd700");
  const purple = new THREE.Color("#9400d3");
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = i / PARTICLE_COUNT;
    const angle = t * Math.PI * 8;
    const radius = t * 1.5 * Math.pow(phi, angle / (Math.PI * 2));
    
    const px = radius * Math.cos(angle);
    const py = radius * Math.sin(angle);
    const pz = (Math.random() - 0.5) * 0.1;
    
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    
    const c = new THREE.Color().lerpColors(gold, purple, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = Math.floor(t * 5);
  }
  
  return { positions, colors, groups };
}

// --- VECTOR EQUILIBRIUM (向量均衡) ---
export function generateVectorEquilibriumData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const sphereRadius = 0.15;
  const mainRadius = 0.8;
  const centers = [new THREE.Vector3(0, 0, 0)];
  const chakraColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
  const white = new THREE.Color("#ffffff");
  const purple = new THREE.Color("#9400d3");
  
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const x = mainRadius * Math.cos(angle);
    const y = mainRadius * Math.sin(angle);
    const z = (i % 2 === 0) ? 0.3 : -0.3;
    centers.push(new THREE.Vector3(x, y, z));
  }
  
  const particlesPerSphere = Math.floor(PARTICLE_COUNT * 0.7 / centers.length);
  const particlesForLines = PARTICLE_COUNT - particlesPerSphere * centers.length;
  
  let idx = 0;
  for (let s = 0; s < centers.length; s++) {
    const center = centers[s];
    const color = s === 0 ? white : new THREE.Color(chakraColors[s % chakraColors.length]);
    
    for (let p = 0; p < particlesPerSphere && idx < PARTICLE_COUNT - particlesForLines; p++) {
      const pt = randomInSphere().multiplyScalar(sphereRadius).add(center);
      positions[idx * 3] = pt.x;
      positions[idx * 3 + 1] = pt.y;
      positions[idx * 3 + 2] = pt.z;
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
      groups[idx] = s;
      idx++;
    }
  }
  
  for (let i = idx; i < PARTICLE_COUNT; i++) {
    const s1 = Math.floor(Math.random() * centers.length);
    let s2 = Math.floor(Math.random() * centers.length);
    while (s2 === s1) s2 = Math.floor(Math.random() * centers.length);
    
    const t = Math.random();
    const pt = new THREE.Vector3().lerpVectors(centers[s1], centers[s2], t);
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y;
    positions[i * 3 + 2] = pt.z;
    colors[i * 3] = purple.r;
    colors[i * 3 + 1] = purple.g;
    colors[i * 3 + 2] = purple.b;
    groups[i] = 99;
  }
  
  return { positions, colors, groups };
}

// --- METATRON'S CUBE (梅塔特隆立方) ---
export function generateMetatronsCubeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const circleRadius = 0.2;
  const centers = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.6, 0, 0),
    new THREE.Vector3(-0.6, 0, 0),
    new THREE.Vector3(0, 0.6, 0),
    new THREE.Vector3(0, -0.6, 0),
    new THREE.Vector3(0.42, 0.42, 0),
    new THREE.Vector3(-0.42, 0.42, 0),
    new THREE.Vector3(0.42, -0.42, 0),
    new THREE.Vector3(-0.42, -0.42, 0),
    new THREE.Vector3(0, 0, 0.6),
    new THREE.Vector3(0, 0, -0.6),
    new THREE.Vector3(0.3, 0.3, 0.3),
    new THREE.Vector3(-0.3, -0.3, -0.3)
  ];
  
  const white = new THREE.Color("#ffffff");
  const chakraColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
  
  const particlesForLines = Math.floor(PARTICLE_COUNT * 0.7);
  const particlesForCircles = PARTICLE_COUNT - particlesForLines;
  
  let idx = 0;
  for (; idx < particlesForLines; idx++) {
    const c1 = Math.floor(Math.random() * centers.length);
    let c2 = Math.floor(Math.random() * centers.length);
    while (c2 === c1) c2 = Math.floor(Math.random() * centers.length);
    
    const t = Math.random();
    const pt = new THREE.Vector3().lerpVectors(centers[c1], centers[c2], t);
    positions[idx * 3] = pt.x;
    positions[idx * 3 + 1] = pt.y;
    positions[idx * 3 + 2] = pt.z;
    colors[idx * 3] = white.r;
    colors[idx * 3 + 1] = white.g;
    colors[idx * 3 + 2] = white.b;
    groups[idx] = 0;
  }
  
  for (; idx < PARTICLE_COUNT; idx++) {
    const cIdx = Math.floor(Math.random() * centers.length);
    const center = centers[cIdx];
    const theta = Math.random() * Math.PI * 2;
    const r = circleRadius;
    
    const px = center.x + r * Math.cos(theta);
    const py = center.y + r * Math.sin(theta);
    const pz = center.z;
    
    positions[idx * 3] = px;
    positions[idx * 3 + 1] = py;
    positions[idx * 3 + 2] = pz;
    
    const color = new THREE.Color(chakraColors[cIdx % chakraColors.length]);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = cIdx;
  }
  
  return { positions, colors, groups };
}

// --- PLATONIC SOLIDS CYCLE (柏拉圖立體組) ---
export function generatePlatonicSolidsData(time: number = 0) {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  
  const cycleTime = (time % 50) / 10;
  const solidIndex = Math.floor(cycleTime);
  const chakraColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff"];
  const color = new THREE.Color(chakraColors[solidIndex % 5]);
  
  const vertices: THREE.Vector3[] = [];
  const edges: [number, number][] = [];
  
  if (solidIndex === 0) {
    vertices.push(
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, -1, 1)
    );
    edges.push([0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]);
  } else if (solidIndex === 1) {
    vertices.push(
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(1, -1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, 1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(-1, -1, -1)
    );
    edges.push([0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]);
  } else if (solidIndex === 2) {
    vertices.push(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    );
    edges.push([0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]);
  } else if (solidIndex === 3) {
    const phi = 1.618033988749895;
    vertices.push(
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(1, -1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, 1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(0, phi, 1 / phi),
      new THREE.Vector3(0, phi, -1 / phi),
      new THREE.Vector3(0, -phi, 1 / phi),
      new THREE.Vector3(0, -phi, -1 / phi),
      new THREE.Vector3(1 / phi, 0, phi),
      new THREE.Vector3(1 / phi, 0, -phi),
      new THREE.Vector3(-1 / phi, 0, phi),
      new THREE.Vector3(-1 / phi, 0, -phi),
      new THREE.Vector3(phi, 1 / phi, 0),
      new THREE.Vector3(phi, -1 / phi, 0),
      new THREE.Vector3(-phi, 1 / phi, 0),
      new THREE.Vector3(-phi, -1 / phi, 0)
    );
    for (let i = 0; i < 20; i++) {
      for (let j = i + 1; j < 20; j++) {
        if (vertices[i].distanceTo(vertices[j]) < 1.3) edges.push([i, j]);
      }
    }
  } else {
    const phi = 1.618033988749895;
    vertices.push(
      new THREE.Vector3(0, 1, phi),
      new THREE.Vector3(0, 1, -phi),
      new THREE.Vector3(0, -1, phi),
      new THREE.Vector3(0, -1, -phi),
      new THREE.Vector3(1, phi, 0),
      new THREE.Vector3(1, -phi, 0),
      new THREE.Vector3(-1, phi, 0),
      new THREE.Vector3(-1, -phi, 0),
      new THREE.Vector3(phi, 0, 1),
      new THREE.Vector3(phi, 0, -1),
      new THREE.Vector3(-phi, 0, 1),
      new THREE.Vector3(-phi, 0, -1)
    );
    edges.push([0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [1, 3], [1, 4], [1, 6], [1, 9], [1, 11], [2, 5], [2, 7], [2, 8], [2, 10], [3, 5], [3, 7], [3, 9], [3, 11], [4, 6], [4, 8], [4, 9], [5, 7], [5, 8], [5, 9], [6, 10], [6, 11], [7, 10], [7, 11], [8, 9], [10, 11]);
  }
  
  vertices.forEach(v => v.normalize().multiplyScalar(0.8));
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const t = Math.random();
    const pt = new THREE.Vector3().lerpVectors(vertices[edge[0]], vertices[edge[1]], t);
    
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y;
    positions[i * 3 + 2] = pt.z;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    groups[i] = solidIndex;
  }
  
  return { positions, colors, groups };
}
