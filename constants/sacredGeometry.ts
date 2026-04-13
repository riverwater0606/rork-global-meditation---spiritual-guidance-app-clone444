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

const randomOnSphere = () => randomInSphere().normalize();

const clampUnit = (value: number) => Math.max(-1, Math.min(1, value));

const getLatitude = (p: THREE.Vector3) => Math.asin(clampUnit(p.y));

const getLongitude = (p: THREE.Vector3) => Math.atan2(p.z, p.x);

const softNoise = (p: THREE.Vector3, sx = 3.1, sy = 2.7, sz = 3.7) =>
  Math.sin(p.x * sx) * 0.5 +
  Math.cos(p.y * sy) * 0.3 +
  Math.sin(p.z * sz + p.x * 1.2) * 0.2;

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

export function generateMarsData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const rust = new THREE.Color('#C2410C');
  const red = new THREE.Color('#DC2626');
  const orange = new THREE.Color('#FB923C');
  const dust = new THREE.Color('#FDE68A');
  const ice = new THREE.Color('#F8FAFC');
  const dark = new THREE.Color('#7C2D12');
  const atmosphere = new THREE.Color('#FDBA74');
  const radius = 1.0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = randomOnSphere();
    let c = rust.clone();
    let g = 0;
    const lat = getLatitude(p);
    const lon = getLongitude(p);
    const noise = softNoise(p, 4.4, 3.5, 4.1);
    const stormBand = Math.sin(lon * 2.6 + lat * 5.5) * 0.5 + 0.5;

    if (Math.abs(lat) > 1.12) {
      c.copy(ice).lerp(dust, 0.25);
      g = 2;
    } else if (stormBand > 0.74 && noise > 0.08) {
      c.copy(dust).lerp(orange, 0.35);
      p.multiplyScalar(1.01);
      g = 1;
    } else {
      const canyon = Math.sin(lon * 3.2 - lat * 1.4) * 0.5 + 0.5;
      c.copy(rust).lerp(red, Math.max(0, noise) * 0.55).lerp(dark, canyon * 0.28);
      c.lerp(orange, Math.max(0, stormBand - 0.45) * 0.35);
    }

    positions[i * 3] = p.x * radius;
    positions[i * 3 + 1] = p.y * radius;
    positions[i * 3 + 2] = p.z * radius;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = g;
  }

  fillAmbientParticles(positions, colors, groups, Math.floor(PARTICLE_COUNT * 0.92), atmosphere, dust, 1.22);
  return { positions, colors, groups };
}

export function generateVenusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const cream = new THREE.Color('#FEF3C7');
  const gold = new THREE.Color('#F59E0B');
  const amber = new THREE.Color('#FBBF24');
  const brown = new THREE.Color('#92400E');
  const white = new THREE.Color('#FFFFFF');

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomOnSphere();
    const lat = getLatitude(p);
    const lon = getLongitude(p);
    const band = Math.sin(lat * 8 + Math.sin(lon * 2.2) * 1.5) * 0.5 + 0.5;
    const swirl = Math.sin(lon * 5.6 - lat * 3.2) * 0.5 + 0.5;
    const haze = Math.max(0, softNoise(p, 2.6, 4.5, 2.9));
    const c = cream.clone()
      .lerp(amber, band * 0.45)
      .lerp(gold, swirl * 0.32)
      .lerp(brown, haze * 0.22)
      .lerp(white, 0.08 + Math.max(0, band - 0.65) * 0.18);

    positions[i * 3] = p.x * 1.01;
    positions[i * 3 + 1] = p.y * 1.01;
    positions[i * 3 + 2] = p.z * 1.01;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = band > 0.7 ? 1 : 0;
  }

  fillAmbientParticles(positions, colors, groups, Math.floor(PARTICLE_COUNT * 0.9), cream, amber, 1.18);
  return { positions, colors, groups };
}

export function generateJupiterData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const cream = new THREE.Color('#FFF7ED');
  const tan = new THREE.Color('#D6A77A');
  const brown = new THREE.Color('#8B5E3C');
  const red = new THREE.Color('#C2410C');
  const salmon = new THREE.Color('#FB7185');
  const stormCenter = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2 - 0.28, Math.PI * 1.15);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomOnSphere();
    const lat = getLatitude(p);
    const lon = getLongitude(p);
    const band = Math.sin(lat * 14 + Math.sin(lon * 1.5) * 1.6) * 0.5 + 0.5;
    const turbulence = Math.sin(lon * 4.8 + lat * 2.1) * 0.5 + 0.5;
    const stormDot = p.dot(stormCenter);
    const c = cream.clone()
      .lerp(tan, band * 0.55)
      .lerp(brown, turbulence * 0.3);
    let g = 0;
    let scale = 1.03;

    if (stormDot > 0.935) {
      c.copy(red).lerp(salmon, (stormDot - 0.935) / 0.065).lerp(cream, 0.12);
      scale = 1.035;
      g = 2;
    } else if (band > 0.72) {
      c.lerp(brown, 0.15);
      g = 1;
    }

    positions[i * 3] = p.x * scale;
    positions[i * 3 + 1] = p.y * scale;
    positions[i * 3 + 2] = p.z * scale;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = g;
  }

  fillAmbientParticles(positions, colors, groups, Math.floor(PARTICLE_COUNT * 0.9), tan, cream, 1.24);
  return { positions, colors, groups };
}

export function generateSaturnData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const cream = new THREE.Color('#F8E7C9');
  const sand = new THREE.Color('#E9C46A');
  const brown = new THREE.Color('#A16207');
  const ringLight = new THREE.Color('#FDE68A');
  const ringDark = new THREE.Color('#C08457');
  let idx = 0;
  const bodyCount = Math.floor(PARTICLE_COUNT * 0.66);
  const ringCount = Math.floor(PARTICLE_COUNT * 0.24);

  for (; idx < bodyCount; idx++) {
    const p = randomOnSphere();
    const lat = getLatitude(p);
    const lon = getLongitude(p);
    const band = Math.sin(lat * 11 + Math.sin(lon * 1.3)) * 0.5 + 0.5;
    const c = cream.clone().lerp(sand, band * 0.45).lerp(brown, Math.max(0, band - 0.76) * 0.24);
    positions[idx * 3] = p.x * 0.96;
    positions[idx * 3 + 1] = p.y * 0.96;
    positions[idx * 3 + 2] = p.z * 0.96;
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = band > 0.73 ? 1 : 0;
  }

  for (; idx < bodyCount + ringCount; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 1.18 + Math.random() * 0.74;
    const thickness = (Math.random() - 0.5) * 0.035;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const y = Math.sin(theta * 2.2) * 0.03 + thickness;
    const band = Math.sin(radius * 18 + theta * 2) * 0.5 + 0.5;
    const c = ringLight.clone().lerp(ringDark, band * 0.55).lerp(cream, Math.random() * 0.08);
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  fillAmbientParticles(positions, colors, groups, idx, sand, ringLight, 2.0);
  return { positions, colors, groups };
}

export function generateNeptuneData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const deepBlue = new THREE.Color('#1D4ED8');
  const cobalt = new THREE.Color('#2563EB');
  const cyan = new THREE.Color('#38BDF8');
  const white = new THREE.Color('#E0F2FE');

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomOnSphere();
    const lat = getLatitude(p);
    const lon = getLongitude(p);
    const band = Math.sin(lat * 10 - lon * 0.8) * 0.5 + 0.5;
    const storm = Math.sin(lon * 6.2 + lat * 3.4) * 0.5 + 0.5;
    const c = deepBlue.clone()
      .lerp(cobalt, band * 0.45)
      .lerp(cyan, Math.max(0, storm - 0.52) * 0.55)
      .lerp(white, Math.max(0, band - 0.86) * 0.18);

    positions[i * 3] = p.x * 1.02;
    positions[i * 3 + 1] = p.y * 1.02;
    positions[i * 3 + 2] = p.z * 1.02;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    groups[i] = storm > 0.82 ? 1 : 0;
  }

  fillAmbientParticles(positions, colors, groups, Math.floor(PARTICLE_COUNT * 0.9), cobalt, cyan, 1.24);
  return { positions, colors, groups };
}

export function generateAkashicGalaxyData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const violet = new THREE.Color('#A78BFA');
  const indigo = new THREE.Color('#6366F1');
  const cyan = new THREE.Color('#67E8F9');
  let idx = 0;
  const armCount = Math.floor(PARTICLE_COUNT * 0.72);
  const coreCount = Math.floor(PARTICLE_COUNT * 0.1);

  for (; idx < armCount; idx++) {
    const arm = idx % 4;
    const t = Math.random();
    const base = (arm / 4) * Math.PI * 2;
    const spiral = base + t * 4.8 * Math.PI;
    const radius = 0.14 + Math.pow(t, 0.78) * 1.1;
    const drift = (Math.random() - 0.5) * 0.16;
    positions[idx * 3] = Math.cos(spiral) * (radius + drift * 0.2);
    positions[idx * 3 + 1] = (Math.random() - 0.5) * 0.14 + Math.sin(spiral * 0.5) * 0.06;
    positions[idx * 3 + 2] = Math.sin(spiral) * (radius + drift * 0.2);
    const c = violet.clone().lerp(indigo, t * 0.45).lerp(cyan, Math.max(0, t - 0.45) * 0.7).lerp(white, Math.random() * 0.12);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }
  for (; idx < armCount + coreCount; idx++) {
    const p = randomInSphere().multiplyScalar(0.24);
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    colors[idx * 3] = white.r; colors[idx * 3 + 1] = white.g; colors[idx * 3 + 2] = white.b;
    groups[idx] = 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, indigo, cyan, 1.5);
  return { positions, colors, groups };
}

export function generateSoulNebulaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const rose = new THREE.Color('#FB7185');
  const magenta = new THREE.Color('#F472B6');
  const violet = new THREE.Color('#A78BFA');
  const white = new THREE.Color('#FFFFFF');
  let idx = 0;
  const cloudCount = Math.floor(PARTICLE_COUNT * 0.76);
  const sparkCount = Math.floor(PARTICLE_COUNT * 0.08);

  while (idx < cloudCount) {
    const x = (Math.random() - 0.5) * 2.2;
    const y = (Math.random() - 0.5) * 1.8;
    const z = (Math.random() - 0.5) * 1.5;
    const radial = Math.sqrt(x * x * 0.72 + y * y * 1.08 + z * z * 0.86);
    const density = Math.sin(x * 3.2) * 0.18 + Math.cos(y * 4.3) * 0.16 + Math.sin(z * 3.7 + x * 1.4) * 0.12;
    if (radial + density > 1.05) continue;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    const c = magenta.clone().lerp(violet, (z + 0.75) / 1.5).lerp(rose, (y + 0.9) / 1.8).lerp(white, Math.max(0, 1 - radial) * 0.16);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = radial < 0.32 ? 2 : 0;
    idx++;
  }
  for (; idx < cloudCount + sparkCount; idx++) {
    const p = randomInSphere().multiplyScalar(0.9 + Math.random() * 0.42);
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    const c = white.clone().lerp(violet, Math.random() * 0.35);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, violet, magenta, 1.72);
  return { positions, colors, groups };
}

export function generateLotusGalaxyData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const pink = new THREE.Color('#FDA4AF');
  const violet = new THREE.Color('#C084FC');
  const cyan = new THREE.Color('#67E8F9');
  let idx = 0;
  const petals = 8;
  const petalCount = Math.floor(PARTICLE_COUNT * 0.68);

  for (; idx < petalCount; idx++) {
    const petal = idx % petals;
    const t = Math.random();
    const angle = (petal / petals) * Math.PI * 2;
    const radius = 0.12 + t * 1.02;
    const bloom = Math.sin(t * Math.PI) * 0.32;
    positions[idx * 3] = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * bloom * 0.24;
    positions[idx * 3 + 1] = Math.sin(t * Math.PI) * 0.22 * (petal % 2 === 0 ? 1 : -1);
    positions[idx * 3 + 2] = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * bloom * 0.24;
    const c = pink.clone().lerp(violet, t * 0.5).lerp(cyan, petal / petals * 0.2).lerp(white, Math.random() * 0.14);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = petal % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, violet, cyan, 1.45);
  return { positions, colors, groups };
}

export function generateOracleConstellationData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const gold = new THREE.Color('#FDE68A');
  const blue = new THREE.Color('#60A5FA');
  const nodeCount = Math.floor(PARTICLE_COUNT * 0.18);
  const lineCount = Math.floor(PARTICLE_COUNT * 0.52);
  const nodes: THREE.Vector3[] = [];
  let idx = 0;

  for (let i = 0; i < 12; i++) {
    const theta = (i / 12) * Math.PI * 2;
    const radius = i % 3 === 0 ? 0.95 : 0.58 + (i % 2) * 0.18;
    nodes.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta * 1.5) * 0.34, Math.sin(theta) * radius));
  }

  for (; idx < nodeCount; idx++) {
    const center = nodes[idx % nodes.length];
    const p = center.clone().add(randomInSphere().multiplyScalar(0.06));
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    const c = white.clone().lerp(gold, Math.random() * 0.28);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }
  for (; idx < nodeCount + lineCount; idx++) {
    const a = nodes[idx % nodes.length];
    const b = nodes[(idx * 5 + 3) % nodes.length];
    const p = new THREE.Vector3().lerpVectors(a, b, Math.random()).add(randomInSphere().multiplyScalar(0.018));
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    const c = blue.clone().lerp(gold, Math.random() * 0.45).lerp(white, Math.random() * 0.08);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, gold, 1.5);
  return { positions, colors, groups };
}

export function generateAscensionSpiralData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#67E8F9');
  const blue = new THREE.Color('#3B82F6');
  const violet = new THREE.Color('#A78BFA');
  let idx = 0;
  const strandCount = Math.floor(PARTICLE_COUNT * 0.74);
  const coreCount = Math.floor(PARTICLE_COUNT * 0.08);

  for (; idx < strandCount; idx++) {
    const strand = idx % 3;
    const t = Math.random();
    const angle = t * Math.PI * 7 + strand * (Math.PI * 2 / 3);
    const radius = 0.12 + (1 - t) * 0.68;
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = -1.05 + t * 2.1;
    positions[idx * 3 + 2] = Math.sin(angle) * radius;
    const c = cyan.clone().lerp(blue, strand / 2).lerp(violet, t * 0.5).lerp(white, Math.max(0, t - 0.78) * 0.4);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = strand;
  }
  for (; idx < strandCount + coreCount; idx++) {
    const t = Math.random();
    const p = new THREE.Vector3((Math.random() - 0.5) * 0.15, -0.9 + t * 1.9, (Math.random() - 0.5) * 0.15);
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    colors[idx * 3] = white.r; colors[idx * 3 + 1] = white.g; colors[idx * 3 + 2] = white.b;
    groups[idx] = 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, violet, 1.55);
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
// Three interlocking circular loops forming rounded triangular petals
// Exact reconstruction from reference image
// Each loop is a circle segment, creating the characteristic triquetra pattern
// with inner and outer boundaries forming the interlocking design

