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

// --- FLOWER OF LIFE (3D) ---
// True sacred geometry: 19 interlocking circles forming the cosmic pattern
// Each circle has radius 1, centers are at distance 1 from neighbors

export function generateFlowerOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.42;
  const circleRadius = 1.0 * scale;
  
  // Sacred blue-cyan palette
  const deepBlue = new THREE.Color("#0EA5E9");
  const royalBlue = new THREE.Color("#3B82F6");
  const cyan = new THREE.Color("#22D3EE");
  const lightCyan = new THREE.Color("#67E8F9");
  const white = new THREE.Color("#FFFFFF");

  // Generate all 19 circle centers for perfect Flower of Life
  const circleCenters: { x: number; y: number; ring: number }[] = [];
  const r = circleRadius;
  
  // Center circle (ring 0)
  circleCenters.push({ x: 0, y: 0, ring: 0 });
  
  // First ring: 6 circles (ring 1)
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    circleCenters.push({ 
      x: r * Math.cos(angle), 
      y: r * Math.sin(angle),
      ring: 1
    });
  }
  
  // Second ring: 6 circles at corners (ring 2)
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    circleCenters.push({ 
      x: 2 * r * Math.cos(angle), 
      y: 2 * r * Math.sin(angle),
      ring: 2
    });
  }
  
  // Second ring: 6 circles in between (ring 2)
  const sqrt3 = Math.sqrt(3);
  for (let i = 0; i < 6; i++) {
    const angle = (30 + i * 60) * Math.PI / 180;
    circleCenters.push({ 
      x: sqrt3 * r * Math.cos(angle), 
      y: sqrt3 * r * Math.sin(angle),
      ring: 2
    });
  }

  // Calculate intersection points for glow nodes
  const intersectionPoints: THREE.Vector3[] = [];
  intersectionPoints.push(new THREE.Vector3(0, 0, 0));
  
  for (let i = 0; i < circleCenters.length; i++) {
    for (let j = i + 1; j < circleCenters.length; j++) {
      const c1 = circleCenters[i];
      const c2 = circleCenters[j];
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      
      if (d < 2 * circleRadius * 1.01 && d > 0.01) {
        const a = d / 2;
        const hSq = circleRadius * circleRadius - a * a;
        if (hSq > 0) {
          const h = Math.sqrt(hSq);
          const mx = (c1.x + c2.x) / 2;
          const my = (c1.y + c2.y) / 2;
          const perpX = -dy / d;
          const perpY = dx / d;
          intersectionPoints.push(new THREE.Vector3(mx + h * perpX, my + h * perpY, 0));
          intersectionPoints.push(new THREE.Vector3(mx - h * perpX, my - h * perpY, 0));
        }
      }
    }
  }

  // Particle distribution
  const circleParticles = Math.floor(PARTICLE_COUNT * 0.70); // 70% for circle outlines
  const intersectionParticles = Math.floor(PARTICLE_COUNT * 0.12); // 12% for intersections
  const outerCircleParticles = Math.floor(PARTICLE_COUNT * 0.10); // 10% for outer circle
  
  const particlesPerCircle = Math.floor(circleParticles / circleCenters.length);
  const outerRadius = 2.15 * circleRadius;
  
  let idx = 0;

  // 1. Draw each of the 19 circles with many particles on circumference
  for (let c = 0; c < circleCenters.length; c++) {
    const center = circleCenters[c];
    const zOffset = (center.ring === 0 ? 0.02 : center.ring === 1 ? 0.01 : 0) * (Math.random() > 0.5 ? 1 : -1);
    
    for (let i = 0; i < particlesPerCircle && idx < circleParticles; i++, idx++) {
      // Distribute evenly around circle with slight randomness
      const baseAngle = (i / particlesPerCircle) * Math.PI * 2;
      const angleJitter = (Math.random() - 0.5) * 0.05;
      const theta = baseAngle + angleJitter;
      
      // Very tight line with minimal thickness
      const radiusJitter = (Math.random() - 0.5) * 0.008;
      const finalRadius = circleRadius + radiusJitter;
      
      const x = center.x + finalRadius * Math.cos(theta);
      const y = center.y + finalRadius * Math.sin(theta);
      const z = zOffset + (Math.random() - 0.5) * 0.015;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Color gradient: center = royal blue, outer = cyan/light cyan
      const distFromOrigin = Math.sqrt(x * x + y * y);
      const t = Math.min(distFromOrigin / (outerRadius * 0.9), 1);
      
      const color = new THREE.Color();
      color.copy(royalBlue).lerp(cyan, t * 0.7);
      color.lerp(lightCyan, t * 0.3);
      color.lerp(white, Math.random() * 0.1); // Subtle sparkle
      
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
      groups[idx] = 1;
    }
  }

  // 2. Intersection glow points (sacred nodes)
  const particlesPerIntersection = Math.max(1, Math.floor(intersectionParticles / intersectionPoints.length));
  for (let p = 0; p < intersectionPoints.length && idx < circleParticles + intersectionParticles; p++) {
    const point = intersectionPoints[p];
    
    for (let i = 0; i < particlesPerIntersection && idx < circleParticles + intersectionParticles; i++, idx++) {
      const spread = 0.018;
      const x = point.x + (Math.random() - 0.5) * spread;
      const y = point.y + (Math.random() - 0.5) * spread;
      const z = point.z + (Math.random() - 0.5) * 0.02;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Bright white/cyan glow
      const color = new THREE.Color();
      color.copy(white).lerp(lightCyan, Math.random() * 0.3);
      
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
      groups[idx] = 0;
    }
  }

  // 3. Outer enclosing circle
  for (let i = 0; i < outerCircleParticles && idx < circleParticles + intersectionParticles + outerCircleParticles; i++, idx++) {
    const baseAngle = (i / outerCircleParticles) * Math.PI * 2;
    const angleJitter = (Math.random() - 0.5) * 0.03;
    const theta = baseAngle + angleJitter;
    
    const radiusJitter = (Math.random() - 0.5) * 0.006;
    const finalRadius = outerRadius + radiusJitter;
    
    positions[idx * 3] = finalRadius * Math.cos(theta);
    positions[idx * 3 + 1] = finalRadius * Math.sin(theta);
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.01;
    
    const color = new THREE.Color();
    color.copy(deepBlue).lerp(royalBlue, 0.4);
    color.lerp(cyan, Math.random() * 0.2);
    
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 2;
  }

  // 4. Faint connection lines between nearby intersections
  for (; idx < PARTICLE_COUNT; idx++) {
    // Pick two random intersection points that are close
    const p1Idx = Math.floor(Math.random() * intersectionPoints.length);
    let p2Idx = Math.floor(Math.random() * intersectionPoints.length);
    if (p2Idx === p1Idx) p2Idx = (p1Idx + 1) % intersectionPoints.length;
    
    const p1 = intersectionPoints[p1Idx];
    const p2 = intersectionPoints[p2Idx];
    
    const dist = p1.distanceTo(p2);
    if (dist > circleRadius * 1.5) {
      // Too far, just place randomly on a circle
      const circleIdx = Math.floor(Math.random() * circleCenters.length);
      const center = circleCenters[circleIdx];
      const theta = Math.random() * Math.PI * 2;
      positions[idx * 3] = center.x + circleRadius * Math.cos(theta);
      positions[idx * 3 + 1] = center.y + circleRadius * Math.sin(theta);
      positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.02;
    } else {
      // Draw along connection line
      const t = Math.random();
      positions[idx * 3] = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 0.01;
      positions[idx * 3 + 1] = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 0.01;
      positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.015;
    }
    
    // Faint cyan connection color
    const color = new THREE.Color();
    color.copy(cyan).lerp(white, 0.2);
    color.multiplyScalar(0.5); // Faint
    
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 3;
  }

  return { positions, colors, groups };
}

