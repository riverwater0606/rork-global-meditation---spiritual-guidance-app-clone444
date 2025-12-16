import * as THREE from 'three';
import { LAND_CAPS, CITY_CAPS, CONTINENT_COLORS } from './earthData';

export const PARTICLE_COUNT = 20000;

// Helper: Random float in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper: Random point in unit sphere
const randomInSphere = () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 1/3);
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

  const scale = 1.1;
  const R = 1.0 * scale;

  const t1_v = [
    new THREE.Vector3(0, R, 0), 
    new THREE.Vector3(R * Math.sqrt(8/9), -R/3, 0),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, R * Math.sqrt(2/3)),
    new THREE.Vector3(-R * Math.sqrt(2/9), -R/3, -R * Math.sqrt(2/3))
  ];
  const edges = [[0,1], [0,2], [0,3], [1,2], [2,3], [3,1]];

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

    const r = Math.random();

    if (r < 0.1) {
       g = 2;
       p = randomInSphere().multiplyScalar(0.25);
       c.copy(white);
    } else if (r < 0.55) {
       g = 0;
       if (Math.random() < 0.2) {
          const vIdx = Math.floor(Math.random() * 4);
          p.copy(t1_v[vIdx]).add(randomInSphere().multiplyScalar(0.08));
          c.copy(white).lerp(gold, 0.2);
       } else {
          const eIdx = Math.floor(Math.random() * 6);
          p = getPointOnEdge(t1_v, eIdx);
          p.add(randomInSphere().multiplyScalar(0.02));
          c.copy(gold);
       }
    } else {
       g = 1;
       if (Math.random() < 0.2) {
          const vIdx = Math.floor(Math.random() * 4);
          p.copy(t2_v[vIdx]).add(randomInSphere().multiplyScalar(0.08));
          c.copy(paleBlue);
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
        g = 1;
        p = randomInSphere().multiplyScalar(0.15);
        p.y -= 0.1;
        c.copy(gold).multiplyScalar(1.2);
     } else {
        g = 0;
        const isLeft = Math.random() > 0.5;
        
        const part = Math.random();
        
        let lx = 0, ly = 0, lz = 0;

        if (part < 0.45) {
           const u = Math.random();
           const v = Math.random();
           const theta = 2 * Math.PI * u;
           const phi = Math.acos(2 * v - 1);
           
           lx = 0.02 * Math.sin(phi) * Math.cos(theta);
           ly = 0.12 * Math.sin(phi) * Math.sin(theta);
           lz = 0.08 * Math.cos(phi);
           
           lx += 0.05;
           ly -= 0.15;
           
           if (lx < 0.055 && Math.random() < 0.3) {
              c.setHex(0xffaa55);
           } else {
              c.copy(skin);
           }
        } else {
           const fIdx = Math.floor(Math.random() * 5);
           const fT = Math.random();
           
           if (fIdx === 0) {
              const len = 0.1;
              const angle = Math.PI / 3;
              const r = 0.018;
              
              const h = fT * len;
              lx = 0.08 + Math.cos(angle)*h;
              ly = -0.15 + Math.sin(angle)*h;
              lz = 0.05 + (Math.random()-0.5)*r;
              
              lx += (Math.random()-0.5)*r;
              ly += (Math.random()-0.5)*r;
           } else {
              const zBase = ((fIdx - 2.5) * 0.035);
              let len = 0.16 - Math.abs(fIdx-2.5)*0.02;
              if (fIdx===4) len *= 0.8;
              
              const h = fT * len;
              const r = 0.014;
              
              lx = 0.05 + (Math.random()-0.5)*r;
              ly = -0.05 + h;
              lz = zBase + (Math.random()-0.5)*r;
              
              lx -= (h*h)*1.5;
           }
           c.copy(skin);
        }

        p.set(lx, ly, lz);
        
        if (isLeft) {
           p.x *= -1;
           const ang = 0.15;
           const cz = Math.cos(ang), sz = Math.sin(ang);
           const nx = p.x * cz - p.z * sz;
           const nz = p.x * sz + p.z * cz;
           p.x = nx - 0.01;
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
  
  const landNodes = LAND_CAPS.map(c => ({
      v: new THREE.Vector3().setFromSphericalCoords(1, (90 - c.lat) * Math.PI/180, (c.lon + 180) * Math.PI/180),
      minDot: Math.cos(c.r * Math.PI / 180) 
  }));

  const cityNodes = CITY_CAPS.map(c => ({
      v: new THREE.Vector3().setFromSphericalCoords(1, (90 - c.lat) * Math.PI/180, (c.lon + 180) * Math.PI/180),
      minDot: Math.cos(c.r * Math.PI / 180),
      color: new THREE.Color(c.color)
  }));

  const isCloud = (p: THREE.Vector3) => {
     const s = 4.0;
     const n = Math.sin(p.x*s) * Math.sin(p.y*s*1.5 + p.z*2) * Math.cos(p.z*s);
     return n > 0.4;
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
     let p = new THREE.Vector3();
     let c = new THREE.Color();
     let g = 0;
     
     let found = false;
     let attempts = 0;

     while (!found && attempts < 15) {
        attempts++;
        p = randomInSphere().normalize().multiplyScalar(R);

        if (i < PARTICLE_COUNT * 0.20) {
           if (isCloud(p)) {
              p.multiplyScalar(1.06);
              c.set(CONTINENT_COLORS.cloud);
              c.multiplyScalar(0.8);
              found = true;
              continue;
           }
        }

        let landDot = -1;
        for (const node of landNodes) {
           const edgeNoise = (Math.random() - 0.5) * 0.02;
           const d = p.dot(node.v);
           if (d > node.minDot + edgeNoise) {
              if (d > landDot) landDot = d;
           }
        }
        
        const isLand = landDot > -1;
        
        const poleFactor = 1.0 - Math.abs(p.y) * 0.3;

        if (isLand) {
           c.set(CONTINENT_COLORS.land).multiplyScalar(poleFactor);
           
           let isCity = false;
           for (const city of cityNodes) {
              if (p.dot(city.v) > city.minDot) {
                 isCity = true;
                 break;
              }
           }
           
           if (isCity && Math.random() < 0.3) {
               c.set(CONTINENT_COLORS.city);
           }
           
           if (Math.abs(p.y) > 0.9) c.set(CONTINENT_COLORS.ice);
           
           found = true; 
        } else {
           if (Math.random() > 0.55) {
               continue; 
           }
           
           c.set(CONTINENT_COLORS.ocean).multiplyScalar(poleFactor * (0.8 + Math.random() * 0.4));
           
           found = true;
        }
     }
     
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

// --- MERCURY ---
export function generateMercuryData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const baseGray = new THREE.Color('#a0a0a0');
  const darkGray = new THREE.Color('#606060');
  const sunGlow = new THREE.Color('#ffaa44');

  const craters = [];
  for (let i = 0; i < 50; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    craters.push({
      v: new THREE.Vector3().setFromSphericalCoords(1, phi, theta),
      size: random(5, 15) * Math.PI / 180
    });
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomInSphere().normalize().multiplyScalar(R + random(-0.02, 0.02));
    let c = baseGray.clone();

    let inCrater = false;
    for (const crater of craters) {
      if (p.dot(crater.v) > Math.cos(crater.size)) {
        c = darkGray.clone();
        inCrater = true;
        break;
      }
    }

    const sunDot = p.dot(new THREE.Vector3(-1, 0.2, 0));
    if (sunDot > 0.3) {
      c.lerp(sunGlow, sunDot * 0.4);
    }

    c.multiplyScalar(0.9 + Math.random() * 0.2);

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = inCrater ? 1 : 0;
  }

  return { positions, colors, groups };
}

// --- VENUS ---
export function generateVenusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const cloudYellow = new THREE.Color('#ffd700');
  const cloudOrange = new THREE.Color('#ffaa33');
  const brightGlow = new THREE.Color('#ffffee');

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const cloudHeight = 1.08 + random(-0.05, 0.05);
    const p = randomInSphere().normalize().multiplyScalar(R * cloudHeight);
    
    const swirl = Math.sin(p.x * 3 + p.y * 2) * Math.cos(p.z * 4);
    let c = swirl > 0 ? cloudYellow.clone() : cloudOrange.clone();

    const reflectionFactor = 0.7 + Math.random() * 0.3;
    c.lerp(brightGlow, reflectionFactor * 0.4);

    c.multiplyScalar(0.9 + Math.random() * 0.2);

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}

// --- MARS ---
export function generateMarsData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const rustyRed = new THREE.Color('#c1440e');
  const darkRed = new THREE.Color('#8b0000');
  const iceCap = new THREE.Color('#ffffff');
  const dust = new THREE.Color('#d2691e');

  const olympusMons = new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2 - 18*Math.PI/180, -133*Math.PI/180);
  const vallesMarineris = new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2 + 14*Math.PI/180, -60*Math.PI/180);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomInSphere().normalize().multiplyScalar(R + random(-0.015, 0.015));
    let c = rustyRed.clone();

    if (p.dot(olympusMons) > 0.95 || p.dot(vallesMarineris) > 0.92) {
      c = darkRed.clone();
    }

    if (Math.abs(p.y) > 0.88) {
      c = iceCap.clone();
      c.multiplyScalar(0.9 + Math.random() * 0.2);
    } else {
      c.multiplyScalar(0.8 + Math.random() * 0.4);
      if (Math.random() < 0.3) {
        c.lerp(dust, 0.3);
      }
    }

    if (i < PARTICLE_COUNT * 0.05) {
      p.multiplyScalar(1.05);
      c = dust.clone();
      c.multiplyScalar(0.5);
    }

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}