export function generateTriquetraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 1.0;
  
  // Golden luminous palette matching the image's golden yellow color
  const gold = new THREE.Color('#FFD700');
  const brightGold = new THREE.Color('#FFF176');
  const deepGold = new THREE.Color('#FFA000');
  const white = new THREE.Color('#FFFFFF');

  // Triquetra Construction from Image Analysis:
  // Three circles with centers forming an equilateral triangle
  // Each circle's radius equals the distance between centers
  // This creates the perfect vesica piscis overlaps
  
  const circleRadius = 0.55 * scale;
  const centerDistance = circleRadius * 1.0; // Key: R = d for perfect triquetra
  
  // Three circle centers at 120° apart, rotated 30° to match image orientation
  const circleData = [
    { angle: 90 * Math.PI / 180, label: 'top' },
    { angle: 210 * Math.PI / 180, label: 'bottom-left' },
    { angle: 330 * Math.PI / 180, label: 'bottom-right' }
  ];
  
  const circleCenters = circleData.map(d => ({
    x: centerDistance * Math.cos(d.angle),
    y: centerDistance * Math.sin(d.angle),
    angle: d.angle
  }));
  
  // Calculate which parts of each circle are visible (not covered by other circles)
  // For triquetra: each circle shows approximately 240° arc (excludes 120° covered by neighbors)
  
  // Particle distribution
  const loopParticles = Math.floor(PARTICLE_COUNT * 0.75);
  const innerTriangleParticles = Math.floor(PARTICLE_COUNT * 0.10);
  const glowParticles = Math.floor(PARTICLE_COUNT * 0.08);
  
  let idx = 0;

  // Helper: Check if a point is inside a circle
  const isInsideCircle = (px: number, py: number, cx: number, cy: number, r: number) => {
    const dx = px - cx;
    const dy = py - cy;
    return (dx * dx + dy * dy) < (r * r);
  };

  // 1. Draw the three interlocking loops (outer and inner boundaries)
  const particlesPerLoop = Math.floor(loopParticles / 3);
  
  for (let loopIdx = 0; loopIdx < 3; loopIdx++) {
    const center = circleCenters[loopIdx];
    const otherCenter1 = circleCenters[(loopIdx + 1) % 3];
    const otherCenter2 = circleCenters[(loopIdx + 2) % 3];
    
    // Sample points along this circle
    const samplesPerLoop = particlesPerLoop * 2; // Oversample then filter
    let particlesPlaced = 0;
    
    for (let i = 0; i < samplesPerLoop && particlesPlaced < particlesPerLoop && idx < loopParticles; i++) {
      const angle = (i / samplesPerLoop) * Math.PI * 2;
      
      // Outer boundary: points on the circle
      const outerThickness = 0.045; // Tube thickness
      const innerRadius = circleRadius - outerThickness;
      
      // Randomly pick inner or outer edge of the tube
      const radiusVariation = innerRadius + Math.random() * outerThickness * 2;
      
      const px = center.x + radiusVariation * Math.cos(angle);
      const py = center.y + radiusVariation * Math.sin(angle);
      
      // Check if this point should be visible:
      // It's visible if it's NOT inside BOTH other circles simultaneously
      // (i.e., it's in the exposed part of this circle)
      const inOther1 = isInsideCircle(px, py, otherCenter1.x, otherCenter1.y, circleRadius - outerThickness * 0.5);
      const inOther2 = isInsideCircle(px, py, otherCenter2.x, otherCenter2.y, circleRadius - outerThickness * 0.5);
      
      // Only draw if not deeply inside both neighbors (allow partial overlap for weaving)
      if (!(inOther1 && inOther2)) {
        const z = (Math.random() - 0.5) * 0.03;
        
        positions[idx * 3] = px;
        positions[idx * 3 + 1] = py;
        positions[idx * 3 + 2] = z;
        
        // Color: golden with subtle variation
        const colorVariation = Math.random();
        const particleColor = gold.clone();
        if (colorVariation < 0.1) {
          particleColor.lerp(brightGold, 0.6);
        } else if (colorVariation > 0.9) {
          particleColor.lerp(deepGold, 0.4);
        }
        
        colors[idx * 3] = particleColor.r;
        colors[idx * 3 + 1] = particleColor.g;
        colors[idx * 3 + 2] = particleColor.b;
        groups[idx] = loopIdx;
        
        idx++;
        particlesPlaced++;
      }
    }
  }

  // 2. Inner triangle - the small triangular void in the center where all three loops meet
  const innerTriangleRadius = 0.12 * scale;
  for (let i = 0; i < innerTriangleParticles && idx < loopParticles + innerTriangleParticles; i++, idx++) {
    // Create small particles around the inner triangle vertices
    const vertexAngle = (Math.floor(Math.random() * 3) * 120 + 30) * Math.PI / 180;
    const r = innerTriangleRadius * (0.6 + Math.random() * 0.4);
    const angleJitter = (Math.random() - 0.5) * 0.3;
    
    const px = r * Math.cos(vertexAngle + angleJitter);
    const py = r * Math.sin(vertexAngle + angleJitter);
    const pz = (Math.random() - 0.5) * 0.02;
    
    positions[idx * 3] = px;
    positions[idx * 3 + 1] = py;
    positions[idx * 3 + 2] = pz;
    
    // Bright golden center
    const centerColor = gold.clone().lerp(white, 0.3);
    colors[idx * 3] = centerColor.r;
    colors[idx * 3 + 1] = centerColor.g;
    colors[idx * 3 + 2] = centerColor.b;
    groups[idx] = 3;
  }

  // 3. Soft outer glow
  for (; idx < loopParticles + innerTriangleParticles + glowParticles; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.pow(Math.random(), 2) * 0.3;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.15;
    
    const glowColor = deepGold.clone();
    glowColor.multiplyScalar(0.15 + Math.random() * 0.1);
    
    colors[idx * 3] = glowColor.r;
    colors[idx * 3 + 1] = glowColor.g;
    colors[idx * 3 + 2] = glowColor.b;
    groups[idx] = 4;
  }

  // 4. Fill remaining with ambient particles
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 1.8) * 0.3;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const ambientColor = gold.clone();
    ambientColor.lerp(white, 0.2);
    ambientColor.multiplyScalar(0.12 + Math.random() * 0.08);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 5;
  }

  return { positions, colors, groups };
}

export function generateRingTorusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FBBF24');
  const amber = new THREE.Color('#F59E0B');
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#67E8F9');
  const deepBlue = new THREE.Color('#0F172A');
  const major = 0.72;
  const minor = 0.22;
  let idx = 0;
  const surfaceCount = Math.floor(PARTICLE_COUNT * 0.6);
  const fieldCount = Math.floor(PARTICLE_COUNT * 0.16);
  const meridianCount = Math.floor(PARTICLE_COUNT * 0.06);
  const edgeCount = Math.floor(PARTICLE_COUNT * 0.06);

  for (let i = 0; i < surfaceCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (i / surfaceCount) * Math.PI * 2;
    const v = ((i * 11) % surfaceCount) / surfaceCount * Math.PI * 2;
    const thickness = 0.82 + Math.random() * 0.24;
    const radius = major + minor * Math.cos(v) * thickness;
    const x = radius * Math.cos(u);
    const y = minor * Math.sin(v) * 0.92;
    const z = radius * Math.sin(u);
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    const depth = (Math.cos(v) + 1) / 2;
    const color = gold.clone().lerp(amber, depth * 0.42).lerp(white, 0.12 + Math.pow(Math.abs(Math.sin(u * 2)), 1.4) * 0.2);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 0;
  }

  for (let i = 0; i < fieldCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (i / fieldCount) * Math.PI * 2;
    const lane = i % 3;
    const minorAngle = u * 2 + lane * ((Math.PI * 2) / 3);
    const radius = major + Math.cos(minorAngle) * minor * 0.7;
    positions[idx * 3] = radius * Math.cos(u);
    positions[idx * 3 + 1] = Math.sin(minorAngle) * minor * 0.65;
    positions[idx * 3 + 2] = radius * Math.sin(u);
    const color = cyan.clone().lerp(white, 0.35).lerp(gold, lane * 0.08);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 1;
  }

  for (let i = 0; i < meridianCount && idx < PARTICLE_COUNT; i++, idx++) {
    const v = (i / meridianCount) * Math.PI * 2;
    const side = i < meridianCount / 2 ? -1 : 1;
    positions[idx * 3] = side * major + Math.cos(v) * minor * 0.72;
    positions[idx * 3 + 1] = Math.sin(v) * minor * 0.72;
    positions[idx * 3 + 2] = side * 0.03;
    const color = cyan.clone().lerp(white, 0.3);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 2;
  }

  for (let i = 0; i < edgeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (i / edgeCount) * Math.PI * 2;
    const inner = i % 2 === 0;
    const radius = inner ? major - minor * 0.94 : major + minor * 0.92;
    positions[idx * 3] = Math.cos(u) * radius;
    positions[idx * 3 + 1] = Math.sin(u * 2) * 0.015;
    positions[idx * 3 + 2] = Math.sin(u) * radius;
    const color = (inner ? amber : gold).clone().lerp(cyan, inner ? 0.08 : 0.04).multiplyScalar(inner ? 0.7 : 0.82);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 2;
  }

  fillAmbientParticles(positions, colors, groups, idx, amber, deepBlue.lerp(cyan, 0.5), 1.34);
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

// --- DOUBLE HELIX DNA ---
// Two intertwined spirals representing the DNA structure
// Parametric helix with particle trails creating a biological/cosmic aesthetic

