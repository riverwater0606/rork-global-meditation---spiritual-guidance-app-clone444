import * as THREE from 'three';
import { LAND_CAPS, CITY_CAPS, CONTINENT_COLORS } from './earthData';

export const PARTICLE_COUNT = 20000;

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

// --- EARTH ---
// --- FLOWER OF LIFE (3D) ---
// 25 key intersection points from the sacred geometry pattern
const FLOWER_OF_LIFE_POINTS = [
  [-2.0, 0.0, 0],
  [-1.7321, -1.0, 0],
  [-1.7321, 1.0, 0],
  [-1.5, -0.866, 0],
  [-1.5, 0.866, 0],
  [-1.0, -1.7321, 0],
  [-1.0, 0.0, 0],
  [-1.0, 1.7321, 0],
  [-0.5, -0.866, 0],
  [-0.5, 0.866, 0],
  [0.0, -2.0, 0],
  [0.0, -1.7321, 0],
  [0.0, 0.0, 0],
  [0.0, 1.7321, 0],
  [0.0, 2.0, 0],
  [0.5, -0.866, 0],
  [0.5, 0.866, 0],
  [1.0, -1.7321, 0],
  [1.0, 0.0, 0],
  [1.0, 1.7321, 0],
  [1.5, -0.866, 0],
  [1.5, 0.866, 0],
  [1.7321, -1.0, 0],
  [1.7321, 1.0, 0],
  [2.0, 0.0, 0],
];

// Circle centers for the 19 interlocking circles
const FLOWER_CIRCLE_CENTERS = [
  [0, 0],           // Center
  [1, 0],           // Ring 1
  [0.5, 0.866],
  [-0.5, 0.866],
  [-1, 0],
  [-0.5, -0.866],
  [0.5, -0.866],
  [2, 0],           // Ring 2 - corners
  [1.5, 0.866],
  [1, 1.7321],
  [0, 1.7321],
  [-1, 1.7321],
  [-1.5, 0.866],
  [-2, 0],
  [-1.5, -0.866],
  [-1, -1.7321],
  [0, -1.7321],
  [1, -1.7321],
  [1.5, -0.866],
];

export function generateFlowerOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.5; // Scale down to fit in view
  const circleRadius = 1.0 * scale;
  
  // Colors: Blue to Cyan gradient
  const blue = new THREE.Color("#0066FF");
  const cyan = new THREE.Color("#00FFFF");
  const violet = new THREE.Color("#8B5CF6");
  const white = new THREE.Color("#FFFFFF");

  // Convert points to Vector3
  const keyPoints = FLOWER_OF_LIFE_POINTS.map(p => 
    new THREE.Vector3(p[0] * scale, p[1] * scale, p[2] * scale)
  );

  // Circle centers as Vector2 for circle generation
  const circleCenters = FLOWER_CIRCLE_CENTERS.map(c => ({
    x: c[0] * scale,
    y: c[1] * scale
  }));

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    const r = Math.random();

    if (r < 0.15) {
      // 15% - Key intersection points (bright nodes)
      g = 0;
      const pointIdx = Math.floor(Math.random() * keyPoints.length);
      const basePoint = keyPoints[pointIdx];
      
      // Add glow around key points
      const spread = 0.03;
      p.set(
        basePoint.x + (Math.random() - 0.5) * spread,
        basePoint.y + (Math.random() - 0.5) * spread,
        basePoint.z + (Math.random() - 0.5) * spread * 2
      );
      
      // Bright white/cyan for nodes
      c.copy(white).lerp(cyan, Math.random() * 0.3);
    } 
    else if (r < 0.85) {
      // 70% - Circle outlines (the 19 interlocking circles)
      g = 1;
      const circleIdx = Math.floor(Math.random() * circleCenters.length);
      const center = circleCenters[circleIdx];
      
      // Point on circle circumference
      const theta = Math.random() * Math.PI * 2;
      const radiusVariation = 0.98 + Math.random() * 0.04; // Slight thickness
      
      p.set(
        center.x + circleRadius * radiusVariation * Math.cos(theta),
        center.y + circleRadius * radiusVariation * Math.sin(theta),
        (Math.random() - 0.5) * 0.08 // Slight Z depth for 3D effect
      );
      
      // Blue to cyan gradient based on position
      const gradientFactor = (p.y + 1) / 2; // Normalize Y to 0-1
      c.copy(blue).lerp(cyan, gradientFactor * 0.7 + Math.random() * 0.3);
    }
    else {
      // 15% - Outer boundary circle (the enclosing circle)
      g = 2;
      const outerRadius = 2.2 * scale;
      const theta = Math.random() * Math.PI * 2;
      const radiusVariation = 0.97 + Math.random() * 0.06;
      
      p.set(
        outerRadius * radiusVariation * Math.cos(theta),
        outerRadius * radiusVariation * Math.sin(theta),
        (Math.random() - 0.5) * 0.05
      );
      
      // Violet/blue for outer ring
      c.copy(violet).lerp(blue, Math.random() * 0.5);
    }

    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = g;
  }

  return { positions, colors, groups };
}