// --- JUPITER ---
export function generateJupiterData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const orange = new THREE.Color('#f4a460');
  const darkOrange = new THREE.Color('#d2691e');
  const cream = new THREE.Color('#ffe4b5');
  const redSpot = new THREE.Color('#8b0000');
  const moonColor = new THREE.Color('#dddddd');

  const grsCenter = new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2 + 22*Math.PI/180, -60*Math.PI/180);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.02) {
      const moonIdx = Math.floor(i / (PARTICLE_COUNT * 0.005));
      const angle = (moonIdx * Math.PI / 2) + Date.now() * 0.0001;
      const orbitR = 1.5 + moonIdx * 0.2;
      const p = new THREE.Vector3(
        Math.cos(angle) * orbitR,
        (Math.random() - 0.5) * 0.1,
        Math.sin(angle) * orbitR
      );
      p.add(randomInSphere().multiplyScalar(0.03));
      
      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      colors[i*3] = moonColor.r;
      colors[i*3+1] = moonColor.g;
      colors[i*3+2] = moonColor.b;
      groups[i] = 1;
      continue;
    }

    const p = randomInSphere().normalize().multiplyScalar(R);
    
    const lat = Math.asin(p.y);
    const bandIdx = Math.floor(lat * 10);
    let c = (bandIdx % 2 === 0) ? orange.clone() : cream.clone();

    const turbulence = Math.sin(p.x * 8 + p.z * 6) * 0.3;
    if (turbulence > 0) {
      c.lerp(darkOrange, turbulence);
    }

    if (p.dot(grsCenter) > 0.92) {
      c = redSpot.clone();
      c.multiplyScalar(0.7 + Math.random() * 0.3);
    }

    c.multiplyScalar(0.9 + Math.random() * 0.2);

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}

