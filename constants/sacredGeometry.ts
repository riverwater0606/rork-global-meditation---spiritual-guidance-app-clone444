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
// True sacred geometry: 19 interlocking circles forming the cosmic pattern
// Each circle has radius 1, centers are at distance 1 from neighbors

// Generate circle centers for perfect Flower of Life
const generateFlowerCenters = () => {
  const centers: [number, number][] = [];
  const r = 1; // Circle radius = distance between centers
  
  // Center circle
  centers.push([0, 0]);
  
  // First ring: 6 circles around center
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    centers.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  
  // Second ring: 12 circles (6 at corners, 6 in between)
  // Corner circles at distance 2r
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    centers.push([2 * r * Math.cos(angle), 2 * r * Math.sin(angle)]);
  }
  // Intermediate circles at distance sqrt(3)*r
  const sqrt3 = Math.sqrt(3);
  for (let i = 0; i < 6; i++) {
    const angle = (30 + i * 60) * Math.PI / 180;
    centers.push([sqrt3 * r * Math.cos(angle), sqrt3 * r * Math.sin(angle)]);
  }
  
  return centers;
};

const FLOWER_CIRCLE_CENTERS = generateFlowerCenters();

export function generateFlowerOfLifeData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const groups = new Float32Array(PARTICLE_COUNT);

  const scale = 0.45;
  const circleRadius = 1.0 * scale;
  
  // Sacred blue-gold palette
  const deepBlue = new THREE.Color("#1E40AF");
  const royalBlue = new THREE.Color("#3B82F6");
  const cyan = new THREE.Color("#22D3EE");
  const gold = new THREE.Color("#F59E0B");
  const white = new THREE.Color("#FFFFFF");

  // Scaled circle centers
  const circleCenters = FLOWER_CIRCLE_CENTERS.map(c => ({
    x: c[0] * scale,
    y: c[1] * scale
  }));

  // Calculate all intersection points (vesica pisces centers)
  const intersectionPoints: THREE.Vector3[] = [];
  
  // Center point
  intersectionPoints.push(new THREE.Vector3(0, 0, 0));
  
  // Generate intersection points between overlapping circles
  for (let i = 0; i < circleCenters.length; i++) {
    for (let j = i + 1; j < circleCenters.length; j++) {
      const c1 = circleCenters[i];
      const c2 = circleCenters[j];
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      
      // Circles intersect if distance < 2 * radius
      if (d < 2 * circleRadius && d > 0.01) {
        const a = d / 2;
        const h = Math.sqrt(circleRadius * circleRadius - a * a);
        const mx = (c1.x + c2.x) / 2;
        const my = (c1.y + c2.y) / 2;
        const perpX = -dy / d;
        const perpY = dx / d;
        
        intersectionPoints.push(new THREE.Vector3(mx + h * perpX, my + h * perpY, 0));
        intersectionPoints.push(new THREE.Vector3(mx - h * perpX, my - h * perpY, 0));
      }
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let p = new THREE.Vector3();
    let c = new THREE.Color();
    let g = 0;

    const r = Math.random();

    if (r < 0.12) {
      // 12% - Intersection points (sacred nodes - bright glowing)
      g = 0;
      const pointIdx = Math.floor(Math.random() * intersectionPoints.length);
      const basePoint = intersectionPoints[pointIdx];
      
      const spread = 0.025;
      p.set(
        basePoint.x + (Math.random() - 0.5) * spread,
        basePoint.y + (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * 0.03
      );
      
      // Bright gold/white glow at intersections
      c.copy(white).lerp(gold, Math.random() * 0.4);
    } 
    else if (r < 0.88) {
      // 76% - Circle outlines (19 interlocking circles)
      g = 1;
      const circleIdx = Math.floor(Math.random() * circleCenters.length);
      const center = circleCenters[circleIdx];
      
      const theta = Math.random() * Math.PI * 2;
      // Thin, crisp circle lines
      const radiusVariation = 0.995 + Math.random() * 0.01;
      
      p.set(
        center.x + circleRadius * radiusVariation * Math.cos(theta),
        center.y + circleRadius * radiusVariation * Math.sin(theta),
        (Math.random() - 0.5) * 0.04
      );
      
      // Distance from center determines color
      const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y);
      const maxDist = 2.5 * scale;
      const t = distFromCenter / maxDist;
      
      // Inner = royal blue, outer = cyan
      c.copy(royalBlue).lerp(cyan, t * 0.8);
      c.lerp(white, Math.random() * 0.15); // Subtle shimmer
    }
    else {
      // 12% - Outer enclosing circle (the boundary)
      g = 2;
      const outerRadius = 3.0 * scale;
      const theta = Math.random() * Math.PI * 2;
      const radiusVariation = 0.995 + Math.random() * 0.01;
      
      p.set(
        outerRadius * radiusVariation * Math.cos(theta),
        outerRadius * radiusVariation * Math.sin(theta),
        (Math.random() - 0.5) * 0.02
      );
      
      // Deep blue outer ring with subtle glow
      c.copy(deepBlue).lerp(royalBlue, Math.random() * 0.3);
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