export function generateDoubleHelixDNAData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.8;
  const helixRadius = 0.4 * scale;
  const helixHeight = 2.2 * scale;
  const turns = 3.5;
  
  // Blue-cyan DNA palette
  const deepCyan = new THREE.Color('#0891B2');
  const brightCyan = new THREE.Color('#22D3EE');
  const electricBlue = new THREE.Color('#3B82F6');
  const lightCyan = new THREE.Color('#67E8F9');
  const white = new THREE.Color('#FFFFFF');
  const teal = new THREE.Color('#14B8A6');

  // Particle distribution
  const strand1Count = Math.floor(PARTICLE_COUNT * 0.35);
  const strand2Count = Math.floor(PARTICLE_COUNT * 0.35);
  const connectionCount = Math.floor(PARTICLE_COUNT * 0.15);
  const trailCount = Math.floor(PARTICLE_COUNT * 0.08);
  
  let idx = 0;

  // Helper: Get helix position at parameter t (0 to 1)
  const getHelixPoint = (t: number, phaseOffset: number) => {
    const angle = t * turns * Math.PI * 2 + phaseOffset;
    const y = (t - 0.5) * helixHeight;
    return {
      x: helixRadius * Math.cos(angle),
      y: y,
      z: helixRadius * Math.sin(angle)
    };
  };

  // 1. First DNA Strand (Cyan-Blue)
  for (let i = 0; i < strand1Count && idx < PARTICLE_COUNT; i++, idx++) {
    const t = i / strand1Count;
    const pos = getHelixPoint(t, 0);
    
    // Add thickness to the strand
    const thickness = 0.035;
    const noiseX = (Math.random() - 0.5) * thickness;
    const noiseY = (Math.random() - 0.5) * thickness;
    const noiseZ = (Math.random() - 0.5) * thickness;
    
    positions[idx * 3] = pos.x + noiseX;
    positions[idx * 3 + 1] = pos.y + noiseY;
    positions[idx * 3 + 2] = pos.z + noiseZ;
    
    // Color gradient along strand
    const c = brightCyan.clone().lerp(electricBlue, t);
    c.lerp(white, Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  // 2. Second DNA Strand (Teal-Cyan) - 180° offset
  for (let i = 0; i < strand2Count && idx < PARTICLE_COUNT; i++, idx++) {
    const t = i / strand2Count;
    const pos = getHelixPoint(t, Math.PI); // 180° phase offset
    
    const thickness = 0.035;
    const noiseX = (Math.random() - 0.5) * thickness;
    const noiseY = (Math.random() - 0.5) * thickness;
    const noiseZ = (Math.random() - 0.5) * thickness;
    
    positions[idx * 3] = pos.x + noiseX;
    positions[idx * 3 + 1] = pos.y + noiseY;
    positions[idx * 3 + 2] = pos.z + noiseZ;
    
    // Color gradient along strand
    const c = teal.clone().lerp(lightCyan, t);
    c.lerp(white, Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }

  // 3. Base pair connections (rungs of the ladder)
  const numConnections = 20;
  const particlesPerConnection = Math.floor(connectionCount / numConnections);
  
  for (let c = 0; c < numConnections && idx < strand1Count + strand2Count + connectionCount; c++) {
    const t = (c + 0.5) / numConnections;
    const pos1 = getHelixPoint(t, 0);
    const pos2 = getHelixPoint(t, Math.PI);
    
    for (let i = 0; i < particlesPerConnection && idx < strand1Count + strand2Count + connectionCount; i++, idx++) {
      const lerp = i / particlesPerConnection;
      const thickness = 0.02;
      
      positions[idx * 3] = pos1.x + (pos2.x - pos1.x) * lerp + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 1] = pos1.y + (pos2.y - pos1.y) * lerp + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 2] = pos1.z + (pos2.z - pos1.z) * lerp + (Math.random() - 0.5) * thickness;
      
      // Bright connection color
      const connectionColor = white.clone().lerp(lightCyan, 0.3);
      connectionColor.lerp(brightCyan, Math.abs(lerp - 0.5) * 2);
      
      colors[idx * 3] = connectionColor.r;
      colors[idx * 3 + 1] = connectionColor.g;
      colors[idx * 3 + 2] = connectionColor.b;
      groups[idx] = 2;
    }
  }

  // 4. Particle trails / energy glow around helix
  for (let i = 0; i < trailCount && idx < strand1Count + strand2Count + connectionCount + trailCount; i++, idx++) {
    const t = Math.random();
    const phase = Math.random() * Math.PI * 2;
    const pos = getHelixPoint(t, phase);
    
    // Expand outward from helix
    const expansion = 1.2 + Math.random() * 0.5;
    
    positions[idx * 3] = pos.x * expansion;
    positions[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.3;
    positions[idx * 3 + 2] = pos.z * expansion;
    
    // Soft glow color
    const glowColor = deepCyan.clone().lerp(brightCyan, Math.random());
    glowColor.multiplyScalar(0.4 + Math.random() * 0.3);
    
    colors[idx * 3] = glowColor.r;
    colors[idx * 3 + 1] = glowColor.g;
    colors[idx * 3 + 2] = glowColor.b;
    groups[idx] = 3;
  }

  // 5. Ambient particles filling outer space
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.pow(Math.random(), 2) * 0.5;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.3; // Elongate vertically
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const ambientColor = deepCyan.clone().lerp(electricBlue, Math.random());
    ambientColor.multiplyScalar(0.15 + Math.random() * 0.1);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- VORTEX RING (Toroidal Vortex) ---
// A toroidal vortex with flowing particles creating a cosmic ring of energy
// Mathematical torus with velocity-based particle distribution

export function generateVortexRingData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.9;
  const majorRadius = 0.7 * scale; // Distance from center to tube center
  const minorRadius = 0.25 * scale; // Tube radius
  
  // Blue-cyan-purple vortex palette
  const deepBlue = new THREE.Color('#1E40AF');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const purple = new THREE.Color('#8B5CF6');
  const white = new THREE.Color('#FFFFFF');

  // Particle distribution
  const torusSurfaceCount = Math.floor(PARTICLE_COUNT * 0.45);
  const flowLinesCount = Math.floor(PARTICLE_COUNT * 0.25);
  const coreCount = Math.floor(PARTICLE_COUNT * 0.12);
  const outerVortexCount = Math.floor(PARTICLE_COUNT * 0.10);
  
  let idx = 0;

  // Helper: Get torus position
  const getTorusPoint = (u: number, v: number) => {
    // u: angle around the tube (0 to 2π)
    // v: angle around the torus (0 to 2π)
    const x = (majorRadius + minorRadius * Math.cos(u)) * Math.cos(v);
    const y = minorRadius * Math.sin(u);
    const z = (majorRadius + minorRadius * Math.cos(u)) * Math.sin(v);
    return { x, y, z };
  };

  // 1. Torus Surface Particles
  for (let i = 0; i < torusSurfaceCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const pos = getTorusPoint(u, v);
    
    // Add slight thickness variation
    const thickness = 0.02;
    positions[idx * 3] = pos.x + (Math.random() - 0.5) * thickness;
    positions[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * thickness;
    positions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * thickness;
    
    // Color based on position around torus
    const colorT = (v / (Math.PI * 2));
    const c = cyan.clone().lerp(electricBlue, Math.sin(colorT * Math.PI * 2) * 0.5 + 0.5);
    c.lerp(lightCyan, Math.cos(u) * 0.3 + 0.3);
    c.lerp(white, Math.random() * 0.1);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  // 2. Flow Lines (spiral paths around the tube)
  const numFlowLines = 12;
  const particlesPerFlowLine = Math.floor(flowLinesCount / numFlowLines);
  
  for (let line = 0; line < numFlowLines; line++) {
    const lineOffset = (line / numFlowLines) * Math.PI * 2;
    
    for (let i = 0; i < particlesPerFlowLine && idx < torusSurfaceCount + flowLinesCount; i++, idx++) {
      const t = i / particlesPerFlowLine;
      const v = t * Math.PI * 2 * 3; // 3 loops around
      const u = lineOffset + t * Math.PI * 2 * 2; // Spiral effect
      
      // Slightly inside the torus surface for flow effect
      const flowRadius = minorRadius * 0.7;
      const x = (majorRadius + flowRadius * Math.cos(u)) * Math.cos(v);
      const y = flowRadius * Math.sin(u);
      const z = (majorRadius + flowRadius * Math.cos(u)) * Math.sin(v);
      
      const thickness = 0.015;
      positions[idx * 3] = x + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 1] = y + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 2] = z + (Math.random() - 0.5) * thickness;
      
      // Bright flow line color
      const brightness = Math.sin(t * Math.PI) * 0.5 + 0.5;
      const c = lightCyan.clone().lerp(white, brightness * 0.4);
      c.lerp(purple, Math.sin(t * Math.PI * 4) * 0.2 + 0.1);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  // 3. Core Ring (bright center of the torus tube)
  for (let i = 0; i < coreCount && idx < torusSurfaceCount + flowLinesCount + coreCount; i++, idx++) {
    const v = Math.random() * Math.PI * 2;
    
    // Core is at the center of the tube (u doesn't matter, minorRadius = 0)
    const coreRadius = minorRadius * 0.15;
    const offsetAngle = Math.random() * Math.PI * 2;
    
    const x = majorRadius * Math.cos(v) + coreRadius * Math.cos(offsetAngle) * Math.cos(v);
    const y = coreRadius * Math.sin(offsetAngle);
    const z = majorRadius * Math.sin(v) + coreRadius * Math.cos(offsetAngle) * Math.sin(v);
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    
    // Bright white-cyan core
    const c = white.clone().lerp(lightCyan, Math.random() * 0.3);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  // 4. Outer Vortex (particles being pulled in)
  for (let i = 0; i < outerVortexCount && idx < torusSurfaceCount + flowLinesCount + coreCount + outerVortexCount; i++, idx++) {
    const v = Math.random() * Math.PI * 2;
    const spiralT = Math.random();
    
    // Spiral inward toward the torus
    const outerRadius = majorRadius * (1.3 + spiralT * 0.5);
    const heightOffset = (Math.random() - 0.5) * 0.6;
    
    positions[idx * 3] = outerRadius * Math.cos(v + spiralT * Math.PI);
    positions[idx * 3 + 1] = heightOffset;
    positions[idx * 3 + 2] = outerRadius * Math.sin(v + spiralT * Math.PI);
    
    // Fading color as it goes outward
    const c = purple.clone().lerp(deepBlue, spiralT);
    c.multiplyScalar(0.4 + (1 - spiralT) * 0.4);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 3;
  }

  // 5. Ambient cosmic dust
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.1 + Math.pow(Math.random(), 2) * 0.4;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5; // Flatten
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const ambientColor = deepBlue.clone().lerp(purple, Math.random());
    ambientColor.multiplyScalar(0.12 + Math.random() * 0.08);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

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

// --- FRACTAL TREE ---
// Branching tree structure with particle leaves using recursive math
// Represents growth, life force, and the branching nature of creation

export function generateFractalTreeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.9;
  
  // Nature-inspired blue-cyan-green palette
  const deepTeal = new THREE.Color('#0D9488');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const emerald = new THREE.Color('#10B981');
  const mint = new THREE.Color('#6EE7B7');
  const white = new THREE.Color('#FFFFFF');

  // Store all branch segments
  const branches: { start: THREE.Vector3; end: THREE.Vector3; depth: number; thickness: number }[] = [];
  const leafPositions: THREE.Vector3[] = [];

  // Recursive branch generation
  const generateBranch = (
    start: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    depth: number,
    maxDepth: number
  ) => {
    if (depth > maxDepth) {
      leafPositions.push(start.clone());
      return;
    }

    const end = start.clone().add(direction.clone().multiplyScalar(length));
    branches.push({ start: start.clone(), end: end.clone(), depth, thickness: Math.max(0.01, 0.05 * (1 - depth / maxDepth)) });

    if (depth === maxDepth) {
      leafPositions.push(end.clone());
      return;
    }

    const branchCount = depth < 2 ? 3 : 2;
    const angleSpread = 0.5 + depth * 0.15;
    const lengthReduction = 0.65;

    for (let i = 0; i < branchCount; i++) {
      const newDir = direction.clone();
      
      const angleX = (Math.random() - 0.5) * angleSpread;
      const angleZ = (Math.random() - 0.5) * angleSpread;
      const spreadAngle = ((i / (branchCount - 1 || 1)) - 0.5) * angleSpread * 1.5;
      
      newDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), angleX + spreadAngle * 0.5);
      newDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleZ + spreadAngle * 0.5);
      newDir.normalize();

      generateBranch(end, newDir, length * lengthReduction, depth + 1, maxDepth);
    }
  };

  // Generate the tree structure
  const trunkStart = new THREE.Vector3(0, -1.2 * scale, 0);
  const trunkDir = new THREE.Vector3(0, 1, 0);
  generateBranch(trunkStart, trunkDir, 0.5 * scale, 0, 5);

  // Particle distribution
  const branchParticles = Math.floor(PARTICLE_COUNT * 0.55);
  const leafParticles = Math.floor(PARTICLE_COUNT * 0.30);
  const glowParticles = Math.floor(PARTICLE_COUNT * 0.08);

  let idx = 0;

  // 1. Branch particles
  const particlesPerBranch = Math.max(1, Math.floor(branchParticles / Math.max(branches.length, 1)));
  
  for (let b = 0; b < branches.length && idx < branchParticles; b++) {
    const branch = branches[b];
    
    for (let i = 0; i < particlesPerBranch && idx < branchParticles; i++, idx++) {
      const t = i / particlesPerBranch;
      const thickness = branch.thickness;
      
      const x = branch.start.x + (branch.end.x - branch.start.x) * t + (Math.random() - 0.5) * thickness;
      const y = branch.start.y + (branch.end.y - branch.start.y) * t + (Math.random() - 0.5) * thickness;
      const z = branch.start.z + (branch.end.z - branch.start.z) * t + (Math.random() - 0.5) * thickness;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      const depthFactor = branch.depth / 5;
      const c = deepTeal.clone().lerp(cyan, depthFactor);
      c.lerp(lightCyan, t * 0.3);
      c.lerp(white, Math.random() * 0.1);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 0;
    }
  }

  // 2. Leaf particles (glowing endpoints)
  const particlesPerLeaf = Math.max(1, Math.floor(leafParticles / Math.max(leafPositions.length, 1)));
  
  for (let l = 0; l < leafPositions.length && idx < branchParticles + leafParticles; l++) {
    const leaf = leafPositions[l];
    const leafRadius = 0.06;
    
    for (let i = 0; i < particlesPerLeaf && idx < branchParticles + leafParticles; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * leafRadius;
      
      positions[idx * 3] = leaf.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = leaf.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = leaf.z + r * Math.cos(phi);
      
      const brightness = 1.0 - (r / leafRadius) * 0.5;
      const c = emerald.clone().lerp(mint, Math.random());
      c.lerp(white, brightness * 0.4);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  // 3. Soft glow around tree
  for (let i = 0; i < glowParticles && idx < branchParticles + leafParticles + glowParticles; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2 + Math.pow(Math.random(), 2) * 0.4;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta) * 0.6;
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.2 - 0.2;
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.6;
    
    const glowColor = deepTeal.clone().lerp(cyan, Math.random());
    glowColor.multiplyScalar(0.2 + Math.random() * 0.15);
    
    colors[idx * 3] = glowColor.r;
    colors[idx * 3 + 1] = glowColor.g;
    colors[idx * 3 + 2] = glowColor.b;
    groups[idx] = 2;
  }

  // 4. Ambient particles
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.3 + Math.pow(Math.random(), 2) * 0.5;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta) * 0.7;
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.3 - 0.1;
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.7;
    
    const ambientColor = cyan.clone().lerp(emerald, Math.random());
    ambientColor.multiplyScalar(0.1 + Math.random() * 0.08);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 3;
  }

  return { positions, colors, groups };
}

// --- WAVE INTERFERENCE ---
// Sine wave patterns intersecting creating interference patterns
// Represents the wave nature of reality, quantum superposition, and harmonic resonance