// --- SATURN ---
export function generateSaturnData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const paleYellow = new THREE.Color('#f0e68c');
  const cream = new THREE.Color('#fffacd');
  const ringWhite = new THREE.Color('#ffffff');
  const ringYellow = new THREE.Color('#ffebcd');
  const titanColor = new THREE.Color('#cc9966');

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.01) {
      const angle = Date.now() * 0.0002;
      const p = new THREE.Vector3(
        Math.cos(angle) * 1.8,
        0.3,
        Math.sin(angle) * 1.8
      );
      p.add(randomInSphere().multiplyScalar(0.04));
      
      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      colors[i*3] = titanColor.r;
      colors[i*3+1] = titanColor.g;
      colors[i*3+2] = titanColor.b;
      groups[i] = 2;
      continue;
    }

    if (i < PARTICLE_COUNT * 0.40) {
      const angle = Math.random() * Math.PI * 2;
      const ringR = random(1.4, 2.2);
      const thickness = 0.02;
      
      if (ringR > 1.7 && ringR < 1.8 && Math.random() < 0.8) {
        continue;
      }

      const p = new THREE.Vector3(
        Math.cos(angle) * ringR,
        (Math.random() - 0.5) * thickness,
        Math.sin(angle) * ringR
      );

      const density = 1.0 - (ringR - 1.4) / 0.8;
      let c = density > 0.5 ? ringWhite.clone() : ringYellow.clone();
      c.multiplyScalar(density * (0.7 + Math.random() * 0.3));

      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      colors[i*3] = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
      groups[i] = 1;
      continue;
    }

    const p = randomInSphere().normalize().multiplyScalar(R);
    
    const lat = Math.asin(p.y);
    const bandIdx = Math.floor(lat * 8);
    let c = (bandIdx % 2 === 0) ? paleYellow.clone() : cream.clone();
    c.multiplyScalar(0.9 + Math.random() * 0.2);

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}

