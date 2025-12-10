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

// --- MUDRA (Prayer Hands) ---
export function generateMudraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const skin = new THREE.Color("#ffcc88");
  const gold = new THREE.Color("#ffd700");

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let p = new THREE.Vector3();
     let c = new THREE.Color();
     let g = 0;

     if (i < PARTICLE_COUNT * 0.08) {
        // Heart Chakra Glow
        g = 1;
        p = randomInSphere().multiplyScalar(0.15);
        p.y -= 0.1; // Centered near base of palms
        c.copy(gold).multiplyScalar(1.2);
     } else {
        // Hands
        g = 0;
        const isLeft = Math.random() > 0.5;
        
        // Model Right Hand roughly
        // Palm: Flattened sphere
        // Fingers: 5 cylinders
        const part = Math.random();
        
        let lx = 0, ly = 0, lz = 0;

        if (part < 0.45) {
           // Palm
           // x: 0.04..0.12 (thickness), y: -0.25..0, z: -0.1..0.1 (width)
           // Actually let's map it simpler:
           // Center (0.08, -0.15, 0)
           const u = Math.random();
           const v = Math.random();
           const theta = 2 * Math.PI * u;
           const phi = Math.acos(2 * v - 1);
           
           // Ellipsoid
           lx = 0.02 * Math.sin(phi) * Math.cos(theta); // Thickness x
           ly = 0.12 * Math.sin(phi) * Math.sin(theta); // Height y
           lz = 0.08 * Math.cos(phi); // Width z
           
           lx += 0.05; // Offset from center line
           ly -= 0.15; // Move down
           
           // Palm lines (denser)
           if (lx < 0.055 && Math.random() < 0.3) {
              c.setHex(0xffaa55);
           } else {
              c.copy(skin);
           }
        } else {
           // Fingers
           const fIdx = Math.floor(Math.random() * 5); // 0=Thumb, 1=Index...
           const fT = Math.random(); // Length along finger
           
           // Base positions (relative to palm top)
           // Index (1) to Pinky (4) are in a row at y~0
           // Thumb (0) is lower and side
           
           if (fIdx === 0) { // Thumb
              const len = 0.1;
              const angle = Math.PI / 3; // Stick out
              const r = 0.018;
              
              const h = fT * len;
              lx = 0.08 + Math.cos(angle)*h;
              ly = -0.15 + Math.sin(angle)*h; // Start from lower palm
              lz = 0.05 + (Math.random()-0.5)*r;
              
              // Add thickness
              lx += (Math.random()-0.5)*r;
              ly += (Math.random()-0.5)*r;
           } else {
              // Fingers 1-4
              // Spread Z: -0.06 to 0.06
              const zBase = ((fIdx - 2.5) * 0.035);
              let len = 0.16 - Math.abs(fIdx-2.5)*0.02; // Middle longest
              if (fIdx===4) len *= 0.8;
              
              const h = fT * len;
              const r = 0.014;
              
              lx = 0.05 + (Math.random()-0.5)*r;
              ly = -0.05 + h; // Start near top of palm
              lz = zBase + (Math.random()-0.5)*r;
              
              // Curvature: Bend tips inward (x decreases)
              lx -= (h*h)*1.5;
           }
           c.copy(skin);
        }

        // Apply
        p.set(lx, ly, lz);
        
        // Mirror if left
        if (isLeft) {
           p.x *= -1;
           // Tenting
           const ang = 0.15;
           const cz = Math.cos(ang), sz = Math.sin(ang);
           const nx = p.x * cz - p.z * sz;
           const nz = p.x * sz + p.z * cz;
           p.x = nx - 0.01; // Touch
           p.z = nz;
        } else {
           const ang = -0.15;
           const cz = Math.cos(ang), sz = Math.sin(ang);
           const nx = p.x * cz - p.z * sz;
           const nz = p.x * sz + p.z * cz;
           p.x = nx + 0.01;
           p.z = nz;
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

  // Sun direction (Left lit)
  const sunDir = new THREE.Vector3(-1, 0.2, 0.5).normalize();

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

     while (!found && attempts < 10) {
        attempts++;
        p = randomInSphere().normalize().multiplyScalar(R);

        // 1. Clouds (Floating) - 15% of particles
        if (i < PARTICLE_COUNT * 0.15) {
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
           const d = p.dot(node.v);
           if (d > node.minDot) {
              if (d > landDot) landDot = d; // Max overlap
           }
        }
        
        // Helper to find edge proximity
        // We know 'landDot' is the max dot product.
        // If landDot is close to minDot of the closest cap, it's an edge.
        // But we didn't save which cap.
        // Let's simplified check: if landDot is "just barely" passing any threshold.
        // Actually, let's just use random noise for texture for now to keep it clean.
        
        // Determine Day/Night
        const isLand = landDot > -1;
        const sunDot = p.dot(sunDir);
        const isNight = sunDot < -0.15;

        if (isLand) {
           if (isNight) {
               // Check Cities
               let isCity = false;
               for (const city of cityNodes) {
                  if (p.dot(city.v) > city.minDot) {
                     isCity = true;
                     break;
                  }
               }
               if (isCity) c.set(CONTINENT_COLORS.city);
               else c.set(CONTINENT_COLORS.land).multiplyScalar(0.25);
           } else {
               // Day Land
               c.set(CONTINENT_COLORS.land);
               // Ice caps
               if (Math.abs(p.y) > 0.9) c.set(CONTINENT_COLORS.ice);
           }
           // Boost density on land?
           found = true; 
        } else {
           // Ocean
           // Reduce ocean density to make land pop
           if (Math.random() > 0.6) { // Skip 60% of ocean points -> Land becomes denser relatively
               continue; 
           }
           
           if (isNight) c.set(CONTINENT_COLORS.ocean).multiplyScalar(0.2);
           else c.set(CONTINENT_COLORS.ocean);
           
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