export function generateWaveInterferenceData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 1.0;
  
  // Electric blue-purple interference palette
  const deepBlue = new THREE.Color('#1E3A8A');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const violet = new THREE.Color('#8B5CF6');
  const magenta = new THREE.Color('#D946EF');
  const white = new THREE.Color('#FFFFFF');

  // Wave parameters
  const wave1Freq = 3.0;
  const wave2Freq = 4.0;
  const wave3Freq = 2.5;
  const amplitude = 0.3 * scale;

  // Particle distribution
  const wave1Particles = Math.floor(PARTICLE_COUNT * 0.30);
  const wave2Particles = Math.floor(PARTICLE_COUNT * 0.30);
  const interferenceParticles = Math.floor(PARTICLE_COUNT * 0.25);
  const nodesParticles = Math.floor(PARTICLE_COUNT * 0.08);

  let idx = 0;

  // 1. Wave 1 - Horizontal sine wave (XY plane)
  for (let i = 0; i < wave1Particles && idx < PARTICLE_COUNT; i++, idx++) {
    const t = (i / wave1Particles) * Math.PI * 2 * 2;
    const x = ((i / wave1Particles) - 0.5) * 2.0 * scale;
    const y = Math.sin(t * wave1Freq) * amplitude;
    const z = (Math.random() - 0.5) * 0.04;
    
    const thickness = 0.025;
    positions[idx * 3] = x + (Math.random() - 0.5) * thickness;
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * thickness;
    positions[idx * 3 + 2] = z;
    
    const c = cyan.clone().lerp(electricBlue, Math.sin(t) * 0.5 + 0.5);
    c.lerp(white, Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  // 2. Wave 2 - Vertical sine wave (XZ plane)
  for (let i = 0; i < wave2Particles && idx < PARTICLE_COUNT; i++, idx++) {
    const t = (i / wave2Particles) * Math.PI * 2 * 2;
    const x = ((i / wave2Particles) - 0.5) * 2.0 * scale;
    const y = (Math.random() - 0.5) * 0.04;
    const z = Math.sin(t * wave2Freq + Math.PI / 4) * amplitude;
    
    const thickness = 0.025;
    positions[idx * 3] = x + (Math.random() - 0.5) * thickness;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z + (Math.random() - 0.5) * thickness;
    
    const c = violet.clone().lerp(magenta, Math.sin(t) * 0.5 + 0.5);
    c.lerp(white, Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }

  // 3. Interference pattern - superposition of waves creating a 3D surface
  for (let i = 0; i < interferenceParticles && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (Math.random() - 0.5) * 2.0 * scale;
    const v = (Math.random() - 0.5) * 2.0 * scale;
    
    // Combined wave interference
    const wave1 = Math.sin(u * wave1Freq * Math.PI);
    const wave2 = Math.sin(v * wave2Freq * Math.PI);
    const wave3 = Math.sin((u + v) * wave3Freq * Math.PI);
    
    const interference = (wave1 + wave2 + wave3) / 3.0 * amplitude * 0.8;
    
    const x = u;
    const y = interference;
    const z = v;
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    
    // Color based on interference amplitude (constructive = bright, destructive = dim)
    const interferenceStrength = Math.abs(interference) / amplitude;
    const c = electricBlue.clone().lerp(cyan, interferenceStrength);
    c.lerp(violet, Math.abs(wave3) * 0.4);
    c.lerp(white, interferenceStrength * 0.3);
    c.multiplyScalar(0.5 + interferenceStrength * 0.5);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  // 4. Nodes (points of maximum constructive interference)
  const nodeRadius = 0.05;
  const nodePositionsArr: THREE.Vector3[] = [];
  
  // Find approximate node positions
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = i * 0.4 * scale;
      const z = j * 0.4 * scale;
      const wave1 = Math.sin(x * wave1Freq * Math.PI);
      const wave2 = Math.sin(z * wave2Freq * Math.PI);
      const y = (wave1 + wave2) / 2.0 * amplitude;
      
      if (Math.abs(wave1 + wave2) > 1.5) {
        nodePositionsArr.push(new THREE.Vector3(x, y, z));
      }
    }
  }
  
  const particlesPerNode = Math.max(1, Math.floor(nodesParticles / Math.max(nodePositionsArr.length, 1)));
  
  for (let n = 0; n < nodePositionsArr.length && idx < wave1Particles + wave2Particles + interferenceParticles + nodesParticles; n++) {
    const node = nodePositionsArr[n];
    
    for (let i = 0; i < particlesPerNode && idx < wave1Particles + wave2Particles + interferenceParticles + nodesParticles; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.4) * nodeRadius;
      
      positions[idx * 3] = node.x + r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = node.y + r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = node.z + r * Math.cos(phi);
      
      const brightness = 1.0 - (r / nodeRadius) * 0.4;
      const c = white.clone().lerp(cyan, 0.3);
      c.multiplyScalar(0.8 + brightness * 0.2);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 3;
    }
  }

  // 5. Ambient cosmic particles
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.1 + Math.pow(Math.random(), 2) * 0.4;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    positions[idx * 3 + 2] = r * Math.cos(phi);
    
    const ambientColor = deepBlue.clone().lerp(violet, Math.random());
    ambientColor.multiplyScalar(0.12 + Math.random() * 0.08);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- QUANTUM ORBITALS ---
// Electron cloud style lobes based on spherical harmonics
// Visualizes p and d orbital shapes with glowing particle clouds

export function generateQuantumOrbitalsData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.85;
  const deepBlue = new THREE.Color('#1E3A8A');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const violet = new THREE.Color('#8B5CF6');
  const purple = new THREE.Color('#A855F7');
  const white = new THREE.Color('#FFFFFF');
  const pOrbitalCount = Math.floor(PARTICLE_COUNT * 0.34);
  const dOrbitalCount = Math.floor(PARTICLE_COUNT * 0.30);
  const nucleusCount = Math.floor(PARTICLE_COUNT * 0.08);
  const shellCount = Math.floor(PARTICLE_COUNT * 0.16);
  let idx = 0;

  const sampleEllipsoid = (
    center: THREE.Vector3,
    spread: THREE.Vector3,
    baseColor: THREE.Color,
    group: number,
    count: number
  ) => {
    for (let i = 0; i < count && idx < PARTICLE_COUNT; i++, idx++) {
      const r = Math.pow(Math.random(), 0.65);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[idx * 3] = center.x + Math.sin(phi) * Math.cos(theta) * spread.x * r;
      positions[idx * 3 + 1] = center.y + Math.sin(phi) * Math.sin(theta) * spread.y * r;
      positions[idx * 3 + 2] = center.z + Math.cos(phi) * spread.z * r;
      const c = baseColor.clone().lerp(white, 0.2 + Math.random() * 0.28);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = group;
    }
  };

  const pAxisCount = Math.floor(pOrbitalCount / 6);
  const pLobes = [
    { center: new THREE.Vector3(0.46, 0, 0), spread: new THREE.Vector3(0.2, 0.1, 0.14), color: electricBlue, group: 0 },
    { center: new THREE.Vector3(-0.46, 0, 0), spread: new THREE.Vector3(0.2, 0.1, 0.14), color: electricBlue, group: 0 },
    { center: new THREE.Vector3(0, 0.48, 0), spread: new THREE.Vector3(0.11, 0.22, 0.14), color: cyan, group: 1 },
    { center: new THREE.Vector3(0, -0.48, 0), spread: new THREE.Vector3(0.11, 0.22, 0.14), color: cyan, group: 1 },
    { center: new THREE.Vector3(0, 0, 0.48), spread: new THREE.Vector3(0.14, 0.1, 0.22), color: lightCyan, group: 2 },
    { center: new THREE.Vector3(0, 0, -0.48), spread: new THREE.Vector3(0.14, 0.1, 0.22), color: lightCyan, group: 2 },
  ];
  for (const lobe of pLobes) {
    sampleEllipsoid(lobe.center.multiplyScalar(scale), lobe.spread.multiplyScalar(scale), lobe.color, lobe.group, pAxisCount);
  }

  const z2RingCount = Math.max(1, Math.floor(dOrbitalCount * 0.14));
  const dCloudCount = Math.max(0, dOrbitalCount - z2RingCount);
  const dLobeCount = Math.floor(dCloudCount / 10);
  const dLobes = [
    { center: new THREE.Vector3(0.34, 0.34, 0), spread: new THREE.Vector3(0.15, 0.15, 0.09), color: violet, group: 3 },
    { center: new THREE.Vector3(-0.34, 0.34, 0), spread: new THREE.Vector3(0.15, 0.15, 0.09), color: violet, group: 3 },
    { center: new THREE.Vector3(0.34, -0.34, 0), spread: new THREE.Vector3(0.15, 0.15, 0.09), color: violet, group: 3 },
    { center: new THREE.Vector3(-0.34, -0.34, 0), spread: new THREE.Vector3(0.15, 0.15, 0.09), color: violet, group: 3 },
    { center: new THREE.Vector3(0.34, 0, 0.34), spread: new THREE.Vector3(0.15, 0.09, 0.15), color: purple, group: 4 },
    { center: new THREE.Vector3(-0.34, 0, -0.34), spread: new THREE.Vector3(0.15, 0.09, 0.15), color: purple, group: 4 },
    { center: new THREE.Vector3(-0.34, 0, 0.34), spread: new THREE.Vector3(0.15, 0.09, 0.15), color: purple, group: 4 },
    { center: new THREE.Vector3(0.34, 0, -0.34), spread: new THREE.Vector3(0.15, 0.09, 0.15), color: purple, group: 4 },
    { center: new THREE.Vector3(0, 0, 0.56), spread: new THREE.Vector3(0.11, 0.11, 0.19), color: cyan, group: 5 },
    { center: new THREE.Vector3(0, 0, -0.56), spread: new THREE.Vector3(0.11, 0.11, 0.19), color: cyan, group: 5 },
  ];
  for (const lobe of dLobes) {
    sampleEllipsoid(lobe.center.multiplyScalar(scale), lobe.spread.multiplyScalar(scale), lobe.color, lobe.group, dLobeCount);
  }

  for (let i = 0; i < z2RingCount && idx < pOrbitalCount + dOrbitalCount; i++, idx++) {
    const a = (i / z2RingCount) * Math.PI * 2;
    const radius = 0.34 * scale + (Math.random() - 0.5) * 0.045;
    positions[idx * 3] = Math.cos(a) * radius;
    positions[idx * 3 + 1] = Math.sin(a) * radius;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.045;
    const c = lightCyan.clone().lerp(white, 0.25 + Math.random() * 0.2);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 6;
  }

  for (let i = 0; i < nucleusCount && idx < pOrbitalCount + dOrbitalCount + nucleusCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.3) * 0.08 * scale;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const brightness = 1.0 - (r / (0.08 * scale)) * 0.3;
    const c = white.clone().lerp(cyan, 0.2);
    c.multiplyScalar(0.85 + brightness * 0.15);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 7;
  }

  const shellRadii = [0.3, 0.6, 0.9];
  const particlesPerShell = Math.floor(shellCount / shellRadii.length);
  for (let s = 0; s < shellRadii.length; s++) {
    const shellRadius = shellRadii[s] * scale;
    for (let i = 0; i < particlesPerShell && idx < pOrbitalCount + dOrbitalCount + nucleusCount + shellCount; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = shellRadius + (Math.random() - 0.5) * 0.04;
      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = r * Math.cos(phi);
      const c = deepBlue.clone().lerp(electricBlue, s / shellRadii.length);
      c.lerp(cyan, Math.random() * 0.3);
      c.multiplyScalar(0.4 + Math.random() * 0.3);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 8 + s;
    }
  }

  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.1 + Math.pow(Math.random(), 2) * 0.4;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const ambientColor = deepBlue.clone().lerp(violet, Math.random());
    ambientColor.multiplyScalar(0.1 + Math.random() * 0.08);
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 11;
  }

  return { positions, colors, groups };
}

// --- CELTIC KNOT ---
// Interlocking knot lines with particle glow using parametric curves
// Represents eternity, interconnectedness, and the infinite cycle

export function generateCelticKnotData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.92;
  const deepGold = new THREE.Color('#B8860B');
  const gold = new THREE.Color('#FFD700');
  const amber = new THREE.Color('#FFBF00');
  const bronze = new THREE.Color('#CD7F32');
  const copper = new THREE.Color('#B87333');
  const white = new THREE.Color('#FFFFFF');
  const emerald = new THREE.Color('#10B981');
  const strandCount = Math.floor(PARTICLE_COUNT * 0.6);
  const crossingCount = Math.floor(PARTICLE_COUNT * 0.12);
  const haloCount = Math.floor(PARTICLE_COUNT * 0.12);
  let idx = 0;

  const loops = [
    new THREE.Vector2(0, 0.34),
    new THREE.Vector2(-0.3, -0.18),
    new THREE.Vector2(0.3, -0.18),
  ];
  const loopRadius = 0.44 * scale;
  const particlesPerLoop = Math.floor(strandCount / loops.length);

  const loopPoint = (loopIdx: number, t: number) => {
    const center = loops[loopIdx];
    const x = center.x * scale + Math.cos(t) * loopRadius;
    const y = center.y * scale + Math.sin(t) * loopRadius;
    const weavePhase = t * 3 + loopIdx * ((Math.PI * 2) / 3);
    const z = Math.sin(weavePhase) * 0.12;
    return new THREE.Vector3(x, y, z);
  };

  for (let loopIdx = 0; loopIdx < loops.length; loopIdx++) {
    for (let i = 0; i < particlesPerLoop && idx < PARTICLE_COUNT; i++, idx++) {
      const t = (i / particlesPerLoop) * Math.PI * 2;
      const pos = loopPoint(loopIdx, t);
      const next = loopPoint(loopIdx, t + 0.01);
      const tangent = next.clone().sub(pos).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const radius = Math.random() * 0.022;
      const a = Math.random() * Math.PI * 2;
      const offset = normal.multiplyScalar(Math.cos(a) * radius).add(binormal.multiplyScalar(Math.sin(a) * radius));
      positions[idx * 3] = pos.x + offset.x;
      positions[idx * 3 + 1] = pos.y + offset.y;
      positions[idx * 3 + 2] = pos.z + offset.z;
      const c = gold.clone().lerp(amber, loopIdx * 0.22).lerp(white, Math.random() * 0.16);
      c.lerp(emerald, Math.max(0, Math.sin(t * 3)) * 0.08);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = loopIdx === 0 ? 0 : 1;
    }
  }

  const crossings = [
    new THREE.Vector3(0, 0.17, 0),
    new THREE.Vector3(-0.26, -0.16, 0),
    new THREE.Vector3(0.26, -0.16, 0),
    new THREE.Vector3(0, -0.42, 0),
  ];
  const perCrossing = Math.max(1, Math.floor(crossingCount / crossings.length));
  for (const crossing of crossings) {
    for (let i = 0; i < perCrossing && idx < PARTICLE_COUNT; i++, idx++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.45) * 0.06;
      positions[idx * 3] = crossing.x + Math.cos(theta) * r;
      positions[idx * 3 + 1] = crossing.y + Math.sin(theta) * r * 0.78;
      positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.05;
      const c = white.clone().lerp(gold, 0.4).lerp(emerald, Math.random() * 0.12);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 2;
    }
  }

  for (let i = 0; i < haloCount && idx < PARTICLE_COUNT; i++, idx++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.82 + Math.pow(Math.random(), 1.6) * 0.26;
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = Math.sin(angle) * radius * 0.82;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.2;
    const glowColor = deepGold.clone().lerp(bronze, Math.random()).multiplyScalar(0.26 + Math.random() * 0.14);
    colors[idx * 3] = glowColor.r;
    colors[idx * 3 + 1] = glowColor.g;
    colors[idx * 3 + 2] = glowColor.b;
    groups[idx] = 3;
  }

  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.pow(Math.random(), 2) * 0.5;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.4;
    const ambientColor = deepGold.clone().lerp(bronze, Math.random());
    ambientColor.multiplyScalar(0.1 + Math.random() * 0.08);
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- STARBURST NOVA ---
// Radial explosion rays with particle trails creating a cosmic nova effect
// Represents explosive creation, energy release, and cosmic birth

export function generateStarburstNovaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.95;
  const white = new THREE.Color('#FFFFFF');
  const hotWhite = new THREE.Color('#F0F8FF');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const deepBlue = new THREE.Color('#1E40AF');
  const violet = new THREE.Color('#8B5CF6');

  const numMajorRays = 12;
  const numMinorRays = 24;
  const coreRadius = 0.12 * scale;
  const maxRayLength = 1.1 * scale;

  const coreCount = Math.floor(PARTICLE_COUNT * 0.15);
  const majorRayCount = Math.floor(PARTICLE_COUNT * 0.35);
  const minorRayCount = Math.floor(PARTICLE_COUNT * 0.25);
  const trailCount = Math.floor(PARTICLE_COUNT * 0.15);
  
  let idx = 0;

  for (let i = 0; i < coreCount && idx < PARTICLE_COUNT; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.4) * coreRadius;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const brightness = 1.0 - (r / coreRadius) * 0.3;
    const c = white.clone().lerp(hotWhite, Math.random() * 0.3);
    c.multiplyScalar(0.9 + brightness * 0.1);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  const particlesPerMajorRay = Math.floor(majorRayCount / numMajorRays);
  for (let ray = 0; ray < numMajorRays; ray++) {
    const rayTheta = (ray / numMajorRays) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const rayPhi = Math.acos(2 * ((ray % 3) / 3 + Math.random() * 0.3) - 1);
    const rayDir = new THREE.Vector3(
      Math.sin(rayPhi) * Math.cos(rayTheta),
      Math.sin(rayPhi) * Math.sin(rayTheta),
      Math.cos(rayPhi)
    ).normalize();
    const rayLength = maxRayLength * (0.7 + Math.random() * 0.3);
    
    for (let i = 0; i < particlesPerMajorRay && idx < coreCount + majorRayCount; i++, idx++) {
      const t = Math.pow(i / particlesPerMajorRay, 0.6);
      const dist = coreRadius + t * rayLength;
      const thickness = 0.04 * (1 - t * 0.7);
      const perpTheta = Math.random() * Math.PI * 2;
      const perpDist = Math.random() * thickness;
      const up = Math.abs(rayDir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const perp1 = new THREE.Vector3().crossVectors(rayDir, up).normalize();
      const perp2 = new THREE.Vector3().crossVectors(rayDir, perp1).normalize();
      const x = rayDir.x * dist + perp1.x * Math.cos(perpTheta) * perpDist + perp2.x * Math.sin(perpTheta) * perpDist;
      const y = rayDir.y * dist + perp1.y * Math.cos(perpTheta) * perpDist + perp2.y * Math.sin(perpTheta) * perpDist;
      const z = rayDir.z * dist + perp1.z * Math.cos(perpTheta) * perpDist + perp2.z * Math.sin(perpTheta) * perpDist;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      const c = white.clone();
      c.lerp(lightCyan, t * 0.6);
      c.lerp(electricBlue, t * 0.4);
      c.multiplyScalar(1.0 - t * 0.4);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  const particlesPerMinorRay = Math.floor(minorRayCount / numMinorRays);
  for (let ray = 0; ray < numMinorRays; ray++) {
    const rayTheta = Math.random() * Math.PI * 2;
    const rayPhi = Math.acos(2 * Math.random() - 1);
    const rayDir = new THREE.Vector3(
      Math.sin(rayPhi) * Math.cos(rayTheta),
      Math.sin(rayPhi) * Math.sin(rayTheta),
      Math.cos(rayPhi)
    ).normalize();
    const rayLength = maxRayLength * (0.4 + Math.random() * 0.4);
    
    for (let i = 0; i < particlesPerMinorRay && idx < coreCount + majorRayCount + minorRayCount; i++, idx++) {
      const t = Math.pow(i / particlesPerMinorRay, 0.5);
      const dist = coreRadius * 0.8 + t * rayLength;
      const thickness = 0.02 * (1 - t * 0.6);
      positions[idx * 3] = rayDir.x * dist + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 1] = rayDir.y * dist + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 2] = rayDir.z * dist + (Math.random() - 0.5) * thickness;
      const c = cyan.clone().lerp(violet, t * 0.5);
      c.lerp(lightCyan, Math.random() * 0.2);
      c.multiplyScalar(0.7 - t * 0.3);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 2;
    }
  }

  for (let i = 0; i < trailCount && idx < coreCount + majorRayCount + minorRayCount + trailCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = coreRadius + Math.pow(Math.random(), 0.8) * maxRayLength * 1.2;
    const spiralAngle = r * 2;
    const spiralOffset = 0.05 * Math.sin(spiralAngle);
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta + spiralOffset);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta + spiralOffset);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const distFactor = (r - coreRadius) / (maxRayLength * 1.2);
    const c = electricBlue.clone().lerp(deepBlue, distFactor);
    c.multiplyScalar(0.4 - distFactor * 0.25);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 3;
  }

  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2 + Math.pow(Math.random(), 2) * 0.4;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const ambientColor = deepBlue.clone().lerp(violet, Math.random());
    ambientColor.multiplyScalar(0.08 + Math.random() * 0.06);
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- LATTICE WAVE ---
// 3D grid with wave propagation particles creating a matrix-like structure
// Represents the fabric of spacetime, quantum field fluctuations