// --- URANUS ---
export function generateUranusData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const lightBlue = new THREE.Color('#add8e6');
  const cyan = new THREE.Color('#87ceeb');
  const haze = new THREE.Color('#e0ffff');
  const ringDark = new THREE.Color('#334455');

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const ringR = random(1.3, 1.6);
      const p = new THREE.Vector3(
        Math.cos(angle) * ringR,
        (Math.random() - 0.5) * 0.01,
        Math.sin(angle) * ringR
      );

      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      colors[i*3] = ringDark.r * 0.5;
      colors[i*3+1] = ringDark.g * 0.5;
      colors[i*3+2] = ringDark.b * 0.5;
      groups[i] = 1;
      continue;
    }

    const p = randomInSphere().normalize().multiplyScalar(R);
    let c = lightBlue.clone();

    const variation = Math.sin(p.x * 2 + p.y * 3) * 0.2;
    if (variation > 0) {
      c.lerp(cyan, variation);
    }

    if (Math.random() < 0.1) {
      p.multiplyScalar(1.04);
      c = haze.clone();
      c.multiplyScalar(0.6);
    } else {
      c.multiplyScalar(0.85 + Math.random() * 0.3);
    }

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}

// --- NEPTUNE ---
export function generateNeptuneData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const R = 1.0;
  const deepBlue = new THREE.Color('#00008b');
  const mediumBlue = new THREE.Color('#1e90ff');
  const whiteCloud = new THREE.Color('#ffffff');
  const darkSpot = new THREE.Color('#000033');
  const ringDark = new THREE.Color('#223344');

  const darkSpotCenter = new THREE.Vector3().setFromSphericalCoords(1, Math.PI/2 - 20*Math.PI/180, -70*Math.PI/180);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.10) {
      const angle = Math.random() * Math.PI * 2;
      const ringR = random(1.4, 1.7);
      const p = new THREE.Vector3(
        Math.cos(angle) * ringR,
        (Math.random() - 0.5) * 0.01,
        Math.sin(angle) * ringR
      );

      positions[i*3] = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      colors[i*3] = ringDark.r * 0.4;
      colors[i*3+1] = ringDark.g * 0.4;
      colors[i*3+2] = ringDark.b * 0.4;
      groups[i] = 1;
      continue;
    }

    const p = randomInSphere().normalize().multiplyScalar(R);
    let c = deepBlue.clone();

    const windPattern = Math.sin(p.y * 10 + p.x * 3) * Math.cos(p.z * 2);
    if (windPattern > 0.3) {
      c.lerp(mediumBlue, windPattern * 0.7);
    }

    if (p.dot(darkSpotCenter) > 0.93) {
      c = darkSpot.clone();
    }

    if (Math.random() < 0.08) {
      c.lerp(whiteCloud, 0.7);
    }

    c.multiplyScalar(0.8 + Math.random() * 0.4);

    positions[i*3] = p.x;
    positions[i*3+1] = p.y;
    positions[i*3+2] = p.z;
    colors[i*3] = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
    groups[i] = 0;
  }

  return { positions, colors, groups };
}