// --- FLOWER OF LIFE COMPLETE (3D) ---
// 19 interlocking circles + outer ring.
// Explicitly draws 19 full circles to ensure complete petals at the edge.
export function generateFlowerOfLifeCompleteData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.35; 
  const R = 1.0 * scale; // Radius of each small circle
  const boundaryR = 3.0 * R; // Enclosing circle radius

  // Colors
  const deepBlue = new THREE.Color("#0EA5E9");
  const cyan = new THREE.Color("#22D3EE");
  const lightCyan = new THREE.Color("#A5F3FC");
  const white = new THREE.Color("#FFFFFF");

  // Explicit 19 centers for the Flower of Life
  const centers: {x: number, y: number}[] = [];
  
  // 1. Center
  centers.push({x: 0, y: 0});
  
  // 2. Ring 1 (6 circles at distance R)
  for(let i=0; i<6; i++) {
     const theta = i * Math.PI / 3;
     centers.push({ x: R * Math.cos(theta), y: R * Math.sin(theta) });
  }

  // 3. Ring 2 (12 circles)
  // 6 at distance 2R (on axes)
  for(let i=0; i<6; i++) {
     const theta = i * Math.PI / 3;
     centers.push({ x: 2 * R * Math.cos(theta), y: 2 * R * Math.sin(theta) });
  }
  // 6 at distance sqrt(3)R (in between)
  for(let i=0; i<6; i++) {
     const theta = i * Math.PI / 3 + Math.PI / 6;
     const rGrid = Math.sqrt(3) * R;
     centers.push({ x: rGrid * Math.cos(theta), y: rGrid * Math.sin(theta) });
  }

  let idx = 0;

  // 1. Draw 19 Circles (Full complete petals)
  // 75% of particles for the circles
  const circleParticlesTotal = Math.floor(PARTICLE_COUNT * 0.75);
  const particlesPerCircle = Math.floor(circleParticlesTotal / centers.length);
  
  for(let c=0; c<centers.length; c++) {
    const center = centers[c];
    for(let i=0; i<particlesPerCircle && idx < PARTICLE_COUNT; i++) {
        const theta = (i/particlesPerCircle) * Math.PI * 2;
        // Add slight jitter for "particle" look
        const rJitter = (Math.random()-0.5) * 0.015;
        const x = center.x + (R + rJitter) * Math.cos(theta);
        const y = center.y + (R + rJitter) * Math.sin(theta);
        const z = (Math.random()-0.5) * 0.04; // Thickness

        positions[idx*3] = x;
        positions[idx*3+1] = y;
        positions[idx*3+2] = z;

        // Color
        const color = new THREE.Color().copy(deepBlue).lerp(cyan, Math.random() * 0.8);
        // Glow effect for some particles
        if(Math.random() < 0.05) color.lerp(white, 0.6);

        colors[idx*3] = color.r;
        colors[idx*3+1] = color.g;
        colors[idx*3+2] = color.b;
        groups[idx] = 1; // Circle group
        idx++;
    }
  }

  // 2. Draw Outer Circle (Enclosing)
  // 15% of particles
  const outerParticles = Math.floor(PARTICLE_COUNT * 0.15);
  for(let i=0; i<outerParticles && idx < PARTICLE_COUNT; i++) {
     const angle = Math.random() * Math.PI * 2;
     const rJitter = (Math.random()-0.5) * 0.01;
     const x = (boundaryR + rJitter) * Math.cos(angle);
     const y = (boundaryR + rJitter) * Math.sin(angle);
     const z = (Math.random()-0.5) * 0.04;

     positions[idx*3] = x;
     positions[idx*3+1] = y;
     positions[idx*3+2] = z;

     const color = new THREE.Color().copy(cyan).lerp(lightCyan, 0.5 + Math.random()*0.5);
     colors[idx*3] = color.r;
     colors[idx*3+1] = color.g;
     colors[idx*3+2] = color.b;
     groups[idx] = 2; // Outer group
     idx++;
  }

  // 3. Fill remaining with ambient sparkles inside
  while(idx < PARTICLE_COUNT) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * boundaryR;
      
      positions[idx*3] = r * Math.cos(theta);
      positions[idx*3+1] = r * Math.sin(theta);
      positions[idx*3+2] = (Math.random()-0.5) * 0.2;
      
      const color = new THREE.Color().copy(deepBlue).multiplyScalar(0.3);
      colors[idx*3] = color.r;
      colors[idx*3+1] = color.g;
      colors[idx*3+2] = color.b;
      groups[idx] = 3;
      idx++;
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

