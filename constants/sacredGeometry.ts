import * as THREE from 'three';

export const PARTICLE_COUNT = 20000;

// Helper for random float
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// --- MERKABA ---
export function generateMerkabaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); // 0: T1 (Top/Gold), 1: T2 (Bottom/Silver), 2: Center

  // Merkaba = Two Interlocked Tetrahedrons (Star Tetrahedron)
  // T1 (Male/Sun): Point facing up. Gold + White Vertices.
  // T2 (Female/Earth): Point facing down. Silver + Blue Vertices.
  
  const scale = 1.1;
  const R = 1.0 * scale;

  // T1 Vertices (Apex Up)
  // V0: Top (0, R, 0)
  // Base triangle at y = -R/3
  const t1_v = [
    new THREE.Vector3(0, R, 0), 
    new THREE.Vector3(R * Math.sqrt(8/9), -R/3, 0),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, R * Math.sqrt(2/3)),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, -R * Math.sqrt(2/3))
  ];

  // T2 Vertices (Apex Down) - Inverted T1
  const t2_v = t1_v.map(v => v.clone().multiplyScalar(-1));

  // Edges (Pairs of vertex indices)
  const edges = [
    [0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]
  ];

  // Colors
  const gold = new THREE.Color("#FFD700");
  const brightWhite = new THREE.Color("#FFFFFF");
  const silver = new THREE.Color("#C0C0C0");
  const paleBlue = new THREE.Color("#AFEEEE");
  const coreWhite = new THREE.Color("#FFFFFF");

  // Helper for random point on line
  const randomPointOnLine = (a: THREE.Vector3, b: THREE.Vector3) => {
    return new THREE.Vector3().lerpVectors(a, b, Math.random());
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    // Distribution:
    // 10% Center Core (Group 2)
    // 45% T1 (Group 0)
    // 45% T2 (Group 1)

    if (i < PARTICLE_COUNT * 0.10) {
      // Center Core
      g = 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = 0.25; // Fist size
      p.setFromSphericalCoords(rad, phi, theta);
      c.copy(coreWhite);
    } else if (i < PARTICLE_COUNT * 0.55) {
      // T1 (Top/Gold)
      g = 0;
      // 15% Vertices, 85% Edges
      if (Math.random() < 0.15) {
        // Vertices - Super Bright White
        const vIdx = Math.floor(Math.random() * 4);
        p.copy(t1_v[vIdx]);
        // Tight cluster
        p.add(new THREE.Vector3((Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08));
        c.copy(brightWhite);
      } else {
        // Edges - Gold light trails
        const eIdx = Math.floor(Math.random() * 6);
        const edge = edges[eIdx];
        p = randomPointOnLine(t1_v[edge[0]], t1_v[edge[1]]);
        // Very tight constraint (Optical fiber look)
        p.addScalar((Math.random()-0.5)*0.015);
        c.copy(gold);
      }
    } else {
      // T2 (Bottom/Silver)
      g = 1;
      // 15% Vertices, 85% Edges
      if (Math.random() < 0.15) {
        // Vertices - Pale Blue
        const vIdx = Math.floor(Math.random() * 4);
        p.copy(t2_v[vIdx]);
        p.add(new THREE.Vector3((Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08, (Math.random()-0.5)*0.08));
        c.copy(paleBlue);
      } else {
        // Edges - Silver light trails
        const eIdx = Math.floor(Math.random() * 6);
        const edge = edges[eIdx];
        p = randomPointOnLine(t2_v[edge[0]], t2_v[edge[1]]);
        p.addScalar((Math.random()-0.5)*0.015);
        c.copy(silver);
      }
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


// --- MUDRA ---
export function generateMudraData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); // Not strictly needed but useful for pulsing
  
  // Namaste Mudra
  // Symmetric hands.
  // We model one hand and mirror it.
  
  // Hand dimensions (approx)
  // Palm: Rounded rectangle/ellipsoid. Width ~0.08, Height ~0.1, Thickness ~0.02
  // Fingers: Cylinders with joints.
  
  const handColor = new THREE.Color("#ffcc88"); // Skin glow
  const goldColor = new THREE.Color("#ffd700"); // Heart chakra
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0; // 0: Hands, 1: Chakra
    
    // 5% Heart Chakra Glow
    if (i < PARTICLE_COUNT * 0.05) {
      g = 1;
      // Small sphere between hands at y ~ -0.1
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = random(0.01, 0.15);
      p.setFromSphericalCoords(rad, phi, theta);
      p.y -= 0.15; // Heart center position relative to hands
      p.z += 0.1; // Slightly forward? No, between palms.
      
      c.copy(goldColor).multiplyScalar(1.5); // Bright gold
    } else {
      // Hands
      const isLeft = Math.random() > 0.5;
      const mirror = isLeft ? -1 : 1;
      
      // Generate Right Hand (then mirror x)
      // Palm Center ~ (0.05, -0.2, 0)
      // Slight cup shape
      
      const part = Math.random();
      
      if (part < 0.4) {
        // Palm
        // Ellipsoid-ish
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const w = 0.06; // width
        const h = 0.08; // height
        const d = 0.015; // depth
        
        let x = w * Math.cos(u) * Math.sin(v);
        let y = h * Math.cos(v);
        let z = d * Math.sin(u) * Math.sin(v);
        
        // Offset
        x += 0.06; // Shift to side
        y -= 0.2;  // Shift down
        
        // Cup curve: Rotate Z slightly
        const rotZ = 0.1;
        const x2 = x * Math.cos(rotZ) - y * Math.sin(rotZ);
        const y2 = x * Math.sin(rotZ) + y * Math.cos(rotZ);
        x = x2; y = y2;
        
        p.set(x, y, z);
        
        // Add "Palm lines" (higher density on surface)
        if (Math.random() < 0.2) {
           p.addScalar((Math.random()-0.5)*0.005);
           c.setHex(0xffaa55); // Darker lines
        } else {
           c.copy(handColor);
        }
        
      } else {
        // Fingers
        // 5 fingers.
        const fingerIdx = Math.floor(Math.random() * 5);
        // 0: Thumb, 1: Index... 4: Pinky
        
        let fx, fy, fz;
        let length, radius;
        
        // Base positions on palm top
        // Index to Pinky
        if (fingerIdx > 0) {
           const fOffset = (fingerIdx - 2.5) * 0.025;
           const fxBase = 0.06 + fOffset + (fingerIdx * 0.005);
           const fyBase = -0.12;
           
           radius = 0.012 - (fingerIdx-1)*0.001;
           length = 0.15 - Math.abs(fingerIdx-2.5)*0.02; 
           if (fingerIdx === 4) length *= 0.8; // Pinky short
           
           // Cylinder
           const h = Math.random() * length;
           const theta = Math.random() * Math.PI * 2;
           
           fx = fxBase + radius * Math.cos(theta);
           fy = fyBase + h;
           fz = radius * Math.sin(theta);
           
           // Curve fingers inward (Z) and slightly together (X)
           const bend = h*h * 2.0;
           fz += bend * 0.5; // Bend towards palm center
           if (fingerIdx < 2) fx += bend * 0.1;
           if (fingerIdx > 3) fx -= bend * 0.1;
           
        } else {
           // Thumb
           // Sticks out from side
           const fxBase = 0.12;
           const fyBase = -0.22;
           radius = 0.015;
           length = 0.12;
           
           const h = Math.random() * length;
           const theta = Math.random() * Math.PI * 2;
           
           // Angled out
           const ang = Math.PI / 4;
           let lx = radius * Math.cos(theta);
           let ly = h;
           let lz = radius * Math.sin(theta);
           
           // Rotate thumb
           let rx = lx * Math.cos(ang) - ly * Math.sin(ang);
           let ry = lx * Math.sin(ang) + ly * Math.cos(ang);
           
           fx = fxBase + rx;
           fy = fyBase + ry;
           fz = lz + 0.02; // Slightly forward
        }
        
        p.set(fx, fy, fz);
        c.copy(handColor);
        
        // Fingernails/Tips glow?
        if (Math.random() < 0.05) c.addScalar(0.2);
      }
      
      // Mirror for Left Hand
      if (isLeft) {
        p.x *= -1;
      }
      
      // Global Position Adjustment for Prayer
      // Bring hands together. Current x is +/- (~0.06 to 0.15)
      // We want palms touching at x=0
      // Palm surface was around z=0
      // Rotate hands to face each other.
      // Actually, if we modeled them flat in XY, we just need to bring them close.
      // But prayer hands are usually angled.
      
      const angle = 0.1; // Slight tenting
      if (isLeft) {
         const nx = p.x * Math.cos(-angle) - p.z * Math.sin(-angle);
         const nz = p.x * Math.sin(-angle) + p.z * Math.cos(-angle);
         p.x = nx; p.z = nz;
         p.x += 0.01; // Gap
      } else {
         const nx = p.x * Math.cos(angle) - p.z * Math.sin(angle);
         const nz = p.x * Math.sin(angle) + p.z * Math.cos(angle);
         p.x = nx; p.z = nz;
         p.x -= 0.01;
      }
    }
    
    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    
    colors[i*3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    
    groups[i] = g;
  }
  
  return { positions, colors, groups };
}

// --- EARTH (Realistic Blue Marble with Rounder Continents) ---
export function generateEarthData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  // Colors
  const oceanColor = new THREE.Color("#004466"); // Deep Blue
  const landColor = new THREE.Color("#0a5030");  // Dark Green
  const cloudColor = new THREE.Color("#FFFFFF"); // White
  const cityColor = new THREE.Color("#FFD700");  // Yellow Lights
  const outlineColor = new THREE.Color("#44aa77"); // Brighter green for outlines

  const R = 1.0;

  // Use spherical caps to define continents (avoid squares)
  // { lat, lon, radius (deg) }
  const landCaps = [
    // North America
    { lat: 45, lon: -100, r: 25 },
    { lat: 55, lon: -115, r: 15 }, // NW
    { lat: 30, lon: -95, r: 15 }, // South
    { lat: 60, lon: -80, r: 18 }, // NE
    
    // South America
    { lat: -15, lon: -60, r: 22 },
    { lat: -40, lon: -70, r: 12 }, // Tip

    // Africa
    { lat: 0, lon: 20, r: 28 },
    { lat: 20, lon: 10, r: 20 }, // West bulge

    // Europe
    { lat: 48, lon: 15, r: 15 },
    { lat: 60, lon: 30, r: 15 }, // Russia West

    // Asia
    { lat: 45, lon: 90, r: 35 }, // Central Asia
    { lat: 30, lon: 80, r: 20 }, // India/China
    { lat: 60, lon: 110, r: 25 }, // Siberia
    { lat: 20, lon: 105, r: 12 }, // SE Asia

    // Australia
    { lat: -25, lon: 135, r: 15 },

    // Antarctica
    { lat: -90, lon: 0, r: 20 },
    
    // Islands
    { lat: 36, lon: 138, r: 4 }, // Japan
    { lat: 54, lon: -2, r: 3 }, // UK
    { lat: -19, lon: 47, r: 4 }, // Madagascar
    { lat: -42, lon: 172, r: 3 }, // NZ
    { lat: -6, lon: 106, r: 4 }, // Indonesia/Java
  ];

  // Cities for Night Lights
  const cityCaps = [
    { lat: 40, lon: -74, r: 2 }, // NYC
    { lat: 34, lon: -118, r: 2 }, // LA
    { lat: 51, lon: 0, r: 2 }, // London
    { lat: 48, lon: 2, r: 2 }, // Paris
    { lat: 35, lon: 139, r: 2 }, // Tokyo
    { lat: 31, lon: 121, r: 2 }, // Shanghai
    { lat: 19, lon: 72, r: 2 }, // Mumbai
    { lat: -23, lon: -46, r: 2 }, // Sao Paulo
    { lat: 55, lon: 37, r: 2 }, // Moscow
    { lat: 30, lon: 31, r: 1 }, // Cairo
  ];

  // Helper: Vector from Lat/Lon
  const getVector = (lat: number, lon: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  };

  // Convert caps to Vector + Cosine of radius for fast dot product check
  const landNodes = landCaps.map(c => ({
    v: getVector(c.lat, c.lon),
    minDot: Math.cos(c.r * Math.PI / 180)
  }));
  
  const cityNodes = cityCaps.map(c => ({
    v: getVector(c.lat, c.lon),
    minDot: Math.cos(c.r * Math.PI / 180)
  }));

  // Simplex-like noise for cloud generation (cheap approximation)
  const isCloud = (p: THREE.Vector3) => {
     // Sine wave interference
     const s = 6.0;
     const noise = Math.sin(p.x*s) * Math.cos(p.y*s*1.2) * Math.sin(p.z*s + 2.0) + Math.sin(p.y*12)*0.2;
     return noise > 0.35; 
  };
  
  // Sun Position (Fixed relative to Earth for day/night cycle simulation)
  // Let's say sun is at (-1, 0, 0) -> Left side lit, Right side dark
  const sunDir = new THREE.Vector3(-1, 0.2, 0.5).normalize();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let p = new THREE.Vector3();
     let c = new THREE.Color();
     let g = 0;
     
     let found = false;
     let attempts = 0;
     
     while (!found && attempts < 20) {
        attempts++;
        
        // Random point on sphere
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        p.setFromSphericalCoords(R, phi, theta);
        
        // 1. CLOUDS (Layer 1)
        // 25% of particles are clouds
        if (i < PARTICLE_COUNT * 0.25) {
           if (isCloud(p)) {
              p.multiplyScalar(1.05); // Float above
              c.copy(cloudColor);
              c.multiplyScalar(0.7); // Semi-transparent
              found = true;
              continue;
           }
        }
        
        // 2. LAND / OCEAN
        // Check if inside any land cap
        let isLandPoint = false;
        let isEdge = false;
        
        // Smooth union of circles? 
        // Just check max overlap
        for (const node of landNodes) {
           const dot = p.dot(node.v);
           if (dot > node.minDot) {
              isLandPoint = true;
              // Check for edge: close to boundary?
              // Boundary is when dot approx node.minDot
              if (dot < node.minDot + 0.02) {
                 isEdge = true;
              }
              break;
           }
        }
        
        // Day/Night Calculation
        const sunDot = p.dot(sunDir);
        const isNight = sunDot < -0.1; // Terminator line
        
        if (isLandPoint) {
           // If we need high density land, we accept land points with higher prob
           // But here we are just filling particles. 
           // If current index is reserved for land? No, just rejection sampling.
           
           if (isEdge) {
               // Outline (Coastline)
               c.copy(outlineColor);
               // Add some sparkle
               if (Math.random() < 0.2) c.addScalar(0.2);
               found = true;
           } else {
               // Interior Land
               if (isNight) {
                  // Check city lights
                  let isCityPoint = false;
                  for (const city of cityNodes) {
                     if (p.dot(city.v) > city.minDot) {
                        isCityPoint = true;
                        break;
                     }
                  }
                  
                  if (isCityPoint) {
                     c.copy(cityColor);
                  } else {
                     // Dark Land at night
                     c.copy(landColor).multiplyScalar(0.3);
                  }
               } else {
                  // Day Land
                  c.copy(landColor);
                  
                  // Ice Caps (Approximate by Y position)
                  // sin(60) ~= 0.86
                  if (Math.abs(p.y) > 0.85) {
                     c.setHex(0xffffff); // White Snow/Ice
                  } else {
                      // Noise for texture
                      const n = (Math.random()-0.5)*0.1;
                      c.r+=n; c.g+=n; c.b+=n;
                  }
               }
               found = true;
           }
        } else {
           // Ocean
           
           // Arctic Ice Cap (Floating ice in ocean)
           if (p.y > 0.88) { // > 62 degrees North
               c.setHex(0xffffff); // White Ice
               // Slight blue tint
               c.b += 0.1;
               found = true;
           } else {
               if (isNight) {
                  c.copy(oceanColor).multiplyScalar(0.2); // Very dark ocean
               } else {
                  c.copy(oceanColor);
               }
               found = true;
           }
        }
        
        // Density Bias: 
        // We want more points on land/edges to define shapes well.
        // If it's ocean, 50% chance to reject and try again (effectively doubling density on land)
        if (!isLandPoint && Math.random() < 0.5) {
           found = false;
        }
     }
     
     // Fallback if rejected too many times
     if (!found) {
        // Just put an ocean point
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        p.setFromSphericalCoords(R, phi, theta);
        c.copy(oceanColor).multiplyScalar(0.5);
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