export function generateLatticeWaveData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.9;
  const gridSize = 8;
  const cellSize = 0.2 * scale;
  const gridExtent = (gridSize * cellSize) / 2;
  
  const deepBlue = new THREE.Color('#1E3A8A');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const teal = new THREE.Color('#14B8A6');
  const white = new THREE.Color('#FFFFFF');

  const waveFreq1 = 2.5;
  const waveFreq2 = 3.0;
  const waveAmplitude = 0.08 * scale;

  const gridNodeCount = Math.floor(PARTICLE_COUNT * 0.25);
  const gridEdgeCount = Math.floor(PARTICLE_COUNT * 0.35);
  const waveParticleCount = Math.floor(PARTICLE_COUNT * 0.25);
  const glowCount = Math.floor(PARTICLE_COUNT * 0.08);
  
  let idx = 0;

  const getWaveDisplacement = (x: number, y: number, z: number) => {
    const wave1 = Math.sin(x * waveFreq1 + y * waveFreq2) * waveAmplitude;
    const wave2 = Math.sin(y * waveFreq2 + z * waveFreq1) * waveAmplitude;
    const wave3 = Math.sin(z * waveFreq1 + x * waveFreq2) * waveAmplitude;
    return { dx: wave2 * 0.5, dy: wave1, dz: wave3 * 0.5 };
  };

  const totalNodes = (gridSize + 1) * (gridSize + 1) * (gridSize + 1);
  const particlesPerNode = Math.max(1, Math.floor(gridNodeCount / totalNodes));
  
  for (let xi = 0; xi <= gridSize && idx < gridNodeCount; xi++) {
    for (let yi = 0; yi <= gridSize && idx < gridNodeCount; yi++) {
      for (let zi = 0; zi <= gridSize && idx < gridNodeCount; zi++) {
        const baseX = (xi - gridSize / 2) * cellSize;
        const baseY = (yi - gridSize / 2) * cellSize;
        const baseZ = (zi - gridSize / 2) * cellSize;
        const wave = getWaveDisplacement(baseX, baseY, baseZ);
        
        for (let p = 0; p < particlesPerNode && idx < gridNodeCount; p++, idx++) {
          const nodeRadius = 0.025;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.pow(Math.random(), 0.5) * nodeRadius;
          positions[idx * 3] = baseX + wave.dx + r * Math.sin(phi) * Math.cos(theta);
          positions[idx * 3 + 1] = baseY + wave.dy + r * Math.sin(phi) * Math.sin(theta);
          positions[idx * 3 + 2] = baseZ + wave.dz + r * Math.cos(phi);
          const waveIntensity = Math.abs(wave.dy) / waveAmplitude;
          const brightness = 0.6 + waveIntensity * 0.4;
          const c = lightCyan.clone().lerp(white, waveIntensity * 0.5);
          c.multiplyScalar(brightness);
          colors[idx * 3] = c.r;
          colors[idx * 3 + 1] = c.g;
          colors[idx * 3 + 2] = c.b;
          groups[idx] = 0;
        }
      }
    }
  }

  const totalEdges = gridSize * (gridSize + 1) * (gridSize + 1) * 3;
  const particlesPerEdge = Math.max(1, Math.floor(gridEdgeCount / totalEdges));
  
  for (let xi = 0; xi < gridSize && idx < gridNodeCount + gridEdgeCount; xi++) {
    for (let yi = 0; yi <= gridSize && idx < gridNodeCount + gridEdgeCount; yi++) {
      for (let zi = 0; zi <= gridSize && idx < gridNodeCount + gridEdgeCount; zi++) {
        const x1 = (xi - gridSize / 2) * cellSize;
        const x2 = (xi + 1 - gridSize / 2) * cellSize;
        const y = (yi - gridSize / 2) * cellSize;
        const z = (zi - gridSize / 2) * cellSize;
        for (let p = 0; p < particlesPerEdge && idx < gridNodeCount + gridEdgeCount; p++, idx++) {
          const t = p / particlesPerEdge;
          const x = x1 + (x2 - x1) * t;
          const wave = getWaveDisplacement(x, y, z);
          const thickness = 0.008;
          positions[idx * 3] = x + wave.dx + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 1] = y + wave.dy + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 2] = z + wave.dz + (Math.random() - 0.5) * thickness;
          const c = cyan.clone().lerp(electricBlue, t);
          c.multiplyScalar(0.5 + Math.abs(wave.dy) / waveAmplitude * 0.3);
          colors[idx * 3] = c.r;
          colors[idx * 3 + 1] = c.g;
          colors[idx * 3 + 2] = c.b;
          groups[idx] = 1;
        }
      }
    }
  }
  
  for (let xi = 0; xi <= gridSize && idx < gridNodeCount + gridEdgeCount; xi++) {
    for (let yi = 0; yi < gridSize && idx < gridNodeCount + gridEdgeCount; yi++) {
      for (let zi = 0; zi <= gridSize && idx < gridNodeCount + gridEdgeCount; zi++) {
        const x = (xi - gridSize / 2) * cellSize;
        const y1 = (yi - gridSize / 2) * cellSize;
        const y2 = (yi + 1 - gridSize / 2) * cellSize;
        const z = (zi - gridSize / 2) * cellSize;
        for (let p = 0; p < particlesPerEdge && idx < gridNodeCount + gridEdgeCount; p++, idx++) {
          const t = p / particlesPerEdge;
          const y = y1 + (y2 - y1) * t;
          const wave = getWaveDisplacement(x, y, z);
          const thickness = 0.008;
          positions[idx * 3] = x + wave.dx + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 1] = y + wave.dy + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 2] = z + wave.dz + (Math.random() - 0.5) * thickness;
          const c = teal.clone().lerp(cyan, t);
          c.multiplyScalar(0.5 + Math.abs(wave.dy) / waveAmplitude * 0.3);
          colors[idx * 3] = c.r;
          colors[idx * 3 + 1] = c.g;
          colors[idx * 3 + 2] = c.b;
          groups[idx] = 1;
        }
      }
    }
  }
  
  for (let xi = 0; xi <= gridSize && idx < gridNodeCount + gridEdgeCount; xi++) {
    for (let yi = 0; yi <= gridSize && idx < gridNodeCount + gridEdgeCount; yi++) {
      for (let zi = 0; zi < gridSize && idx < gridNodeCount + gridEdgeCount; zi++) {
        const x = (xi - gridSize / 2) * cellSize;
        const y = (yi - gridSize / 2) * cellSize;
        const z1 = (zi - gridSize / 2) * cellSize;
        const z2 = (zi + 1 - gridSize / 2) * cellSize;
        for (let p = 0; p < particlesPerEdge && idx < gridNodeCount + gridEdgeCount; p++, idx++) {
          const t = p / particlesPerEdge;
          const z = z1 + (z2 - z1) * t;
          const wave = getWaveDisplacement(x, y, z);
          const thickness = 0.008;
          positions[idx * 3] = x + wave.dx + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 1] = y + wave.dy + (Math.random() - 0.5) * thickness;
          positions[idx * 3 + 2] = z + wave.dz + (Math.random() - 0.5) * thickness;
          const c = electricBlue.clone().lerp(teal, t);
          c.multiplyScalar(0.5 + Math.abs(wave.dy) / waveAmplitude * 0.3);
          colors[idx * 3] = c.r;
          colors[idx * 3 + 1] = c.g;
          colors[idx * 3 + 2] = c.b;
          groups[idx] = 1;
        }
      }
    }
  }

  for (let i = 0; i < waveParticleCount && idx < gridNodeCount + gridEdgeCount + waveParticleCount; i++, idx++) {
    const x = (Math.random() - 0.5) * gridSize * cellSize * 1.1;
    const y = (Math.random() - 0.5) * gridSize * cellSize * 1.1;
    const z = (Math.random() - 0.5) * gridSize * cellSize * 1.1;
    const wave = getWaveDisplacement(x, y, z);
    positions[idx * 3] = x + wave.dx * 2;
    positions[idx * 3 + 1] = y + wave.dy * 2;
    positions[idx * 3 + 2] = z + wave.dz * 2;
    const wavePhase = Math.sin(x * waveFreq1 + y * waveFreq2 + z * waveFreq1);
    const c = cyan.clone().lerp(lightCyan, (wavePhase + 1) / 2);
    c.lerp(white, Math.abs(wavePhase) * 0.3);
    c.multiplyScalar(0.4 + Math.abs(wavePhase) * 0.4);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  for (let i = 0; i < glowCount && idx < gridNodeCount + gridEdgeCount + waveParticleCount + glowCount; i++, idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = gridExtent * 1.2 + Math.random() * 0.2;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const glowColor = deepBlue.clone().lerp(cyan, Math.random() * 0.4);
    glowColor.multiplyScalar(0.2 + Math.random() * 0.15);
    colors[idx * 3] = glowColor.r;
    colors[idx * 3 + 1] = glowColor.g;
    colors[idx * 3 + 2] = glowColor.b;
    groups[idx] = 3;
  }

  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.2 + Math.pow(Math.random(), 2) * 0.4;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const ambientColor = deepBlue.clone().lerp(teal, Math.random());
    ambientColor.multiplyScalar(0.08 + Math.random() * 0.06);
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

// --- SACRED FLAME ---
// Upward spiral flame with particle embers using helix + noise
// Represents transformation, purification, and eternal spiritual fire

export function generateSacredFlameData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.95;
  
  // Blue-cyan flame palette
  const deepBlue = new THREE.Color('#1E3A8A');
  const electricBlue = new THREE.Color('#3B82F6');
  const cyan = new THREE.Color('#22D3EE');
  const lightCyan = new THREE.Color('#67E8F9');
  const white = new THREE.Color('#FFFFFF');
  const teal = new THREE.Color('#14B8A6');
  const violet = new THREE.Color('#8B5CF6');

  // Flame parameters
  const flameHeight = 2.0 * scale;
  const baseRadius = 0.35 * scale;
  const spiralTurns = 4;
  const noiseScale = 2.5;

  // Simple noise function
  const noise = (x: number, y: number, z: number) => {
    const n1 = Math.sin(x * noiseScale + y * 1.3) * Math.cos(z * noiseScale * 0.8);
    const n2 = Math.sin(y * noiseScale * 1.2 + z * 0.9) * Math.cos(x * noiseScale);
    const n3 = Math.sin(z * noiseScale * 0.7 + x * 1.1) * Math.cos(y * noiseScale * 1.4);
    return (n1 + n2 + n3) / 3;
  };

  // Particle distribution
  const coreFlameCount = Math.floor(PARTICLE_COUNT * 0.40);
  const spiralCount = Math.floor(PARTICLE_COUNT * 0.25);
  const emberCount = Math.floor(PARTICLE_COUNT * 0.20);
  const glowCount = Math.floor(PARTICLE_COUNT * 0.08);

  let idx = 0;

  // 1. Core Flame - Dense upward flowing particles
  for (let i = 0; i < coreFlameCount && idx < PARTICLE_COUNT; i++, idx++) {
    const t = Math.pow(Math.random(), 0.6);
    const height = (t - 0.5) * flameHeight;
    
    const heightFactor = 1 - (t * 0.85);
    const currentRadius = baseRadius * heightFactor;
    
    const spiralAngle = t * spiralTurns * Math.PI * 2 + Math.random() * 0.5;
    const noiseOffset = noise(height * 2, spiralAngle, t * 3) * 0.15;
    
    const x = (currentRadius + noiseOffset) * Math.cos(spiralAngle);
    const z = (currentRadius + noiseOffset) * Math.sin(spiralAngle);
    const y = height + noise(x, height, z) * 0.1;
    
    const flicker = (Math.random() - 0.5) * 0.04 * (1 - t * 0.5);
    
    positions[idx * 3] = x + flicker;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z + flicker;
    
    const distFromCenter = Math.sqrt(x * x + z * z) / baseRadius;
    const c = white.clone();
    c.lerp(lightCyan, distFromCenter * 0.6);
    c.lerp(cyan, t * 0.5);
    c.lerp(electricBlue, t * 0.3);
    
    const brightness = 1.0 - t * 0.4;
    c.multiplyScalar(brightness);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }

  // 2. Spiral Streams - Distinct helical paths
  const numSpirals = 5;
  const particlesPerSpiral = Math.floor(spiralCount / numSpirals);
  
  for (let spiral = 0; spiral < numSpirals; spiral++) {
    const spiralOffset = (spiral / numSpirals) * Math.PI * 2;
    
    for (let i = 0; i < particlesPerSpiral && idx < coreFlameCount + spiralCount; i++, idx++) {
      const t = i / particlesPerSpiral;
      const height = (t - 0.4) * flameHeight;
      
      const expansion = Math.sin(t * Math.PI) * 0.3;
      const heightFactor = 1 - t * 0.8;
      const currentRadius = (baseRadius * 0.6 + expansion) * heightFactor;
      
      const angle = spiralOffset + t * spiralTurns * Math.PI * 2 * 1.5;
      const noiseVal = noise(t * 5, angle, spiral) * 0.08;
      
      const x = (currentRadius + noiseVal) * Math.cos(angle);
      const z = (currentRadius + noiseVal) * Math.sin(angle);
      const y = height;
      
      const thickness = 0.025 * (1 - t * 0.6);
      positions[idx * 3] = x + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 1] = y + (Math.random() - 0.5) * thickness;
      positions[idx * 3 + 2] = z + (Math.random() - 0.5) * thickness;
      
      const c = cyan.clone();
      c.lerp(teal, Math.sin(t * Math.PI) * 0.5);
      c.lerp(lightCyan, (1 - t) * 0.4);
      c.lerp(white, Math.random() * 0.15);
      c.multiplyScalar(0.8 - t * 0.3);
      
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }

  // 3. Embers - Rising particles with random trajectories
  for (let i = 0; i < emberCount && idx < coreFlameCount + spiralCount + emberCount; i++, idx++) {
    const baseAngle = Math.random() * Math.PI * 2;
    const baseRadius2 = Math.random() * baseRadius * 0.8;
    const startHeight = (Math.random() - 0.3) * flameHeight * 0.5;
    
    const riseT = Math.pow(Math.random(), 0.4);
    const riseHeight = startHeight + riseT * flameHeight * 0.8;
    const driftRadius = baseRadius2 + riseT * 0.4;
    const driftAngle = baseAngle + riseT * (Math.random() - 0.5) * 2;
    
    const flickerX = noise(riseT * 10, driftAngle, i) * 0.1;
    const flickerZ = noise(driftAngle, riseT * 10, i * 0.5) * 0.1;
    
    const x = driftRadius * Math.cos(driftAngle) + flickerX;
    const z = driftRadius * Math.sin(driftAngle) + flickerZ;
    const y = riseHeight;
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    
    const emberBrightness = 0.5 + Math.random() * 0.5;
    const c = lightCyan.clone();
    c.lerp(white, emberBrightness * 0.6);
    c.lerp(violet, riseT * 0.25);
    c.multiplyScalar((1 - riseT * 0.6) * emberBrightness);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  // 4. Outer Glow - Soft halo around flame
  for (let i = 0; i < glowCount && idx < coreFlameCount + spiralCount + emberCount + glowCount; i++, idx++) {
    const t = Math.random();
    const height = (t - 0.5) * flameHeight * 1.2;
    
    const glowRadius = baseRadius * (1.3 + Math.random() * 0.5) * (1 - t * 0.5);
    const angle = Math.random() * Math.PI * 2;
    
    const x = glowRadius * Math.cos(angle);
    const z = glowRadius * Math.sin(angle);
    const y = height;
    
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    
    const c = electricBlue.clone();
    c.lerp(deepBlue, Math.random() * 0.4);
    c.lerp(cyan, 0.3);
    c.multiplyScalar(0.2 + Math.random() * 0.15);
    
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 3;
  }

  // 5. Ambient cosmic particles
  for (; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.1 + Math.pow(Math.random(), 2) * 0.5;
    
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta) * 0.7;
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.3 - 0.1;
    positions[idx * 3 + 2] = r * Math.cos(phi) * 0.7;
    
    const ambientColor = deepBlue.clone().lerp(violet, Math.random());
    ambientColor.multiplyScalar(0.08 + Math.random() * 0.06);
    
    colors[idx * 3] = ambientColor.r;
    colors[idx * 3 + 1] = ambientColor.g;
    colors[idx * 3 + 2] = ambientColor.b;
    groups[idx] = 4;
  }

  return { positions, colors, groups };
}

