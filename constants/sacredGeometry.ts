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

// --- EARTH (Divine Energy Planet) ---
export function generateEarthData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); // 0: Deep Blue Surface, 1: Grid/Lines, 2: North Pole

  const deepIndigo = new THREE.Color("#0A0E29"); // Deep Cosmic/Ocean Blue (Dark Indigo)
  const white = new THREE.Color("#FFFFFF");
  const southIndigo = new THREE.Color("#050714"); // Darker Indigo for South Pole

  let index = 0;
  const R = 1.0;

  // Helper to set particle
  const setP = (x: number, y: number, z: number, c: THREE.Color, brightness: number, g: number) => {
    if (index >= PARTICLE_COUNT) return;
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    // Apply brightness to color
    colors[index * 3] = c.r * brightness;
    colors[index * 3 + 1] = c.g * brightness;
    colors[index * 3 + 2] = c.b * brightness;
    groups[index] = g;
    index++;
  };

  // 1. North Pole (Super Bright) - 500 particles
  for (let i = 0; i < 500; i++) {
     const theta = Math.random() * Math.PI * 2;
     // Very small spread phi (Top cap)
     const phi = Math.acos(1.0 - Math.random() * 0.025); 
     
     const r = R;
     const x = r * Math.sin(phi) * Math.cos(theta);
     const y = r * Math.cos(phi);
     const z = r * Math.sin(phi) * Math.sin(theta);
     
     // 5x Brightness
     setP(x, y, z, white, 5.0, 2);
  }

  // 2. South Pole (Darker Indigo) - 200 particles
  for (let i = 0; i < 200; i++) {
     const theta = Math.random() * Math.PI * 2;
     const phi = Math.PI - Math.acos(1.0 - Math.random() * 0.025); // Bottom cap
     
     const r = R;
     const x = r * Math.sin(phi) * Math.cos(theta);
     const y = r * Math.cos(phi);
     const z = r * Math.sin(phi) * Math.sin(theta);
     
     // 50% darker than normal surface (0.5 brightness)
     setP(x, y, z, southIndigo, 0.5, 0);
  }

  // 3. Grid Lines
  // Longitudes: 24 lines (Every 15 degrees)
  const numLong = 24;
  for (let l = 0; l < numLong; l++) {
    const lon = (l / numLong) * Math.PI * 2;
    // Particles along the line
    const segments = 120; 
    for (let s = 0; s < segments; s++) {
       const lat = -Math.PI/2 + (s/segments)*Math.PI;
       const phi = Math.PI/2 - lat;
       // Skip very close to poles to avoid clumping
       if (phi < 0.05 || phi > Math.PI - 0.05) continue;

       const x = R * Math.sin(phi) * Math.cos(lon);
       const y = R * Math.cos(phi);
       const z = R * Math.sin(phi) * Math.sin(lon);
       
       setP(x, y, z, white, 1.2, 1);
    }
  }

  // Latitudes: 12 lines (Every ~15 degrees)
  const numLat = 12; 
  for (let l = 1; l < numLat; l++) {
     const lat = -Math.PI/2 + (l/numLat)*Math.PI;
     const isEquator = Math.abs(lat) < 0.05;
     
     // Density depends on radius of ring (cos(lat))
     const segments = Math.floor(250 * Math.cos(lat)); 
     
     const brightness = isEquator ? 2.0 : 1.2;
     const width = isEquator ? 0.008 : 0.004;

     for (let s = 0; s < segments; s++) {
        const lon = (s/segments) * Math.PI * 2;
        const phi = Math.PI/2 - lat;
        
        const x = R * Math.sin(phi) * Math.cos(lon);
        const y = R * Math.cos(phi);
        const z = R * Math.sin(phi) * Math.sin(lon);

        // Slight jitter for line thickness
        const jx = (Math.random()-0.5)*width;
        const jy = (Math.random()-0.5)*width;
        const jz = (Math.random()-0.5)*width;

        setP(x+jx, y+jy, z+jz, white, brightness, 1);
     }
  }

  // 4. Surface Fill (Remaining Particles)
  while(index < PARTICLE_COUNT) {
     const theta = Math.random() * Math.PI * 2;
     const phi = Math.acos(2 * Math.random() - 1);
     
     const r = R;
     const x = r * Math.sin(phi) * Math.cos(theta);
     const y = r * Math.cos(phi);
     const z = r * Math.sin(phi) * Math.sin(theta);

     // Uniform Deep Indigo Surface
     // Ensure no random flickering, just solid deep energy field
     setP(x, y, z, deepIndigo, 1.0, 0);
  }

  return { positions, colors, groups };
}
