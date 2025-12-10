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
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    
    groups[i] = g;
  }
  
  return { positions, colors, groups };
}

// --- EARTH (Realistic Blue Marble) ---
export function generateEarthData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  // Colors
  const oceanColor = new THREE.Color("#004466"); // Deep Blue
  const landColor = new THREE.Color("#0a5030");  // Dark Green
  const cloudColor = new THREE.Color("#FFFFFF"); // White
  const cityColor = new THREE.Color("#FFD700");  // Yellow Lights

  let index = 0;
  const R = 1.0;

  // Helper: Lat/Lon from Spherical Coords
  // Phi (0..PI) -> Lat (90..-90)
  // Theta (0..2PI) -> Lon (-180..180)
  const getLatLon = (phi: number, theta: number) => {
    const lat = 90 - (phi * 180 / Math.PI);
    let lon = (theta * 180 / Math.PI);
    if (lon > 180) lon -= 360;
    return { lat, lon };
  };

  const inRect = (lat: number, lon: number, minLat: number, maxLat: number, minLon: number, maxLon: number) => {
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
  };

  // Approximate Continent Shapes
  const isLand = (lat: number, lon: number) => {
    // North America
    if (inRect(lat, lon, 15, 83, -168, -52)) return true; 
    // South America
    if (inRect(lat, lon, -56, 13, -81, -34)) return true;
    // Europe
    if (inRect(lat, lon, 36, 71, -10, 40)) return true;
    // Africa
    if (inRect(lat, lon, -35, 37, -18, 52)) return true;
    // Asia (Main)
    if (inRect(lat, lon, 5, 77, 41, 180)) return true;
    // Asia (SE + Islands)
    if (inRect(lat, lon, -10, 20, 95, 150)) return true;
    // Asia (Russia East Tip)
    if (inRect(lat, lon, 60, 70, -180, -170)) return true;
    // Australia
    if (inRect(lat, lon, -45, -10, 112, 154)) return true;
    // Antarctica
    if (inRect(lat, lon, -90, -65, -180, 180)) return true;
    
    return false;
  };

  // Approximate Urban Areas for Lights
  const isCity = (lat: number, lon: number) => {
    // US East Coast
    if (inRect(lat, lon, 25, 45, -90, -70)) return true;
    // Europe (Central/West)
    if (inRect(lat, lon, 40, 55, -5, 30)) return true;
    // Japan
    if (inRect(lat, lon, 30, 40, 130, 145)) return true;
    // East China
    if (inRect(lat, lon, 22, 40, 110, 122)) return true;
    // India
    if (inRect(lat, lon, 10, 30, 70, 90)) return true;
    return false;
  };

  // Procedural Cloud Noise (Simple Sine approximation)
  const isCloud = (x: number, y: number, z: number) => {
     const s = 4.0;
     // Cloud bands and patches
     const noise = Math.sin(x*s) * Math.cos(y*s*1.5) * Math.sin(z*s + 2.0) + Math.sin(y*10)*0.2;
     return noise > 0.4; // Threshold
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let p = new THREE.Vector3();
     let c = new THREE.Color();
     let g = 0;
     
     // Rejection Sampling for Density Control
     // We want high density on land, sparse on ocean.
     // Clouds are separate layer on top.
     
     let found = false;
     let attempts = 0;
     
     while (!found && attempts < 15) {
        attempts++;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        p.setFromSphericalCoords(R, phi, theta);
        
        // 1. Check Cloud (Highest Priority Layer)
        // Clouds float above: R * 1.05
        if (Math.random() < 0.25 && isCloud(p.x, p.y, p.z)) { // 25% chance to try to be a cloud
           p.multiplyScalar(1.04); // Float above
           c.copy(cloudColor);
           // Slight transparency effect by dimming (since additive blending)
           c.multiplyScalar(0.5); 
           found = true;
           continue;
        }
        
        const { lat, lon } = getLatLon(phi, theta);
        const land = isLand(lat, lon);
        
        if (land) {
           // Land - High Probability to keep
           if (Math.random() < 0.95) {
              // Check City Lights
              if (isCity(lat, lon) && Math.random() < 0.5) {
                 c.copy(cityColor);
                 c.multiplyScalar(1.5); // Bright lights
              } else {
                 c.copy(landColor);
                 // Noise for texture
                 const n = (Math.random()-0.5)*0.1;
                 c.r += n; c.g += n; c.b += n;
              }
              found = true;
           }
        } else {
           // Ocean - Low Probability to keep (Sparse)
           if (Math.random() < 0.15) { // Only keep 15% of ocean points
              c.copy(oceanColor);
              found = true;
           }
        }
     }
     
     // Fallback
     if (!found) {
        // Just place deep blue ocean point
        // Reset p to random to avoid clumping from last attempt
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        p.setFromSphericalCoords(R, phi, theta);
        c.copy(oceanColor).multiplyScalar(0.8);
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