const fillAmbientParticles = (
  positions: Float32Array,
  colors: Float32Array,
  groups: Float32Array,
  startIdx: number,
  innerColor: THREE.Color,
  outerColor: THREE.Color,
  radiusScale = 1.4
) => {
  for (let idx = startIdx; idx < PARTICLE_COUNT; idx++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radiusScale + Math.pow(Math.random(), 2) * 0.6;
    positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = r * Math.cos(phi);
    const ambient = innerColor.clone().lerp(outerColor, Math.random());
    ambient.multiplyScalar(0.08 + Math.random() * 0.08);
    colors[idx * 3] = ambient.r;
    colors[idx * 3 + 1] = ambient.g;
    colors[idx * 3 + 2] = ambient.b;
    groups[idx] = 4;
  }
};

// --- METATRON'S CUBE ---
export function generateMetatronsCubeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#67E8F9');
  const blue = new THREE.Color('#3B82F6');
  const gold = new THREE.Color('#FDE68A');
  const centers: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  const radius = 0.62;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    centers.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push(new THREE.Vector3(Math.cos(angle) * radius * 1.73, Math.sin(angle) * radius * 1.73, 0));
  }
  const edgePairs: Array<[number, number]> = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      if (centers[i].distanceTo(centers[j]) < 1.25) edgePairs.push([i, j]);
    }
  }
  const nodeCount = Math.floor(PARTICLE_COUNT * 0.2);
  const edgeCount = Math.floor(PARTICLE_COUNT * 0.65);
  let idx = 0;
  for (let i = 0; i < nodeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const center = centers[i % centers.length];
    const p = center.clone().add(randomInSphere().multiplyScalar(0.05));
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    const c = white.clone().lerp(gold, Math.random() * 0.35);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }
  for (let i = 0; i < edgeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const [a, b] = edgePairs[i % edgePairs.length];
    const p = new THREE.Vector3().lerpVectors(centers[a], centers[b], Math.random()).add(randomInSphere().multiplyScalar(0.016));
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z + (Math.random() - 0.5) * 0.04;
    const c = cyan.clone().lerp(blue, Math.random() * 0.5).lerp(white, Math.random() * 0.1);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, cyan, 1.35);
  return { positions, colors, groups };
}

// --- TORUS FLOWER ---
export function generateTorusFlowerData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const pink = new THREE.Color('#F9A8D4');
  const cyan = new THREE.Color('#67E8F9');
  const violet = new THREE.Color('#A78BFA');
  const rose = new THREE.Color('#FB7185');
  let idx = 0;
  const petalLoops = 8;
  const petalCount = Math.floor(PARTICLE_COUNT * 0.52);
  const ringCount = Math.floor(PARTICLE_COUNT * 0.18);
  const coreCount = Math.floor(PARTICLE_COUNT * 0.1);

  for (let i = 0; i < petalCount && idx < PARTICLE_COUNT; i++, idx++) {
    const petal = i % petalLoops;
    const t = ((i / petalLoops) / Math.ceil(petalCount / petalLoops)) * Math.PI * 2;
    const baseAngle = (petal / petalLoops) * Math.PI * 2;
    const petalRadius = 0.42 + 0.14 * Math.sin(t);
    const orbit = 0.38 + 0.36 * (Math.sin(t * 0.5) * 0.5 + 0.5);
    const cx = Math.cos(baseAngle) * orbit;
    const cy = Math.sin(baseAngle) * orbit;
    const x = cx + Math.cos(baseAngle) * Math.cos(t) * petalRadius - Math.sin(baseAngle) * Math.sin(t) * 0.16;
    const y = cy + Math.sin(baseAngle) * Math.cos(t) * petalRadius + Math.cos(baseAngle) * Math.sin(t) * 0.16;
    const z = Math.sin(t) * 0.18 + Math.cos(t * 2) * 0.05;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    const c = pink.clone().lerp(violet, petal / petalLoops).lerp(white, Math.max(0, Math.cos(t)) * 0.16);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = petal % 2 === 0 ? 0 : 2;
  }

  for (let i = 0; i < ringCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (i / ringCount) * Math.PI * 2;
    const radius = 0.54 + Math.sin(u * petalLoops) * 0.06;
    positions[idx * 3] = Math.cos(u) * radius;
    positions[idx * 3 + 1] = Math.sin(u) * radius;
    positions[idx * 3 + 2] = Math.cos(u * petalLoops) * 0.08;
    const c = cyan.clone().lerp(violet, 0.35).lerp(white, 0.18);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 1;
  }

  for (let i = 0; i < coreCount && idx < PARTICLE_COUNT; i++, idx++) {
    const u = (i / coreCount) * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.6) * 0.18;
    positions[idx * 3] = Math.cos(u) * r;
    positions[idx * 3 + 1] = Math.sin(u) * r;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.08;
    const c = rose.clone().lerp(white, 0.35 + Math.random() * 0.25);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }

  fillAmbientParticles(positions, colors, groups, idx, violet, cyan, 1.38);
  return { positions, colors, groups };
}

// --- LOTUS MANDALA ---
export function generateLotusMandalaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const rose = new THREE.Color('#FDA4AF');
  const magenta = new THREE.Color('#F472B6');
  const violet = new THREE.Color('#C084FC');
  let idx = 0;
  const petals = 12;
  const petalCount = Math.floor(PARTICLE_COUNT * 0.7);
  for (let i = 0; i < petalCount && idx < PARTICLE_COUNT; i++, idx++) {
    const petal = i % petals;
    const t = Math.random();
    const petalAngle = (petal / petals) * Math.PI * 2;
    const spread = Math.sin(t * Math.PI) * 0.38;
    const radius = 0.18 + t * 0.95;
    const x = Math.cos(petalAngle) * radius + Math.cos(petalAngle + Math.PI / 2) * spread * 0.3;
    const y = Math.sin(petalAngle) * radius + Math.sin(petalAngle + Math.PI / 2) * spread * 0.3;
    const z = Math.sin(t * Math.PI) * 0.18 * (petal % 2 === 0 ? 1 : -1);
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    const c = rose.clone().lerp(magenta, t * 0.5).lerp(violet, petal / petals).lerp(white, Math.random() * 0.12);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = petal % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, magenta, violet, 1.3);
  return { positions, colors, groups };
}

// --- PHOENIX SPIRAL ---
export function generatePhoenixSpiralData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const ember = new THREE.Color('#FB7185');
  const orange = new THREE.Color('#FB923C');
  const gold = new THREE.Color('#FDE68A');
  const blue = new THREE.Color('#38BDF8');
  let idx = 0;
  const wingCount = Math.floor(PARTICLE_COUNT * 0.78);
  for (let i = 0; i < wingCount && idx < PARTICLE_COUNT; i++, idx++) {
    const t = Math.random();
    const side = i % 2 === 0 ? 1 : -1;
    const angle = t * Math.PI * 1.8 + side * 0.35;
    const radius = 0.18 + t * 1.25;
    positions[idx * 3] = side * radius * Math.cos(angle) * 0.9;
    positions[idx * 3 + 1] = t * 1.9 - 0.7;
    positions[idx * 3 + 2] = radius * Math.sin(angle) * 0.45;
    const c = orange.clone().lerp(gold, 1 - t).lerp(ember, t * 0.7).lerp(blue, Math.max(0, t - 0.8) * 0.7);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = side > 0 ? 0 : 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, orange, blue, 1.45);
  return { positions, colors, groups };
}

// --- VESICA PISCIS ---
export function generateVesicaPiscisData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#7DD3FC');
  const teal = new THREE.Color('#2DD4BF');
  const left = new THREE.Vector3(-0.33, 0, 0);
  const right = new THREE.Vector3(0.33, 0, 0);
  const r = 0.7;
  let idx = 0;
  const circlePointsPerSide = Math.floor(PARTICLE_COUNT * 0.28);
  const lensCount = Math.floor(PARTICLE_COUNT * 0.22);

  for (let side = 0; side < 2 && idx < PARTICLE_COUNT; side++) {
    const center = side === 0 ? left : right;
    for (let i = 0; i < circlePointsPerSide && idx < PARTICLE_COUNT; i++, idx++) {
      const theta = (i / circlePointsPerSide) * Math.PI * 2;
      const jitter = (Math.sin(i * 12.37) * 0.5 + 0.5) * 0.01;
      positions[idx * 3] = center.x + Math.cos(theta) * (r + jitter);
      positions[idx * 3 + 1] = center.y + Math.sin(theta) * (r + jitter);
      positions[idx * 3 + 2] = Math.sin(theta * 2) * 0.06;
      const c = (side === 0 ? cyan : teal).clone().lerp(white, 0.12 + 0.12 * Math.sin(theta * 2) ** 2);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = side;
    }
  }

  let attempts = 0;
  while (idx < circlePointsPerSide * 2 + lensCount && idx < PARTICLE_COUNT && attempts < lensCount * 20) {
    attempts++;
    const x = (Math.random() - 0.5) * 0.9;
    const y = (Math.random() - 0.5) * 1.15;
    const p = new THREE.Vector3(x, y, (Math.random() - 0.5) * 0.08);
    if (p.distanceTo(left) <= r && p.distanceTo(right) <= r) {
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      const c = white.clone().lerp(cyan, Math.abs(y) * 0.25).lerp(teal, Math.abs(x) * 0.25);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 2;
      idx++;
    }
  }
  fillAmbientParticles(positions, colors, groups, idx, cyan, teal, 1.25);
  return { positions, colors, groups };
}

// --- CROWN CHAKRA ---
export function generateCrownChakraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const violet = new THREE.Color('#A855F7');
  const indigo = new THREE.Color('#6366F1');
  const white = new THREE.Color('#FFFFFF');
  let idx = 0;
  const ringCount = Math.floor(PARTICLE_COUNT * 0.7);
  for (let i = 0; i < ringCount && idx < PARTICLE_COUNT; i++, idx++) {
    const layer = i % 7;
    const theta = Math.random() * Math.PI * 2;
    const radius = 0.25 + layer * 0.1;
    positions[idx * 3] = Math.cos(theta) * radius;
    positions[idx * 3 + 1] = 0.85 - layer * 0.12 + (Math.random() - 0.5) * 0.03;
    positions[idx * 3 + 2] = Math.sin(theta) * radius;
    const c = white.clone().lerp(violet, layer / 7).lerp(indigo, Math.random() * 0.35);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = layer % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, violet, white, 1.35);
  return { positions, colors, groups };
}

// --- COSMIC SERPENT ---
export function generateCosmicSerpentData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const emerald = new THREE.Color('#34D399');
  const teal = new THREE.Color('#14B8A6');
  const gold = new THREE.Color('#FDE68A');
  let idx = 0;
  const bodyCount = Math.floor(PARTICLE_COUNT * 0.78);
  for (let i = 0; i < bodyCount && idx < PARTICLE_COUNT; i++, idx++) {
    const t = i / bodyCount;
    const angle = t * Math.PI * 10;
    const radius = 0.3 + 0.45 * Math.sin(t * Math.PI);
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = t * 2.2 - 1.1;
    positions[idx * 3 + 2] = Math.sin(angle) * radius * 0.75;
    const c = emerald.clone().lerp(teal, t * 0.6).lerp(gold, Math.max(0, t - 0.78) * 2.5);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = t > 0.82 ? 1 : 0;
  }
  fillAmbientParticles(positions, colors, groups, idx, teal, emerald, 1.4);
  return { positions, colors, groups };
}

// --- PRISM FIELD ---
export function generatePrismFieldData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const spectrum = ['#F87171', '#FBBF24', '#4ADE80', '#38BDF8', '#818CF8', '#F472B6'].map((c) => new THREE.Color(c));
  let idx = 0;
  const gridCount = Math.floor(PARTICLE_COUNT * 0.74);
  for (let i = 0; i < gridCount && idx < PARTICLE_COUNT; i++, idx++) {
    const x = (Math.floor(Math.random() * 9) - 4) * 0.22;
    const y = (Math.floor(Math.random() * 9) - 4) * 0.22;
    const z = (Math.floor(Math.random() * 9) - 4) * 0.22;
    positions[idx * 3] = x + (Math.random() - 0.5) * 0.04;
    positions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.04;
    positions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.04;
    const color = spectrum[Math.floor(Math.abs(x + y + z) * 10) % spectrum.length];
    colors[idx * 3] = color.r; colors[idx * 3 + 1] = color.g; colors[idx * 3 + 2] = color.b;
    groups[idx] = Math.floor(Math.abs(z) * 10) % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, spectrum[3], spectrum[5], 1.45);
  return { positions, colors, groups };
}

