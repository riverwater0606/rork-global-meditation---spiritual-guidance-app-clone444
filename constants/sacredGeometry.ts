import * as THREE from 'three';

export const PARTICLE_COUNT = 15000;

// Helper for random float
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// --- MERKABA ---
export function generateMerkabaData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); // 0: T1, 1: T2, 2: Center Glow

  // Merkaba = Two Interlocked Tetrahedrons
  // T1 (Male/Sun): Point facing up.
  // T2 (Female/Earth): Point facing down.

  // Vertices
  const scale = 1.0;
  // T1
  const t1_v = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(-1, -1, 1)
  ].map(v => v.multiplyScalar(scale));

  // T2
  const t2_v = [
    new THREE.Vector3(-1, -1, -1),
    new THREE.Vector3(-1, 1, 1),
    new THREE.Vector3(1, -1, 1),
    new THREE.Vector3(1, 1, -1)
  ].map(v => v.multiplyScalar(scale));

  // Faces (indices of vertices)
  const faces = [
    [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]
  ];

  // Helper to get random point on triangle
  const randomPointOnTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    let r1 = Math.random();
    let r2 = Math.random();
    if (r1 + r2 > 1) {
      r1 = 1 - r1;
      r2 = 1 - r2;
    }
    const r3 = 1 - r1 - r2;
    return new THREE.Vector3()
      .addScaledVector(a, r1)
      .addScaledVector(b, r2)
      .addScaledVector(c, r3);
  };

  // Helper to get random point on line
  const randomPointOnLine = (a: THREE.Vector3, b: THREE.Vector3) => {
    const t = Math.random();
    return new THREE.Vector3().lerpVectors(a, b, t);
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.random();
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    // 10% Center Glow
    if (i < PARTICLE_COUNT * 0.1) {
      g = 2; // Center
      // Sphere in center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = random(0.01, 0.3); // Pulsing core
      p.setFromSphericalCoords(rad, phi, theta);
      c.setHex(0xFFFFFF); // White light
    } else {
      // 45% T1, 45% T2
      const isT1 = i % 2 === 0;
      g = isT1 ? 0 : 1;
      const verts = isT1 ? t1_v : t2_v;
      
      const type = Math.random();
      if (type < 0.6) {
        // Faces
        const faceIdx = Math.floor(Math.random() * 4);
        const f = faces[faceIdx];
        p = randomPointOnTriangle(verts[f[0]], verts[f[1]], verts[f[2]]);
      } else if (type < 0.95) {
        // Edges (High density)
        // 6 edges: 0-1, 0-2, 0-3, 1-2, 1-3, 2-3
        const edges = [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]];
        const edgeIdx = Math.floor(Math.random() * 6);
        const e = edges[edgeIdx];
        p = randomPointOnLine(verts[e[0]], verts[e[1]]);
        // Add slight scatter for "energy trail" look
        p.addScalar((Math.random()-0.5)*0.05);
      } else {
        // Vertices (Intense)
        const vIdx = Math.floor(Math.random() * 4);
        p.copy(verts[vIdx]).addScalar((Math.random()-0.5)*0.1);
      }

      // Colors
      if (isT1) {
        // Gold/Yellow for Sun/Male
        c.setHSL(0.1 + Math.random() * 0.05, 1.0, 0.6); 
      } else {
        // Blue/Violet for Earth/Female
        c.setHSL(0.6 + Math.random() * 0.1, 1.0, 0.7);
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

// --- EARTH ---
export function generateEarthData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT); // 0: Earth, 1: Clouds

  // "Accurate" Continents check
  // Returns true if lat/lon is likely land
  // lat: -PI/2 to PI/2, lon: -PI to PI
  const isLand = (lat: number, lon: number): boolean => {
    const latDeg = lat * 180 / Math.PI;
    const lonDeg = lon * 180 / Math.PI;
    
    // Helper for Ellipse check
    // (x-h)^2/a^2 + (y-k)^2/b^2 <= 1
    const inEllipse = (lat0: number, lon0: number, latR: number, lonR: number) => {
      // Handle wrapping for longitude? Simplified here.
      let dLon = lonDeg - lon0;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      
      return (Math.pow(latDeg - lat0, 2) / Math.pow(latR, 2) + Math.pow(dLon, 2) / Math.pow(lonR, 2)) <= 1;
    };

    // North America
    if (inEllipse(45, -100, 20, 35)) return true;
    if (inEllipse(20, -100, 15, 15)) return true; // Mexico/Central
    
    // South America
    if (inEllipse(-15, -60, 25, 20)) return true;
    
    // Africa
    if (inEllipse(5, 20, 25, 25)) return true;
    if (inEllipse(-20, 25, 15, 15)) return true;
    
    // Europe
    if (inEllipse(50, 20, 10, 25)) return true;
    
    // Asia
    if (inEllipse(50, 90, 20, 40)) return true; // Russia/China
    if (inEllipse(25, 80, 15, 20)) return true; // India
    if (inEllipse(15, 105, 10, 10)) return true; // SE Asia
    
    // Australia
    if (inEllipse(-25, 135, 12, 18)) return true;
    
    // Antarctica
    if (latDeg < -70) return true;
    
    // Japan/Islands (Noise will handle details, but let's add Japan)
    if (inEllipse(36, 138, 5, 2)) return true;

    return false;
  };

  const blue = new THREE.Color("#1a44cc"); // Ocean
  const deepBlue = new THREE.Color("#001133"); // Deep Ocean
  const landGreen = new THREE.Color("#228822"); // Land
  const landBrown = new THREE.Color("#665533"); // Mountains/Desert
  const white = new THREE.Color("#ffffff"); // Clouds/Ice

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    // 15% Clouds (Layer 2)
    if (Math.random() < 0.15) {
      g = 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.05 + Math.random() * 0.05; // Slightly above surface
      
      p.setFromSphericalCoords(r, phi, theta);
      
      // Cloud patterns (Perlin-ish noise)
      // Simple sine combination
      const noise = Math.sin(theta*4) + Math.sin(phi*5 + theta) + Math.sin(theta*10)*0.5;
      
      if (noise > 1.0) {
        c.setHex(0xffffff);
        c.offsetHSL(0, 0, -0.1 + Math.random()*0.2); // Slight grey variation
      } else {
        // Transparent/Invisible clouds?
        // We can just skip them or make them very faint
        // Let's make them sparse
        p.set(0,0,0); // Hide
      }
    } else {
      // Surface
      g = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0;
      
      p.setFromSphericalCoords(r, phi, theta);
      
      const lat = Math.PI/2 - phi;
      const lon = theta - Math.PI; // Adjust to -PI..PI
      
      const land = isLand(lat, lon);
      
      if (land) {
         // Land color variation
         // Higher lat = whiter (snow)
         const latAbs = Math.abs(lat * 180/Math.PI);
         if (latAbs > 60) {
            c.setHex(0xffffff); // Ice
         } else if (latAbs < 30 && Math.random() < 0.3) {
            c.copy(landBrown); // Desert/Mountain
         } else {
            c.copy(landGreen);
         }
      } else {
         // Ocean
         c.copy(blue);
         if (Math.random() < 0.3) c.lerp(deepBlue, 0.5);
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