export function generateEarthData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  
  // Precompute vectors for caps
  const landNodes = LAND_CAPS.map(c => ({
      v: new THREE.Vector3().setFromSphericalCoords(1, (90 - c.lat) * Math.PI/180, (c.lon + 180) * Math.PI/180),
      // Use cosine of radius. Stricter boundary.
      minDot: Math.cos(c.r * Math.PI / 180) 
  }));

  const cityNodes = CITY_CAPS.map(c => ({
      v: new THREE.Vector3().setFromSphericalCoords(1, (90 - c.lat) * Math.PI/180, (c.lon + 180) * Math.PI/180),
      minDot: Math.cos(c.r * Math.PI / 180),
      color: new THREE.Color(c.color)
  }));

  // Sun direction (Left lit) - Softened for ambient feel since we rotate the earth
  // const sunDir = new THREE.Vector3(-1, 0.2, 0.5).normalize(); // Removed hard sun to avoid rotating shadows

  // Noise for clouds
  const isCloud = (p: THREE.Vector3) => {
     // Simple spatial noise
     const s = 4.0;
     const n = Math.sin(p.x*s) * Math.sin(p.y*s*1.5 + p.z*2) * Math.cos(p.z*s);
     return n > 0.4;
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let p = new THREE.Vector3();
     let c = new THREE.Color();
     let g = 0;
     
     // Rejection sampling for better distribution
     let found = false;
     let attempts = 0;

     while (!found && attempts < 15) { // Increased attempts
        attempts++;
        p = randomInSphere().normalize().multiplyScalar(R);

        // 1. Clouds (Floating) - 20% of particles (Increased for realism)
        if (i < PARTICLE_COUNT * 0.20) {
           if (isCloud(p)) {
              p.multiplyScalar(1.06); // Float above
              c.set(CONTINENT_COLORS.cloud);
              c.multiplyScalar(0.8); // Transparent
              found = true;
              continue;
           }
        }

        // 2. Check Land
        let landDot = -1;
        for (const node of landNodes) {
           // Add noise to the radius check to fuzz edges (Fix for "Square/Blocky" look)
           const edgeNoise = (Math.random() - 0.5) * 0.02;
           const d = p.dot(node.v);
           if (d > node.minDot + edgeNoise) {
              if (d > landDot) landDot = d; // Max overlap
           }
        }
        
        // Determine Day/Night - REMOVED BAKED SHADOWS (User complained about separation line)
        // Instead we use a subtle gradient based on Y to give depth without rotating shadows
        const isLand = landDot > -1;
        
        // Mock latitude lighting (poles darker)
        const poleFactor = 1.0 - Math.abs(p.y) * 0.3;

        if (isLand) {
           // Land
           c.set(CONTINENT_COLORS.land).multiplyScalar(poleFactor);
           
           // Cities (Always visible but subtle)
           let isCity = false;
           for (const city of cityNodes) {
              if (p.dot(city.v) > city.minDot) {
                 isCity = true;
                 break;
              }
           }
           
           // Day Land
           if (isCity && Math.random() < 0.3) { // 30% of city area has lights even in day (reflection?) or just style
               c.set(CONTINENT_COLORS.city);
           }
           
           // Ice caps
           if (Math.abs(p.y) > 0.9) c.set(CONTINENT_COLORS.ice);
           
           found = true; 
        } else {
           // Ocean
           // Reduce ocean density to make land pop, but kept higher than before (0.6 -> 0.4 skip)
           // Fix "Very empty side" issue
           if (Math.random() > 0.55) { // Skip 55% of ocean points -> Land is 2x denser
               continue; 
           }
           
           // Deep Ocean Color with variation
           c.set(CONTINENT_COLORS.ocean).multiplyScalar(poleFactor * (0.8 + Math.random() * 0.4));
           
           found = true;
        }
     }
     
     // Fallback
     if (!found) {
        p = randomInSphere().normalize().multiplyScalar(R);
        c.set(CONTINENT_COLORS.ocean).multiplyScalar(0.5);
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