// --- HALO BLOOM ---
export function generateHaloBloomData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#A5F3FC');
  const violet = new THREE.Color('#C4B5FD');
  let idx = 0;
  const bloomCount = Math.floor(PARTICLE_COUNT * 0.75);
  for (let i = 0; i < bloomCount && idx < PARTICLE_COUNT; i++, idx++) {
    const ring = i % 5;
    const theta = Math.random() * Math.PI * 2;
    const radius = 0.18 + ring * 0.18;
    const lift = Math.sin(theta * 3) * 0.12;
    positions[idx * 3] = Math.cos(theta) * radius;
    positions[idx * 3 + 1] = lift;
    positions[idx * 3 + 2] = Math.sin(theta) * radius;
    const c = white.clone().lerp(cyan, ring / 5).lerp(violet, Math.sin(theta * 3) * 0.25 + 0.25);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = ring % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, cyan, violet, 1.35);
  return { positions, colors, groups };
}

// --- INFINITY PRAYER ---
export function generateInfinityPrayerData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FDE68A');
  const sky = new THREE.Color('#7DD3FC');
  const white = new THREE.Color('#FFFFFF');
  let idx = 0;
  const loopCount = Math.floor(PARTICLE_COUNT * 0.72);
  const half = Math.floor(loopCount / 2);
  for (let i = 0; i < half && idx + 1 < PARTICLE_COUNT; i++, idx += 2) {
    const t = (i / half) * Math.PI;
    const x = -0.92 * Math.sin(t);
    const y = 0.58 * Math.sin(t) * Math.cos(t);
    const z = 0.18 * Math.cos(t * 2);
    const jitterX = Math.sin(i * 5.73) * 0.015;
    const jitterY = Math.cos(i * 4.91) * 0.015;

    positions[idx * 3] = x + jitterX;
    positions[idx * 3 + 1] = y + jitterY;
    positions[idx * 3 + 2] = z;
    positions[(idx + 1) * 3] = -x - jitterX;
    positions[(idx + 1) * 3 + 1] = y + jitterY;
    positions[(idx + 1) * 3 + 2] = -z;

    const cLeft = gold.clone().lerp(white, Math.sin(t) * 0.16);
    const cRight = sky.clone().lerp(white, Math.sin(t) * 0.16);
    colors[idx * 3] = cLeft.r;
    colors[idx * 3 + 1] = cLeft.g;
    colors[idx * 3 + 2] = cLeft.b;
    colors[(idx + 1) * 3] = cRight.r;
    colors[(idx + 1) * 3 + 1] = cRight.g;
    colors[(idx + 1) * 3 + 2] = cRight.b;
    groups[idx] = 0;
    groups[idx + 1] = 1;
  }
  const knotCount = Math.floor(PARTICLE_COUNT * 0.08);
  for (let i = 0; i < knotCount && idx < PARTICLE_COUNT; i++, idx++) {
    const angle = (i / Math.max(1, knotCount)) * Math.PI * 2;
    positions[idx * 3] = Math.cos(angle) * 0.12;
    positions[idx * 3 + 1] = Math.sin(angle) * 0.12;
    positions[idx * 3 + 2] = Math.sin(angle * 2) * 0.04;
    const c = white.clone().lerp(gold, 0.2).lerp(sky, 0.2);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    groups[idx] = 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, gold, sky, 1.45);
  return { positions, colors, groups };
}

export function generateSeedOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const cyan = new THREE.Color('#67E8F9');
  const blue = new THREE.Color('#60A5FA');
  const white = new THREE.Color('#FFFFFF');
  const centers = [new THREE.Vector3(0, 0, 0)];
  const r = 0.42;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  let idx = 0;
  const circleCount = Math.floor(PARTICLE_COUNT * 0.75);
  for (let i = 0; i < circleCount && idx < PARTICLE_COUNT; i++, idx++) {
    const cIdx = i % centers.length;
    const theta = Math.random() * Math.PI * 2;
    const center = centers[cIdx];
    positions[idx * 3] = center.x + Math.cos(theta) * r + (Math.random() - 0.5) * 0.01;
    positions[idx * 3 + 1] = center.y + Math.sin(theta) * r + (Math.random() - 0.5) * 0.01;
    positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.05;
    const color = cyan.clone().lerp(blue, cIdx / centers.length).lerp(white, Math.random() * 0.15);
    colors[idx * 3] = color.r; colors[idx * 3 + 1] = color.g; colors[idx * 3 + 2] = color.b;
    groups[idx] = cIdx === 0 ? 0 : 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, cyan, 1.2);
  return { positions, colors, groups };
}

export function generateEggOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const violet = new THREE.Color('#A78BFA');
  const pink = new THREE.Color('#F9A8D4');
  const white = new THREE.Color('#FFFFFF');
  const nodes: THREE.Vector3[] = [];
  const layers = [-0.35, 0.35];
  for (const y of layers) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + (y > 0 ? Math.PI / 4 : 0);
      nodes.push(new THREE.Vector3(Math.cos(a) * 0.48, y, Math.sin(a) * 0.48));
    }
  }
  let idx = 0;
  const shellCount = Math.floor(PARTICLE_COUNT * 0.78);
  for (let i = 0; i < shellCount && idx < PARTICLE_COUNT; i++, idx++) {
    const n = nodes[i % nodes.length];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const rr = 0.22;
    positions[idx * 3] = n.x + rr * Math.sin(phi) * Math.cos(theta);
    positions[idx * 3 + 1] = n.y + rr * Math.sin(phi) * Math.sin(theta);
    positions[idx * 3 + 2] = n.z + rr * Math.cos(phi);
    const c = pink.clone().lerp(violet, (n.y + 0.35) / 0.7).lerp(white, Math.random() * 0.12);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = n.y > 0 ? 1 : 0;
  }
  fillAmbientParticles(positions, colors, groups, idx, violet, pink, 1.35);
  return { positions, colors, groups };
}

export function generateFruitOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FDE68A');
  const cyan = new THREE.Color('#67E8F9');
  const white = new THREE.Color('#FFFFFF');
  const centers: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  const ringR = 0.55;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push(new THREE.Vector3(Math.cos(a) * ringR, Math.sin(a) * ringR, 0));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push(new THREE.Vector3(Math.cos(a) * ringR * 1.75, Math.sin(a) * ringR * 1.75, 0));
  }
  let idx = 0;
  const nodeCount = Math.floor(PARTICLE_COUNT * 0.8);
  for (let i = 0; i < nodeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const center = centers[i % centers.length];
    const p = center.clone().add(randomInSphere().multiplyScalar(0.07));
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    const c = gold.clone().lerp(cyan, (i % centers.length) / centers.length).lerp(white, Math.random() * 0.12);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = i % centers.length === 0 ? 0 : 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, gold, cyan, 1.4);
  return { positions, colors, groups };
}

export function generateGoldenSpiralData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FBBF24');
  const amber = new THREE.Color('#F59E0B');
  const white = new THREE.Color('#FFFFFF');
  const phi = (1 + Math.sqrt(5)) / 2;
  let idx = 0;
  const spiralCount = Math.floor(PARTICLE_COUNT * 0.82);
  for (let i = 0; i < spiralCount && idx < PARTICLE_COUNT; i++, idx++) {
    const t = i / spiralCount;
    const angle = t * Math.PI * 8;
    const radius = 0.08 * Math.pow(phi, t * 3.6);
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = Math.sin(angle) * radius;
    positions[idx * 3 + 2] = (t - 0.5) * 0.35;
    const c = gold.clone().lerp(amber, t).lerp(white, Math.random() * 0.1);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = t < 0.25 ? 0 : t < 0.65 ? 1 : 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, gold, amber, 1.35);
  return { positions, colors, groups };
}

export function generateVectorEquilibriumData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const cyan = new THREE.Color('#22D3EE');
  const blue = new THREE.Color('#3B82F6');
  const white = new THREE.Color('#FFFFFF');
  const gold = new THREE.Color('#FDE68A');
  const vertices = [
    new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(-1, 1, 0), new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(1, 0, 1), new THREE.Vector3(1, 0, -1),
    new THREE.Vector3(-1, 0, 1), new THREE.Vector3(-1, 0, -1),
    new THREE.Vector3(0, 1, 1), new THREE.Vector3(0, 1, -1),
    new THREE.Vector3(0, -1, 1), new THREE.Vector3(0, -1, -1),
  ].map((v) => v.normalize().multiplyScalar(0.95));
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = vertices[i].distanceTo(vertices[j]);
      if (d > 0.95 && d < 1.45) edges.push([i, j]);
    }
  }
  let idx = 0;
  const edgeCount = Math.floor(PARTICLE_COUNT * 0.5);
  const ringCount = Math.floor(PARTICLE_COUNT * 0.18);
  const nodeCount = Math.floor(PARTICLE_COUNT * 0.12);
  for (let i = 0; i < edgeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const [a, b] = edges[i % edges.length];
    const p = new THREE.Vector3().lerpVectors(vertices[a], vertices[b], (i % 160) / 159).add(randomInSphere().multiplyScalar(0.012));
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    const c = cyan.clone().lerp(blue, (i % edges.length) / edges.length).lerp(white, 0.08);
    colors[idx * 3] = c.r; colors[idx * 3 + 1] = c.g; colors[idx * 3 + 2] = c.b;
    groups[idx] = 0;
  }
  const circles = [
    (a: number) => new THREE.Vector3(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0),
    (a: number) => new THREE.Vector3(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95),
    (a: number) => new THREE.Vector3(0, Math.cos(a) * 0.95, Math.sin(a) * 0.95),
  ];
  const perRing = Math.floor(ringCount / circles.length);
  for (let ring = 0; ring < circles.length; ring++) {
    for (let i = 0; i < perRing && idx < PARTICLE_COUNT; i++, idx++) {
      const a = (i / perRing) * Math.PI * 2;
      const p = circles[ring](a).add(randomInSphere().multiplyScalar(0.012));
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      const c = gold.clone().lerp(white, 0.15).lerp(cyan, ring * 0.1);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      groups[idx] = 1;
    }
  }
  for (let i = 0; i < nodeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const p = vertices[i % vertices.length].clone().add(randomInSphere().multiplyScalar(0.035));
    positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
    colors[idx * 3] = white.r; colors[idx * 3 + 1] = white.g; colors[idx * 3 + 2] = white.b;
    groups[idx] = 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, cyan, 1.45);
  return { positions, colors, groups };
}

export function generateCurvedMerkabaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#67E8F9');
  const violet = new THREE.Color('#A78BFA');
  const gold = new THREE.Color('#FDE68A');
  let idx = 0;
  const tetraA = [
    new THREE.Vector3(0, 0.95, 0),
    new THREE.Vector3(-0.82, -0.42, 0.48),
    new THREE.Vector3(0.82, -0.42, 0.48),
    new THREE.Vector3(0, -0.42, -0.95),
  ];
  const tetraB = tetraA.map((v) => v.clone().multiplyScalar(-1));
  const edgeIndices: Array<[number, number]> = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
  const faceIndices: Array<[number, number, number]> = [[0,1,2],[0,2,3],[0,3,1],[1,3,2]];
  const edgeCount = Math.floor(PARTICLE_COUNT * 0.5);
  const orbitCount = Math.floor(PARTICLE_COUNT * 0.2);
  const coreCount = Math.floor(PARTICLE_COUNT * 0.06);

  for (let set = 0; set < 2; set++) {
    const vertices = set === 0 ? tetraA : tetraB;
    const perSet = Math.floor(edgeCount / 2);
    for (let i = 0; i < perSet && idx < PARTICLE_COUNT; i++, idx++) {
      const [a, b] = edgeIndices[i % edgeIndices.length];
      const t = (i % 90) / 89;
      const p = new THREE.Vector3().lerpVectors(vertices[a], vertices[b], t);
      const center = new THREE.Vector3().addVectors(vertices[a], vertices[b]).multiplyScalar(0.5);
      const bowDir = center.clone().normalize().multiplyScalar(Math.sin(t * Math.PI) * 0.06);
      p.add(bowDir);
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      const color = (set === 0 ? cyan : violet).clone().lerp(white, Math.sin(t * Math.PI) * 0.18);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
      groups[idx] = set;
    }
  }

  const allFaces = [
    ...faceIndices.map((face) => ({ face, vertices: tetraA, color: gold })),
    ...faceIndices.map((face) => ({ face, vertices: tetraB, color: white.clone().lerp(violet, 0.45) })),
  ];
  const perFace = Math.floor(orbitCount / allFaces.length);
  for (const entry of allFaces) {
    const [a, b, c] = entry.face;
    const va = entry.vertices[a];
    const vb = entry.vertices[b];
    const vc = entry.vertices[c];
    const center = new THREE.Vector3().add(va).add(vb).add(vc).multiplyScalar(1 / 3);
    const axis1 = vb.clone().sub(va).normalize();
    const normal = new THREE.Vector3().crossVectors(vb.clone().sub(va), vc.clone().sub(va)).normalize();
    const axis2 = new THREE.Vector3().crossVectors(normal, axis1).normalize();
    for (let i = 0; i < perFace && idx < PARTICLE_COUNT; i++, idx++) {
      const t = (i / perFace) * Math.PI * 2;
      const radius = 0.22 + Math.sin(t * 3) * 0.03;
      const p = center.clone()
        .add(axis1.clone().multiplyScalar(Math.cos(t) * radius))
        .add(axis2.clone().multiplyScalar(Math.sin(t) * radius))
        .add(normal.clone().multiplyScalar(0.05));
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      const color = entry.color.clone().lerp(white, 0.15 + Math.sin(t * 2) * 0.08 + 0.08);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;
      groups[idx] = 3;
    }
  }

  for (let i = 0; i < coreCount && idx < PARTICLE_COUNT; i++, idx++) {
    const p = randomInSphere().multiplyScalar(0.18);
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    colors[idx * 3] = white.r;
    colors[idx * 3 + 1] = white.g;
    colors[idx * 3 + 2] = white.b;
    groups[idx] = 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, cyan, violet, 1.35);
  return { positions, colors, groups };
}

export function generateCurvedMetatronData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const blue = new THREE.Color('#60A5FA');
  const cyan = new THREE.Color('#67E8F9');
  const gold = new THREE.Color('#FDE68A');
  const centers: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  const innerRadius = 0.56;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    centers.push(new THREE.Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, Math.sin(angle * 2) * 0.16));
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push(new THREE.Vector3(Math.cos(angle) * innerRadius * 1.72, Math.sin(angle) * innerRadius * 1.72, Math.cos(angle * 2) * 0.22));
  }
  const edgePairs: Array<[number, number]> = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      if (centers[i].distanceTo(centers[j]) < 1.45) edgePairs.push([i, j]);
    }
  }
  let idx = 0;
  const nodeCount = Math.floor(PARTICLE_COUNT * 0.18);
  const lineCount = Math.floor(PARTICLE_COUNT * 0.6);
  for (let i = 0; i < nodeCount && idx < PARTICLE_COUNT; i++, idx++) {
    const center = centers[i % centers.length];
    const p = center.clone().add(randomInSphere().multiplyScalar(0.05));
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    const color = white.clone().lerp(gold, Math.random() * 0.35);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 0;
  }
  for (let i = 0; i < lineCount && idx < PARTICLE_COUNT; i++, idx++) {
    const [a, b] = edgePairs[i % edgePairs.length];
    const tt = Math.random();
    const curve = Math.sin(tt * Math.PI) * 0.12;
    const p = new THREE.Vector3().lerpVectors(centers[a], centers[b], tt);
    p.z += curve;
    p.add(randomInSphere().multiplyScalar(0.015));
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    const color = cyan.clone().lerp(blue, Math.random() * 0.55).lerp(white, Math.random() * 0.08);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 1;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, cyan, 1.45);
  return { positions, colors, groups };
}