// --- TREE OF LIFE (Kabbalah) ---
// 10 Sephiroth spheres connected by 22 paths
// Represents the cosmic blueprint and spiritual evolution

const SEPHIROTH_POSITIONS = [
  { name: 'Kether', x: 0, y: 1.6, pillar: 'middle', color: '#FFFFFF' },      // Crown - Top
  { name: 'Chokmah', x: 0.6, y: 1.1, pillar: 'right', color: '#87CEEB' },   // Wisdom
  { name: 'Binah', x: -0.6, y: 1.1, pillar: 'left', color: '#4B0082' },     // Understanding
  { name: 'Chesed', x: 0.6, y: 0.5, pillar: 'right', color: '#4169E1' },    // Mercy
  { name: 'Geburah', x: -0.6, y: 0.5, pillar: 'left', color: '#DC143C' },   // Severity
  { name: 'Tiphereth', x: 0, y: 0.3, pillar: 'middle', color: '#FFD700' },  // Beauty - Center
  { name: 'Netzach', x: 0.6, y: -0.3, pillar: 'right', color: '#00FF7F' },  // Victory
  { name: 'Hod', x: -0.6, y: -0.3, pillar: 'left', color: '#FF8C00' },      // Glory
  { name: 'Yesod', x: 0, y: -0.9, pillar: 'middle', color: '#9370DB' },     // Foundation
  { name: 'Malkuth', x: 0, y: -1.6, pillar: 'middle', color: '#228B22' },   // Kingdom - Bottom
];

// 22 Paths connecting the Sephiroth (traditional Kabbalistic paths)
const TREE_PATHS = [
  [0, 1], [0, 2], [0, 5],           // Kether connections
  [1, 2], [1, 3], [1, 5],           // Chokmah connections
  [2, 4], [2, 5],                   // Binah connections
  [3, 4], [3, 5], [3, 6],           // Chesed connections
  [4, 5], [4, 7],                   // Geburah connections
  [5, 6], [5, 7], [5, 8],           // Tiphereth connections (center hub)
  [6, 7], [6, 8],                   // Netzach connections
  [7, 8],                           // Hod to Yesod
  [8, 9],                           // Yesod to Malkuth
];

// --- GRID OF LIFE (64 Tetrahedron) ---
// The 64 Tetrahedron Grid is a fundamental structure of the vacuum geometry
// It represents where space converges over time - the matrix of creation

const generateGridVertices = () => {
  const vertices: THREE.Vector3[] = [];
  const scale = 0.35;
  
  // 64 Tetrahedron grid forms from overlapping star tetrahedra
  // Create a 3D grid of vertices that define the tetrahedra
  
  // Core vertices - center structure
  const h = Math.sqrt(2/3); // Height ratio for tetrahedron
  const levels = 4;
  
  // Generate vertices in a layered structure
  for (let layer = -levels; layer <= levels; layer++) {
    const y = layer * h * 0.5 * scale;
    const layerOffset = Math.abs(layer) % 2 === 0 ? 0 : 0.5;
    const radius = (levels - Math.abs(layer) * 0.3) * scale;
    
    // Hexagonal arrangement at each layer
    const pointsInLayer = Math.max(1, 6 * (levels - Math.abs(layer)));
    for (let i = 0; i < pointsInLayer; i++) {
      const angle = (i / pointsInLayer) * Math.PI * 2 + layerOffset;
      const r = radius * (0.3 + (i % 3) * 0.3);
      vertices.push(new THREE.Vector3(
        r * Math.cos(angle),
        y,
        r * Math.sin(angle)
      ));
    }
  }
  
  // Add central axis vertices
  for (let i = -3; i <= 3; i++) {
    vertices.push(new THREE.Vector3(0, i * 0.3 * scale, 0));
  }
  
  // Add octahedral frame vertices
  const octaScale = 1.2 * scale;
  vertices.push(new THREE.Vector3(octaScale, 0, 0));
  vertices.push(new THREE.Vector3(-octaScale, 0, 0));
  vertices.push(new THREE.Vector3(0, octaScale, 0));
  vertices.push(new THREE.Vector3(0, -octaScale, 0));
  vertices.push(new THREE.Vector3(0, 0, octaScale));
  vertices.push(new THREE.Vector3(0, 0, -octaScale));
  
  return vertices;
};

const generateTetrahedronEdges = (vertices: THREE.Vector3[]) => {
  const edges: [THREE.Vector3, THREE.Vector3][] = [];
  const threshold = 0.45; // Connect vertices within this distance
  
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dist = vertices[i].distanceTo(vertices[j]);
      if (dist < threshold && dist > 0.05) {
        edges.push([vertices[i], vertices[j]]);
      }
    }
  }
  
  return edges;
};