export function generateUnicursalHexagramData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const purple = new THREE.Color('#A855F7');
  const cyan = new THREE.Color('#22D3EE');
  const path: THREE.Vector3[] = [];
  const points = 720;
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const r = 0.78 + 0.24 * Math.sin(6 * t);
    path.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r, Math.sin(3 * t) * 0.16));
  }
  let idx = 0;
  const pathCount = Math.floor(PARTICLE_COUNT * 0.8);
  for (let i = 0; i < pathCount && idx < PARTICLE_COUNT; i++, idx++) {
    const p = path[i % path.length].clone().add(randomInSphere().multiplyScalar(0.02));
    positions[idx * 3] = p.x;
    positions[idx * 3 + 1] = p.y;
    positions[idx * 3 + 2] = p.z;
    const blend = (Math.sin((i / pathCount) * Math.PI * 4) + 1) / 2;
    const color = purple.clone().lerp(cyan, blend).lerp(white, Math.random() * 0.1);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = i % 6 === 0 ? 1 : 0;
  }
  fillAmbientParticles(positions, colors, groups, idx, purple, cyan, 1.32);
  return { positions, colors, groups };
}

export function generateYinYangFlowData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const pearl = new THREE.Color('#F8FAFC');
  const silver = new THREE.Color('#DBEAFE');
  const midnight = new THREE.Color('#0B1220');
  const indigo = new THREE.Color('#1E3A8A');
  const moon = new THREE.Color('#EFF6FF');
  let idx = 0;

  const boundaryAt = (y: number) => {
    const yy = Math.max(-1, Math.min(1, y));
    if (yy >= 0) {
      return Math.sqrt(Math.max(0, 0.25 - Math.pow(yy - 0.5, 2)));
    }
    return -Math.sqrt(Math.max(0, 0.25 - Math.pow(yy + 0.5, 2)));
  };

  const addPoint = (x: number, y: number, z: number, color: THREE.Color, group: number) => {
    if (idx >= PARTICLE_COUNT) return;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = group;
    idx++;
  };

  const shellCount = Math.floor(PARTICLE_COUNT * 0.64);
  let attempts = 0;
  while (idx < shellCount && attempts < PARTICLE_COUNT * 8) {
    attempts++;
    const dir = randomOnSphere();
    const y = dir.y;
    const x = dir.x;
    const boundary = boundaryAt(y);
    const topSeedZone = x * x + (y - 0.52) * (y - 0.52) < 0.085;
    const bottomSeedZone = x * x + (y + 0.52) * (y + 0.52) < 0.085;
    let isYang = x >= boundary;
    if (topSeedZone) isYang = false;
    if (bottomSeedZone) isYang = true;

    const radius = 0.98 + (Math.random() - 0.5) * 0.035;
    const p = dir.clone().multiplyScalar(radius);
    const boundaryDistance = Math.abs(x - boundary);
    const bulge = Math.max(0, 0.12 - boundaryDistance) * 0.04;
    p.z += (isYang ? 1 : -1) * bulge;
    if (boundaryDistance < 0.075) {
      p.z *= 0.12;
    }
    const c = (isYang ? pearl : midnight)
      .clone()
      .lerp(isYang ? silver : indigo, Math.abs(y) * 0.34)
      .lerp(moon, isYang ? Math.max(0, p.z) * 0.06 : 0);
    addPoint(p.x, p.y, p.z, c, isYang ? 1 : 0);
  }

  const boundaryCount = Math.floor(PARTICLE_COUNT * 0.1);
  for (let i = 0; i < boundaryCount && idx < PARTICLE_COUNT; i++) {
    const y = -0.98 + (i / Math.max(1, boundaryCount - 1)) * 1.96;
    const x = boundaryAt(y);
    const ringRadius = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    const theta = Math.random() * Math.PI * 2;
    const px = x + Math.cos(theta) * ringRadius * 0.008;
    const py = y + Math.sin(theta) * 0.004;
    const pz = Math.sin(theta) * ringRadius * 0.0008;
    const c = silver.clone().lerp(indigo, (y + 1) / 2).lerp(pearl, 0.2);
    addPoint(px, py, pz, c, 4);
  }

  const outerRingCount = Math.floor(PARTICLE_COUNT * 0.08);
  for (let i = 0; i < outerRingCount && idx < PARTICLE_COUNT; i++) {
    const theta = (i / Math.max(1, outerRingCount)) * Math.PI * 2;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    const boundary = boundaryAt(y);
    const isYang = x >= boundary;
    const color = (isYang ? pearl : midnight).clone().lerp(isYang ? silver : indigo, 0.22);
    addPoint(x, y, 0, color, 4);
  }

  const focalConfigs = [
    { center: new THREE.Vector3(0, 0.52, -0.24), radius: 0.18, colorA: midnight, colorB: indigo, group: 2 },
    { center: new THREE.Vector3(0, -0.52, 0.24), radius: 0.18, colorA: pearl, colorB: silver, group: 3 },
  ];
  for (const focal of focalConfigs) {
    const focalCount = Math.floor(PARTICLE_COUNT * 0.05);
    for (let i = 0; i < focalCount && idx < PARTICLE_COUNT; i++) {
      const theta = (i / focalCount) * Math.PI * 2;
      const x = focal.center.x + Math.cos(theta) * focal.radius;
      const y = focal.center.y + Math.sin(theta) * focal.radius;
      const z = focal.center.z + Math.sin(theta * 3) * 0.014;
      const color = focal.colorA.clone().lerp(focal.colorB, 0.45).lerp(new THREE.Color('#FFFFFF'), Math.random() * 0.12);
      addPoint(x, y, z, color, focal.group);
    }

    const glowCount = Math.floor(PARTICLE_COUNT * 0.025);
    for (let i = 0; i < glowCount && idx < PARTICLE_COUNT; i++) {
      const p = randomInSphere().multiplyScalar(0.10).add(focal.center);
      const color = focal.colorA.clone().lerp(new THREE.Color('#FFFFFF'), 0.25);
      addPoint(p.x, p.y, p.z, color, focal.group);
    }
  }

  fillAmbientParticles(positions, colors, groups, idx, silver, indigo, 1.34);
  return { positions, colors, groups };
}

export function generateSevenWavesData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const aqua = new THREE.Color('#2DD4BF');
  const blue = new THREE.Color('#3B82F6');
  const violet = new THREE.Color('#8B5CF6');
  let idx = 0;
  const waveCount = Math.floor(PARTICLE_COUNT * 0.82);
  for (let i = 0; i < waveCount && idx < PARTICLE_COUNT; i++, idx++) {
    const band = i % 7;
    const t = ((i / 7) % 260) / 259;
    const x = -1.15 + t * 2.3;
    const amplitude = 0.06 + band * 0.012;
    const y = Math.sin(t * Math.PI * 2 + band * 0.55) * amplitude;
    const z = (band - 3) * 0.14;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z + Math.cos(t * Math.PI * 2 + band * 0.5) * 0.025;
    const color = aqua.clone().lerp(blue, band / 6).lerp(violet, Math.abs(z) * 0.35);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = band % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, blue, violet, 1.42);
  return { positions, colors, groups };
}

export function generateSnowflakeMandalaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const ice = new THREE.Color('#BAE6FD');
  const cyan = new THREE.Color('#67E8F9');
  let idx = 0;
  const branchCount = Math.floor(PARTICLE_COUNT * 0.8);
  for (let i = 0; i < branchCount && idx < PARTICLE_COUNT; i++, idx++) {
    const branch = i % 6;
    const t = Math.random();
    const angle = (branch / 6) * Math.PI * 2;
    const radius = 0.12 + t * 1.02;
    const branchPulse = Math.sin(t * Math.PI * 3) * 0.14;
    const x = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 3) * branchPulse * 0.2;
    const y = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 3) * branchPulse * 0.2;
    const z = Math.sin(t * Math.PI * 6) * 0.08;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    const color = ice.clone().lerp(cyan, t * 0.6).lerp(white, Math.sin(t * Math.PI) * 0.3);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = t > 0.72 ? 1 : 0;
  }
  fillAmbientParticles(positions, colors, groups, idx, ice, cyan, 1.38);
  return { positions, colors, groups };
}

export function generateGoldenCirclesData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FBBF24');
  const amber = new THREE.Color('#F59E0B');
  const white = new THREE.Color('#FFFFFF');
  const phi = (1 + Math.sqrt(5)) / 2;
  let idx = 0;
  const circleCount = Math.floor(PARTICLE_COUNT * 0.8);
  for (let i = 0; i < circleCount && idx < PARTICLE_COUNT; i++, idx++) {
    const ring = i % 5;
    const theta = ((i / 5) % 320) / 319 * Math.PI * 2;
    const radius = 0.18 * Math.pow(phi, ring * 0.38);
    positions[idx * 3] = Math.cos(theta) * radius;
    positions[idx * 3 + 1] = Math.sin(theta) * radius;
    positions[idx * 3 + 2] = Math.sin(theta * 2 + ring * 0.7) * 0.035;
    const color = gold.clone().lerp(amber, ring / 4).lerp(white, Math.random() * 0.1);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = ring % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, gold, amber, 1.34);
  return { positions, colors, groups };
}

export function generateSphereOfCirclesData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const cyan = new THREE.Color('#67E8F9');
  const blue = new THREE.Color('#2563EB');
  let idx = 0;
  const ringCount = Math.floor(PARTICLE_COUNT * 0.82);
  for (let i = 0; i < ringCount && idx < PARTICLE_COUNT; i++, idx++) {
    const band = i % 9;
    const theta = Math.random() * Math.PI * 2;
    const lat = -0.95 + (band / 8) * 1.9;
    const bandRadius = Math.sqrt(Math.max(0, 1 - lat * lat)) * 0.98;
    positions[idx * 3] = Math.cos(theta) * bandRadius;
    positions[idx * 3 + 1] = lat;
    positions[idx * 3 + 2] = Math.sin(theta) * bandRadius;
    const color = cyan.clone().lerp(blue, band / 8).lerp(white, Math.random() * 0.12);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = band % 3;
  }
  fillAmbientParticles(positions, colors, groups, idx, cyan, blue, 1.3);
  return { positions, colors, groups };
}

export function generateCaduceusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const gold = new THREE.Color('#FDE68A');
  const emerald = new THREE.Color('#34D399');
  const blue = new THREE.Color('#38BDF8');
  const white = new THREE.Color('#FFFFFF');
  let idx = 0;
  const staffCount = Math.floor(PARTICLE_COUNT * 0.14);
  const serpentCount = Math.floor(PARTICLE_COUNT * 0.5);
  const wingCount = Math.floor(PARTICLE_COUNT * 0.16);
  const topCount = Math.floor(PARTICLE_COUNT * 0.04);
  for (let i = 0; i < staffCount && idx < PARTICLE_COUNT; i++, idx++) {
    const t = i / Math.max(1, staffCount - 1);
    positions[idx * 3] = 0;
    positions[idx * 3 + 1] = -1.08 + t * 2.16;
    positions[idx * 3 + 2] = 0;
    colors[idx * 3] = gold.r;
    colors[idx * 3 + 1] = gold.g;
    colors[idx * 3 + 2] = gold.b;
    groups[idx] = 2;
  }
  for (let i = 0; i < serpentCount && idx + 1 < PARTICLE_COUNT; i++, idx += 2) {
    const t = i / Math.max(1, serpentCount - 1);
    const y = -0.95 + t * 1.9;
    const angle = t * Math.PI * 5;
    const x = Math.sin(angle) * 0.3;
    const z = Math.cos(angle) * 0.16;
    positions[idx * 3] = x;
    positions[idx * 3 + 1] = y;
    positions[idx * 3 + 2] = z;
    positions[(idx + 1) * 3] = -x;
    positions[(idx + 1) * 3 + 1] = y;
    positions[(idx + 1) * 3 + 2] = -z;
    const color = emerald.clone().lerp(gold, Math.max(0, t - 0.72) * 2.5);
    const color2 = blue.clone().lerp(gold, Math.max(0, t - 0.72) * 2.5);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    colors[(idx + 1) * 3] = color2.r;
    colors[(idx + 1) * 3 + 1] = color2.g;
    colors[(idx + 1) * 3 + 2] = color2.b;
    groups[idx] = 0;
    groups[idx + 1] = 1;
  }
  for (let i = 0; i < wingCount && idx < PARTICLE_COUNT; i++, idx++) {
    const side = i % 2 === 0 ? 1 : -1;
    const t = ((i / 2) % Math.max(1, Math.floor(wingCount / 2))) / Math.max(1, Math.floor(wingCount / 2) - 1);
    const spread = Math.sin(t * Math.PI) * 0.5;
    positions[idx * 3] = side * (0.12 + spread);
    positions[idx * 3 + 1] = 0.72 + t * 0.28;
    positions[idx * 3 + 2] = Math.cos(t * Math.PI) * 0.18;
    const color = gold.clone().lerp(white, 0.12);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 3;
  }
  for (let i = 0; i < topCount && idx < PARTICLE_COUNT; i++, idx++) {
    const theta = (i / Math.max(1, topCount)) * Math.PI * 2;
    positions[idx * 3] = Math.cos(theta) * 0.12;
    positions[idx * 3 + 1] = 1.02;
    positions[idx * 3 + 2] = Math.sin(theta) * 0.12;
    const color = gold.clone().lerp(blue, 0.05);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = 4;
  }
  fillAmbientParticles(positions, colors, groups, idx, emerald, gold, 1.25);
  return { positions, colors, groups };
}

export function generateOctagramStarData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);
  const white = new THREE.Color('#FFFFFF');
  const violet = new THREE.Color('#8B5CF6');
  const pink = new THREE.Color('#F472B6');
  let idx = 0;
  const starCount = Math.floor(PARTICLE_COUNT * 0.82);
  for (let i = 0; i < starCount && idx < PARTICLE_COUNT; i++, idx++) {
    const arm = i % 8;
    const t = Math.random();
    const angle = (arm / 8) * Math.PI * 2;
    const radius = 0.15 + t * (arm % 2 === 0 ? 1.1 : 0.72);
    positions[idx * 3] = Math.cos(angle) * radius;
    positions[idx * 3 + 1] = Math.sin(angle) * radius;
    positions[idx * 3 + 2] = Math.sin(t * Math.PI * 2 + arm) * 0.12;
    const color = violet.clone().lerp(pink, arm / 8).lerp(white, Math.sin(t * Math.PI) * 0.2);
    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;
    groups[idx] = arm % 2;
  }
  fillAmbientParticles(positions, colors, groups, idx, violet, pink, 1.36);
  return { positions, colors, groups };
}