export function generateGridOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const vertices = generateGridVertices();
  const edges = generateTetrahedronEdges(vertices);
  
  // Color palette - cosmic purples, cyans, golds
  const deepPurple = new THREE.Color('#4C1D95');
  const violet = new THREE.Color('#7C3AED');
  const cyan = new THREE.Color('#22D3EE');
  const gold = new THREE.Color('#F59E0B');
  const white = new THREE.Color('#FFFFFF');
  const magenta = new THREE.Color('#EC4899');

  const vertexCount = Math.floor(PARTICLE_COUNT * 0.15);
  const edgeCount = Math.floor(PARTICLE_COUNT * 0.55);
  const innerGridCount = Math.floor(PARTICLE_COUNT * 0.20);
  
  let idx = 0;

  // 1. Vertex nodes (glowing intersection points)
  const particlesPerVertex = Math.floor(vertexCount / vertices.length);
  for (let v = 0; v < vertices.length && idx < vertexCount; v++) {
    const vertex = vertices[v];
    const nodeRadius = 0.04;
    
    for (let i = 0; i < particlesPerVertex && idx < vertexCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * nodeRadius;
      
      positions[idx * 3] = vertex.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = vertex.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = vertex.z + r * Math.cos(phi);
      
      // Distance from center affects color
      const distFromCenter = vertex.length();
      const c = white.clone().lerp(gold, distFromCenter * 1.5);
      c.lerp(cyan, Math.random() * 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 0;
    }
  }

  // 2. Edge lines (tetrahedron framework)
  const particlesPerEdge = Math.floor(edgeCount / Math.max(edges.length, 1));
  for (let e = 0; e < edges.length && idx < vertexCount + edgeCount; e++) {
    const [start, end] = edges[e];
    
    for (let i = 0; i < particlesPerEdge && idx < vertexCount + edgeCount; i++, idx++) {
      const t = Math.random();
      const thickness = 0.008;
      
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * thickness;
      const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * thickness;
      const z = start.z + (end.z - start.z) * t + (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Gradient from start to end color based on position
      const c = violet.clone().lerp(cyan, t);
      c.lerp(magenta, Math.sin(t * Math.PI) * 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  // 3. Inner tetrahedra structure (64 small tetrahedra visualization)
  const innerScale = 0.25;
  for (; idx < vertexCount + edgeCount + innerGridCount; idx++) {
    // Create small tetrahedra distributed in the grid
    const gridX = (Math.random() - 0.5) * 2 * innerScale;
    const gridY = (Math.random() - 0.5) * 2 * innerScale;
    const gridZ = (Math.random() - 0.5) * 2 * innerScale;
    
    // Snap to tetrahedron structure
    const tetraSize = 0.08;
    const tx = Math.round(gridX / tetraSize) * tetraSize;
    const ty = Math.round(gridY / tetraSize) * tetraSize;
    const tz = Math.round(gridZ / tetraSize) * tetraSize;
    
    positions[idx * 3] = tx + (Math.random() - 0.5) * 0.02;
    positions[idx * 3 + 1] = ty + (Math.random() - 0.5) * 0.02;
    positions[idx * 3 + 2] = tz + (Math.random() - 0.5) * 0.02;
    
    const c = deepPurple.clone().lerp(violet, Math.random());
    c.lerp(white, 0.2);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  // 4. Outer spherical boundary (vastness of space)
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.9 + Math.random() * 0.15;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    // Faint cosmic dust
    const c = deepPurple.clone().lerp(cyan, Math.random() * 0.4);
    c.multiplyScalar(0.4 + Math.random() * 0.3);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 3;
  }

  return { positions, colors, groups };
}

export function generateTreeOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.7;
  
  // Scale sephiroth positions
  const sephiroth = SEPHIROTH_POSITIONS.map(s => ({
    ...s,
    x: s.x * scale,
    y: s.y * scale,
    color: new THREE.Color(s.color)
  }));

  // Color palette
  const white = new THREE.Color('#FFFFFF');
  const gold = new THREE.Color('#FFD700');
  const pathColor = new THREE.Color('#ADD8E6');

  const sphereCount = Math.floor(PARTICLE_COUNT * 0.30);
  const pathCount = Math.floor(PARTICLE_COUNT * 0.60);

  let idx = 0;

  // 1. Sephiroth Spheres (10 spheres)
  const particlesPerSphere = Math.floor(sphereCount / sephiroth.length);
  
  for (let s = 0; s < sephiroth.length; s++) {
    const seph = sephiroth[s];
    const sphereRadius = 0.12;
    
    for (let i = 0; i < particlesPerSphere && idx < sphereCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 1/3) * sphereRadius;
      
      const x = seph.x + r * Math.sin(phi) * Math.cos(theta);
      const y = seph.y + r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const distFromCenter = Math.sqrt((x - seph.x) ** 2 + (y - seph.y) ** 2 + z ** 2);
      const brightness = 1.0 - (distFromCenter / (sphereRadius * sphereRadius)) * 0.5;
      
      const c = seph.color.clone();
      c.lerp(white, brightness * 0.4);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      
      groups[idx] = s;
    }
  }

  // 2. Paths (22 connecting lines)
  const particlesPerPath = Math.floor(pathCount / TREE_PATHS.length);
  
  for (let p = 0; p < TREE_PATHS.length; p++) {
    const [idx1, idx2] = TREE_PATHS[p];
    const start = sephiroth[idx1];
    const end = sephiroth[idx2];
    
    for (let i = 0; i < particlesPerPath && idx < sphereCount + pathCount; i++, idx++) {
      const t = Math.random();
      const thickness = 0.015;
      
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * thickness;
      const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * thickness;
      const z = (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const c = start.color.clone().lerp(end.color, t);
      c.lerp(pathColor, 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      
      groups[idx] = 10 + p;
    }
  }

  // 3. Ambient glow around entire tree
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2 + Math.random() * 0.5;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const c = white.clone().lerp(gold, Math.random() * 0.3);
    c.multiplyScalar(0.3 + Math.random() * 0.2);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    
    groups[idx] = 32;
  }

  return { positions, colors, groups };
}

// --- SRI YANTRA ---
// 9 interlocking triangles (4 upward, 5 downward) surrounding the bindu
// Represents union of masculine and feminine energies, cosmic creation

const SRI_YANTRA_TRIANGLES = [
  // 4 Upward triangles (Shiva - masculine)
  [
    { x: 0, y: 0.95 },
    { x: -0.85, y: -0.55 },
    { x: 0.85, y: -0.55 }
  ],
  [
    { x: 0, y: 0.7 },
    { x: -0.65, y: -0.35 },
    { x: 0.65, y: -0.35 }
  ],
  [
    { x: 0, y: 0.45 },
    { x: -0.45, y: -0.2 },
    { x: 0.45, y: -0.2 }
  ],
  [
    { x: 0, y: 0.25 },
    { x: -0.25, y: -0.1 },
    { x: 0.25, y: -0.1 }
  ],
  // 5 Downward triangles (Shakti - feminine)
  [
    { x: 0, y: -0.95 },
    { x: -0.8, y: 0.5 },
    { x: 0.8, y: 0.5 }
  ],
  [
    { x: 0, y: -0.65 },
    { x: -0.6, y: 0.3 },
    { x: 0.6, y: 0.3 }
  ],
  [
    { x: 0, y: -0.4 },
    { x: -0.42, y: 0.15 },
    { x: 0.42, y: 0.15 }
  ],
  [
    { x: 0, y: -0.2 },
    { x: -0.28, y: 0.08 },
    { x: 0.28, y: 0.08 }
  ],
  [
    { x: 0, y: -0.08 },
    { x: -0.15, y: 0.03 },
    { x: 0.15, y: 0.03 }
  ],
];

// --- STAR OF DAVID (Magen David) ---
// Two interlocking equilateral triangles forming a hexagram
// Represents harmony between divine and human, masculine and feminine
// The six points symbolize the six days of creation

export function generateStarOfDavidData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 1.0;
  const R = 1.2 * scale;
  
  // Refined sacred palette - elegant blues and golds
  const deepBlue = new THREE.Color('#1E40AF');
  const royalBlue = new THREE.Color('#3B82F6');
  const skyBlue = new THREE.Color('#0EA5E9');
  const lightBlue = new THREE.Color('#7DD3FC');
  const gold = new THREE.Color('#FBBF24');
  const paleGold = new THREE.Color('#FDE68A');
  const white = new THREE.Color('#FFFFFF');

  // Triangle 1: Pointing UP (Divine, Masculine)
  const t1_vertices = [
    { x: 0, y: R },
    { x: R * Math.cos(210 * Math.PI / 180), y: R * Math.sin(210 * Math.PI / 180) },
    { x: R * Math.cos(330 * Math.PI / 180), y: R * Math.sin(330 * Math.PI / 180) }
  ];

  // Triangle 2: Pointing DOWN (Earthly, Feminine)
  const t2_vertices = [
    { x: 0, y: -R },
    { x: R * Math.cos(30 * Math.PI / 180), y: R * Math.sin(30 * Math.PI / 180) },
    { x: R * Math.cos(150 * Math.PI / 180), y: R * Math.sin(150 * Math.PI / 180) }
  ];



  const edgeCount = Math.floor(PARTICLE_COUNT * 0.55);
  const vertexCount = Math.floor(PARTICLE_COUNT * 0.25);
  const centerCount = Math.floor(PARTICLE_COUNT * 0.08);
  
  let idx = 0;

  // 1. Triangle Edges - Clean, prominent lines
  const particlesPerEdge = Math.floor(edgeCount / 6);
  
  // Upward Triangle (Blue tones)
  for (let e = 0; e < 3; e++) {
    const v1 = t1_vertices[e];
    const v2 = t1_vertices[(e + 1) % 3];
    
    for (let i = 0; i < particlesPerEdge && idx < edgeCount; i++, idx++) {
      const t = i / particlesPerEdge;
      const thickness = 0.012;
      
      const x = v1.x + (v2.x - v1.x) * t + (Math.random() - 0.5) * thickness;
      const y = v1.y + (v2.y - v1.y) * t + (Math.random() - 0.5) * thickness;
      const z = 0.06 + (Math.random() - 0.5) * 0.015;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Smooth blue gradient
      const c = skyBlue.clone().lerp(lightBlue, Math.sin(t * Math.PI));
      c.lerp(white, Math.random() * 0.12);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 0;
    }
  }
  
  // Downward Triangle (Gold tones)
  for (let e = 0; e < 3; e++) {
    const v1 = t2_vertices[e];
    const v2 = t2_vertices[(e + 1) % 3];
    
    for (let i = 0; i < particlesPerEdge && idx < edgeCount; i++, idx++) {
      const t = i / particlesPerEdge;
      const thickness = 0.012;
      
      const x = v1.x + (v2.x - v1.x) * t + (Math.random() - 0.5) * thickness;
      const y = v1.y + (v2.y - v1.y) * t + (Math.random() - 0.5) * thickness;
      const z = -0.06 + (Math.random() - 0.5) * 0.015;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Smooth gold gradient
      const c = gold.clone().lerp(paleGold, Math.sin(t * Math.PI));
      c.lerp(white, Math.random() * 0.12);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  // 2. Vertex nodes - Radiant star points
  const particlesPerVertex = Math.floor(vertexCount / 6);
  const allVertices = [...t1_vertices, ...t2_vertices];
  
  for (let v = 0; v < 6 && idx < edgeCount + vertexCount; v++) {
    const vertex = allVertices[v];
    const nodeRadius = 0.10;
    const isUpward = v < 3;
    
    for (let i = 0; i < particlesPerVertex && idx < edgeCount + vertexCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.4) * nodeRadius;
      
      const x = vertex.x + r * Math.sin(phi) * Math.cos(theta);
      const y = vertex.y + r * Math.sin(phi) * Math.sin(theta);
      const z = (isUpward ? 0.06 : -0.06) + r * Math.cos(phi) * 0.3;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Bright radiant vertices
      const brightness = 1.0 - (r / nodeRadius) * 0.6;
      const c = white.clone();
      if (isUpward) {
        c.lerp(lightBlue, 0.4);
      } else {
        c.lerp(paleGold, 0.5);
      }
      c.multiplyScalar(0.7 + brightness * 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 2;
    }
  }

  // 3. Sacred center point - The bindu
  const binduRadius = 0.05;
  for (let i = 0; i < centerCount && idx < edgeCount + vertexCount + centerCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.3) * binduRadius;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    // Pure white-gold center
    const brightness = 1.0 - (r / binduRadius) * 0.3;
    const c = white.clone().lerp(gold, 0.15);
    c.multiplyScalar(0.8 + brightness * 0.2);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 3;
  }

  // 4. Subtle ambient halo - Soft, ethereal
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Gentle spherical halo
    const r = 1.3 + Math.pow(Math.random(), 2) * 0.35;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.3;
    
    // Soft blue-white ambient glow
    const c = deepBlue.clone().lerp(royalBlue, Math.random());
    c.lerp(white, Math.random() * 0.15);
    c.multiplyScalar(0.2 + Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- TRIQUETRA ---
// Three interlocking arcs forming the symbol of eternity and trinity
// Celtic sacred geometry representing the interconnection of all things
// No beginning, no end - representing eternal life and unity

export function generateTriquetraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.85;
  
  // Golden luminous palette - warm, sacred, eternal
  const deepGold = new THREE.Color('#B8860B');
  const gold = new THREE.Color('#FFD700');
  const lightGold = new THREE.Color('#FFF4CC');
  const white = new THREE.Color('#FFFFFF');
  const amber = new THREE.Color('#FFBF00');
  const bronze = new THREE.Color('#CD7F32');

  // Perfect Triquetra geometry:
  // Three circles with radius R, centers forming equilateral triangle with side = R
  // Each circle passes through the centers of the other two
  const R = 0.72 * scale; // Circle radius
  const d = R; // Distance between centers (creates perfect overlap)
  
  // Three circle centers at 120° intervals
  const centers = [
    { 
      x: 0, 
      y: d / Math.sqrt(3), 
      startAngle: 210 * Math.PI / 180, 
      endAngle: 330 * Math.PI / 180,
      zOffset: 0.04  // Above
    },
    { 
      x: -d / 2, 
      y: -d / (2 * Math.sqrt(3)), 
      startAngle: 330 * Math.PI / 180, 
      endAngle: 450 * Math.PI / 180,
      zOffset: 0  // Middle
    },
    { 
      x: d / 2, 
      y: -d / (2 * Math.sqrt(3)), 
      startAngle: 90 * Math.PI / 180, 
      endAngle: 210 * Math.PI / 180,
      zOffset: -0.04  // Below
    }
  ];
  
  const arcCount = Math.floor(PARTICLE_COUNT * 0.75); // High density for smooth arcs
  const intersectionCount = Math.floor(PARTICLE_COUNT * 0.10);
  const centerCount = Math.floor(PARTICLE_COUNT * 0.05);
  
  let idx = 0;

  // 1. Three continuous interlocking arcs - Perfect geometry reconstruction
  const particlesPerArc = Math.floor(arcCount / 3);
  
  for (let arcIdx = 0; arcIdx < 3; arcIdx++) {
    const center = centers[arcIdx];
    const angleSpan = center.endAngle - center.startAngle;
    
    for (let i = 0; i < particlesPerArc && idx < arcCount; i++, idx++) {
      const t = i / particlesPerArc;
      const theta = center.startAngle + t * angleSpan;
      
      // Very tight line thickness for clean definition
      const thickness = 0.018;
      const radiusVar = (Math.random() - 0.5) * thickness;
      
      const x = center.x + (R + radiusVar) * Math.cos(theta);
      const y = center.y + (R + radiusVar) * Math.sin(theta);
      
      // Z-offset for over/under weaving - smooth and intentional
      const weaveFactor = Math.sin(t * Math.PI); // Smooth transition
      const z = center.zOffset * weaveFactor + (Math.random() - 0.5) * 0.008;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Golden gradient along each arc - luminous and warm
      const arcProgress = Math.sin(t * Math.PI); // Brightest at midpoint
      const c = gold.clone();
      c.lerp(lightGold, arcProgress * 0.5);
      c.lerp(amber, (1 - arcProgress) * 0.3);
      c.lerp(white, Math.random() * 0.12); // Subtle sparkle
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = arcIdx;
    }
  }

  // 2. Calculate intersection points for clean crossings
  const intersectionNodes: THREE.Vector3[] = [];
  
  // Three outer intersection points (where arcs cross)
  for (let i = 0; i < 3; i++) {
    const angle = i * 120 * Math.PI / 180 + 90 * Math.PI / 180;
    const dist = R * 0.48;
    intersectionNodes.push(new THREE.Vector3(
      dist * Math.cos(angle),
      dist * Math.sin(angle),
      0
    ));
  }
  
  // Central trinity point
  intersectionNodes.push(new THREE.Vector3(0, 0, 0));
  
  const particlesPerNode = Math.max(1, Math.floor(intersectionCount / intersectionNodes.length));
  for (let n = 0; n < intersectionNodes.length && idx < arcCount + intersectionCount; n++) {
    const node = intersectionNodes[n];
    const isCentral = n === 3;
    const nodeRadius = isCentral ? 0.06 : 0.04;
    
    for (let i = 0; i < particlesPerNode && idx < arcCount + intersectionCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * nodeRadius;
      
      positions[idx * 3] = node.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = node.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = node.z + r * Math.cos(phi) * 0.4;
      
      // Bright radiant glow at intersections
      const brightness = 1.0 - (r / nodeRadius) * 0.5;
      const c = white.clone().lerp(lightGold, 0.4);
      c.multiplyScalar(0.8 + brightness * 0.2);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 3;
    }
  }

  // 3. Central trinity core - pure sacred light
  for (let i = 0; i < centerCount && idx < arcCount + intersectionCount + centerCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.4) * 0.055;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    // Pure white-gold center
    const brightness = 1.0 - (r / 0.055) * 0.3;
    const c = white.clone().lerp(gold, 0.25);
    c.multiplyScalar(0.9 + brightness * 0.1);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 4;
  }

  // 4. Subtle ambient halo - soft golden energy
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.pow(Math.random(), 3) * 0.45;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.2;
    
    // Soft golden ambient glow
    const c = deepGold.clone().lerp(bronze, Math.random());
    c.lerp(amber, Math.random() * 0.3);
    c.multiplyScalar(0.15 + Math.random() * 0.10);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 5;
  }

  return { positions, colors, groups };
}

export function generateSriYantraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.8;
  
  // Sacred color palette - gold, magenta, orange (wealth and prosperity)
  const gold = new THREE.Color('#FFD700');
  const deepGold = new THREE.Color('#FFA500');
  const magenta = new THREE.Color('#FF1493');
  const orange = new THREE.Color('#FF6B35');
  const white = new THREE.Color('#FFFFFF');
  const crimson = new THREE.Color('#DC143C');

  const binduCount = Math.floor(PARTICLE_COUNT * 0.08);
  const triangleCount = Math.floor(PARTICLE_COUNT * 0.70);
  const intersectionCount = Math.floor(PARTICLE_COUNT * 0.12);
  
  let idx = 0;

  // 1. Bindu - Central point (origin of universe)
  const binduRadius = 0.06;
  for (let i = 0; i < binduCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * binduRadius;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const c = white.clone().lerp(gold, Math.random() * 0.4);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  // 2. Nine Triangles (edges)
  const particlesPerTriangle = Math.floor(triangleCount / SRI_YANTRA_TRIANGLES.length);
  const particlesPerEdge = Math.floor(particlesPerTriangle / 3);
  
  for (let t = 0; t < SRI_YANTRA_TRIANGLES.length && idx < binduCount + triangleCount; t++) {
    const triangle = SRI_YANTRA_TRIANGLES[t];
    const isUpward = t < 4;
    
    const baseColor = isUpward ? gold.clone() : magenta.clone();
    const accentColor = isUpward ? deepGold.clone() : crimson.clone();
    
    for (let e = 0; e < 3; e++) {
      const v1 = triangle[e];
      const v2 = triangle[(e + 1) % 3];
      
      for (let i = 0; i < particlesPerEdge && idx < binduCount + triangleCount; i++, idx++) {
        const edgeT = i / particlesPerEdge;
        const thickness = 0.012;
        
        const x = (v1.x + (v2.x - v1.x) * edgeT) * scale + (Math.random() - 0.5) * thickness;
        const y = (v1.y + (v2.y - v1.y) * edgeT) * scale + (Math.random() - 0.5) * thickness;
        
        const layerDepth = (t / SRI_YANTRA_TRIANGLES.length) * 0.15;
        const z = (isUpward ? layerDepth : -layerDepth) + (Math.random() - 0.5) * 0.02;
        
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;
        
        const c = baseColor.clone().lerp(accentColor, edgeT);
        c.lerp(white, Math.random() * 0.15);
        
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        groups[idx] = 1 + t;
      }
    }
  }

  // 3. Intersection points
  const intersectionNodes: THREE.Vector3[] = [];
  
  for (let t1 = 0; t1 < SRI_YANTRA_TRIANGLES.length; t1++) {
    const tri1 = SRI_YANTRA_TRIANGLES[t1];
    for (const v of tri1) {
      intersectionNodes.push(new THREE.Vector3(v.x * scale, v.y * scale, 0));
    }
  }
  
  const uniqueNodes: THREE.Vector3[] = [];
  const threshold = 0.05;
  for (const node of intersectionNodes) {
    let isDuplicate = false;
    for (const unique of uniqueNodes) {
      if (node.distanceTo(unique) < threshold) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) uniqueNodes.push(node);
  }
  
  const particlesPerNode = Math.max(1, Math.floor(intersectionCount / uniqueNodes.length));
  for (let n = 0; n < uniqueNodes.length && idx < binduCount + triangleCount + intersectionCount; n++) {
    const node = uniqueNodes[n];
    const nodeRadius = 0.025;
    
    for (let i = 0; i < particlesPerNode && idx < binduCount + triangleCount + intersectionCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * nodeRadius;
      
      positions[idx * 3] = node.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = node.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = node.z + r * Math.cos(phi);
      
      const c = orange.clone().lerp(gold, Math.random());
      c.lerp(white, 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 10;
    }
  }

  // 4. Outer circles (lotus petals)
  for (; idx < PARTICLE_COUNT; idx++) {
    const circleIdx = Math.floor(Math.random() * 3);
    const radius = [1.1, 1.3, 1.5][circleIdx] * scale;
    
    const angle = Math.random() * Math.PI * 2;
    const radiusJitter = (Math.random() - 0.5) * 0.015;
    
    positions[idx * 3] = (radius + radiusJitter) * Math.cos(angle);
    positions[idx * 3 + 1] = (radius + radiusJitter) * Math.sin(angle);
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.05;
    
    const c = gold.clone().lerp(deepGold, Math.random());
    c.multiplyScalar(0.4 + Math.random() * 0.3);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 11;
  }

  return { positions, colors, groups };
}

// --- GOLDEN RECTANGLES ---
// Three interconnected golden rectangles representing the cosmos and union of forces
// Each rectangle has sides in the golden ratio φ ≈ 1.618
// The three rectangles are mutually perpendicular (XY, YZ, ZX planes)
// Represents the underlying structure of creation and harmony in the universe

export function generateGoldenRectanglesData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.65;
  const phi = 1.618; // Golden ratio
  
  // Dimensions of golden rectangle
  const width = 1.0 * scale;
  const height = phi * scale;
  
  // Golden color palette - amber, gold, bronze representing wealth and divine proportion
  const deepGold = new THREE.Color('#B8860B');
  const gold = new THREE.Color('#FFD700');
  const amber = new THREE.Color('#FFBF00');
  const bronze = new THREE.Color('#CD7F32');
  const white = new THREE.Color('#FFFFFF');
  const orange = new THREE.Color('#FF8C00');
  const lightGold = new THREE.Color('#FFF4D6');

  // Three rectangles in perpendicular planes
  // Rectangle 1: XY plane (width along X, height along Y)
  // Rectangle 2: YZ plane (width along Y, height along Z)
  // Rectangle 3: ZX plane (width along Z, height along X)
  
  const rectangleCount = Math.floor(PARTICLE_COUNT * 0.65);
  const intersectionCount = Math.floor(PARTICLE_COUNT * 0.15);
  const centerCount = Math.floor(PARTICLE_COUNT * 0.08);
  
  let idx = 0;
  
  // 1. Three Golden Rectangles (edges)
  const particlesPerRectangle = Math.floor(rectangleCount / 3);
  const particlesPerEdge = Math.floor(particlesPerRectangle / 4); // 4 edges per rectangle
  
  // Rectangle 1: XY plane (vertical orientation)
  const rect1Color = gold;
  const rect1Accent = amber;
  const rect1Edges = [
    [{ x: -width/2, y: -height/2, z: 0 }, { x: width/2, y: -height/2, z: 0 }],  // Bottom
    [{ x: width/2, y: -height/2, z: 0 }, { x: width/2, y: height/2, z: 0 }],    // Right
    [{ x: width/2, y: height/2, z: 0 }, { x: -width/2, y: height/2, z: 0 }],    // Top
    [{ x: -width/2, y: height/2, z: 0 }, { x: -width/2, y: -height/2, z: 0 }]   // Left
  ];
  
  for (let e = 0; e < 4; e++) {
    const [v1, v2] = rect1Edges[e];
    for (let i = 0; i < particlesPerEdge && idx < rectangleCount; i++, idx++) {
      const t = i / particlesPerEdge;
      const thickness = 0.018;
      
      const x = v1.x + (v2.x - v1.x) * t + (Math.random() - 0.5) * thickness;
      const y = v1.y + (v2.y - v1.y) * t + (Math.random() - 0.5) * thickness;
      const z = v1.z + (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const c = rect1Color.clone().lerp(rect1Accent, Math.sin(t * Math.PI));
      c.lerp(white, Math.random() * 0.1);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 0;
    }
  }
  
  // Rectangle 2: YZ plane (frontal orientation)
  const rect2Color = bronze;
  const rect2Accent = orange;
  const rect2Edges = [
    [{ x: 0, y: -width/2, z: -height/2 }, { x: 0, y: width/2, z: -height/2 }],  // Bottom
    [{ x: 0, y: width/2, z: -height/2 }, { x: 0, y: width/2, z: height/2 }],    // Right
    [{ x: 0, y: width/2, z: height/2 }, { x: 0, y: -width/2, z: height/2 }],    // Top
    [{ x: 0, y: -width/2, z: height/2 }, { x: 0, y: -width/2, z: -height/2 }]   // Left
  ];
  
  for (let e = 0; e < 4; e++) {
    const [v1, v2] = rect2Edges[e];
    for (let i = 0; i < particlesPerEdge && idx < rectangleCount * 2; i++, idx++) {
      const t = i / particlesPerEdge;
      const thickness = 0.018;
      
      const x = v1.x + (Math.random() - 0.5) * thickness;
      const y = v1.y + (v2.y - v1.y) * t + (Math.random() - 0.5) * thickness;
      const z = v1.z + (v2.z - v1.z) * t + (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const c = rect2Color.clone().lerp(rect2Accent, Math.sin(t * Math.PI));
      c.lerp(white, Math.random() * 0.1);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }
  
  // Rectangle 3: ZX plane (horizontal orientation)
  const rect3Color = deepGold;
  const rect3Accent = lightGold;
  const rect3Edges = [
    [{ x: -height/2, y: 0, z: -width/2 }, { x: height/2, y: 0, z: -width/2 }],  // Bottom
    [{ x: height/2, y: 0, z: -width/2 }, { x: height/2, y: 0, z: width/2 }],    // Right
    [{ x: height/2, y: 0, z: width/2 }, { x: -height/2, y: 0, z: width/2 }],    // Top
    [{ x: -height/2, y: 0, z: width/2 }, { x: -height/2, y: 0, z: -width/2 }]   // Left
  ];
  
  for (let e = 0; e < 4; e++) {
    const [v1, v2] = rect3Edges[e];
    for (let i = 0; i < particlesPerEdge && idx < rectangleCount * 3; i++, idx++) {
      const t = i / particlesPerEdge;
      const thickness = 0.018;
      
      const x = v1.x + (v2.x - v1.x) * t + (Math.random() - 0.5) * thickness;
      const y = v1.y + (Math.random() - 0.5) * thickness;
      const z = v1.z + (v2.z - v1.z) * t + (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const c = rect3Color.clone().lerp(rect3Accent, Math.sin(t * Math.PI));
      c.lerp(white, Math.random() * 0.1);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 2;
    }
  }
  
  // 2. Intersection nodes (12 edge intersections where rectangles cross)
  const intersectionNodes: THREE.Vector3[] = [
    // Rectangle 1 & 2 intersections (4 points on Y axis)
    new THREE.Vector3(0, height/2, 0),
    new THREE.Vector3(0, -height/2, 0),
    new THREE.Vector3(0, width/2, 0),
    new THREE.Vector3(0, -width/2, 0),
    // Rectangle 2 & 3 intersections (4 points on Z axis)
    new THREE.Vector3(0, 0, height/2),
    new THREE.Vector3(0, 0, -height/2),
    new THREE.Vector3(0, 0, width/2),
    new THREE.Vector3(0, 0, -width/2),
    // Rectangle 3 & 1 intersections (4 points on X axis)
    new THREE.Vector3(height/2, 0, 0),
    new THREE.Vector3(-height/2, 0, 0),
    new THREE.Vector3(width/2, 0, 0),
    new THREE.Vector3(-width/2, 0, 0),
  ];
  
  const particlesPerNode = Math.max(1, Math.floor(intersectionCount / intersectionNodes.length));
  for (let n = 0; n < intersectionNodes.length && idx < rectangleCount + intersectionCount; n++) {
    const node = intersectionNodes[n];
    const nodeRadius = 0.06;
    
    for (let i = 0; i < particlesPerNode && idx < rectangleCount + intersectionCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.4) * nodeRadius;
      
      positions[idx * 3] = node.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = node.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = node.z + r * Math.cos(phi);
      
      // Bright glowing intersections
      const brightness = 1.0 - (r / nodeRadius) * 0.5;
      const c = white.clone().lerp(gold, 0.3);
      c.multiplyScalar(0.7 + brightness * 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 3;
    }
  }
  
  // 3. Sacred center point (cosmic origin)
  for (let i = 0; i < centerCount && idx < rectangleCount + intersectionCount + centerCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.3) * 0.08;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    // Pure white-gold radiant center
    const brightness = 1.0 - (r / 0.08) * 0.3;
    const c = white.clone().lerp(gold, 0.2);
    c.multiplyScalar(0.85 + brightness * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 4;
  }
  
  // 4. Outer spherical aura (divine proportion radiating outward)
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2 + Math.pow(Math.random(), 2) * 0.4;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.4;
    
    // Soft golden ambient glow
    const c = deepGold.clone().lerp(amber, Math.random());
    c.lerp(white, Math.random() * 0.15);
    c.multiplyScalar(0.2 + Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 5;
  }

  return { positions, colors, groups };
}
