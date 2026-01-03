import * as THREE from 'three';
import { LAND_CAPS, CITY_CAPS, CONTINENT_COLORS } from './earthData';

export const PARTICLE_COUNT = 20000;

// --- HELPERS ---

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

const createBuffer = () => ({
    positions: new Float32Array(PARTICLE_COUNT * 3),
    colors: new Float32Array(PARTICLE_COUNT * 3),
    groups: new Float32Array(PARTICLE_COUNT)
});

const setParticle = (
    i: number, 
    buffers: { positions: Float32Array, colors: Float32Array, groups: Float32Array }, 
    pos: THREE.Vector3, 
    color: THREE.Color, 
    group: number
) => {
    buffers.positions[i * 3] = pos.x;
    buffers.positions[i * 3 + 1] = pos.y;
    buffers.positions[i * 3 + 2] = pos.z;
    buffers.colors[i * 3] = color.r;
    buffers.colors[i * 3 + 1] = color.g;
    buffers.colors[i * 3 + 2] = color.b;
    buffers.groups[i] = group;
};

// --- GENERATORS ---

// 1. Flower of Life (Basic)
export const generateFlowerOfLifeData = () => {
    const buffers = createBuffer();
    const R = 2.0;
    
    // Simple 7-circle seed pattern
    const centers = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(R, 0, 0),
        new THREE.Vector3(-R, 0, 0),
        new THREE.Vector3(R/2, R*Math.sqrt(3)/2, 0),
        new THREE.Vector3(-R/2, R*Math.sqrt(3)/2, 0),
        new THREE.Vector3(R/2, -R*Math.sqrt(3)/2, 0),
        new THREE.Vector3(-R/2, -R*Math.sqrt(3)/2, 0),
    ];

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const centerIdx = Math.floor(Math.random() * centers.length);
        const center = centers[centerIdx];
        
        // Random point on circle perimeter with some thickness
        const theta = Math.random() * Math.PI * 2;
        const radius = R; 
        const jitter = (Math.random() - 0.5) * 0.1;
        
        const px = center.x + (radius + jitter) * Math.cos(theta);
        const py = center.y + (radius + jitter) * Math.sin(theta);
        const pz = (Math.random() - 0.5) * 0.1; // Flat but slight depth

        setParticle(i, buffers, new THREE.Vector3(px, py, pz), new THREE.Color(1, 0.84, 0), 0); // Gold
    }
    return buffers;
};

// 1.5 Flower of Life (Complete/Full)
export const generateFlowerOfLifeCompleteData = () => {
    const buffers = createBuffer();
    // 19 circles pattern
    const R = 0.8; 
    
    // Easier: Just manual relative positions for 19 circles
    const H = R * Math.sqrt(3)/2;
    const offsets = [
       [0,0],
       [R,0], [-R,0], [R/2, H], [-R/2, H], [R/2, -H], [-R/2, -H],
       [2*R,0], [-2*R,0], [R, 2*H], [-R, 2*H], [R, -2*H], [-R, -2*H],
       [1.5*R, H], [-1.5*R, H], [1.5*R, -H], [-1.5*R, -H],
       [0, 2*H], [0, -2*H]
    ];
    
    for(let i=0; i<PARTICLE_COUNT; i++) {
        const centerIdx = Math.floor(Math.random() * offsets.length);
        const [cx, cy] = offsets[centerIdx];
        
        const theta = Math.random() * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.05;
        
        const px = cx + (R + jitter) * Math.cos(theta);
        const py = cy + (R + jitter) * Math.sin(theta);
        const pz = (Math.random() - 0.5) * 0.1;
        
        // Group 1: Circles
        // Group 2: Outer Circle (Large container)
        const isOuter = i > PARTICLE_COUNT * 0.8;
        if (isOuter) {
            const bigR = 3 * R;
            const px2 = (bigR + jitter) * Math.cos(theta);
            const py2 = (bigR + jitter) * Math.sin(theta);
            setParticle(i, buffers, new THREE.Vector3(px2, py2, pz), new THREE.Color(0.8, 0.9, 1.0), 2);
        } else {
            setParticle(i, buffers, new THREE.Vector3(px, py, pz), new THREE.Color(1, 0.9, 0.5), 1);
        }
    }
    
    return buffers;
};

// 2. Star of David (Interlaced Triangles 3D)
export const generateStarOfDavidData = () => {
    const buffers = createBuffer();
    
    // Two 2D triangles extruded slightly
    const R = 2.5;
    const thickness = 0.1;
    
    // Recalculate standard equilateral
    // Top: (0, R)
    const t1 = [
        new THREE.Vector3(0, R, 0),
        new THREE.Vector3(R * Math.sin(Math.PI/3), -R * Math.cos(Math.PI/3), 0),
        new THREE.Vector3(-R * Math.sin(Math.PI/3), -R * Math.cos(Math.PI/3), 0)
    ];
    
    // Triangle 2: Point Down
    const t2 = [
        new THREE.Vector3(0, -R, 0),
        new THREE.Vector3(R * Math.sin(Math.PI/3), R * Math.cos(Math.PI/3), 0),
        new THREE.Vector3(-R * Math.sin(Math.PI/3), R * Math.cos(Math.PI/3), 0)
    ];

    const getPointOnTriangle = (triangle: THREE.Vector3[]) => {
        // Random edge
        const edge = Math.floor(Math.random() * 3);
        const p1 = triangle[edge];
        const p2 = triangle[(edge + 1) % 3];
        const alpha = Math.random();
        
        const p = new THREE.Vector3().lerpVectors(p1, p2, alpha);
        // Add thickness jitter
        p.x += (Math.random()-0.5) * thickness;
        p.y += (Math.random()-0.5) * thickness;
        p.z += (Math.random()-0.5) * thickness;
        return p;
    };

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const rand = Math.random();
        
        if (rand < 0.05) {
            // Vertices (Nodes)
            const t = Math.random() > 0.5 ? t1 : t2;
            const v = t[Math.floor(Math.random()*3)];
            const p = v.clone().add(randomInSphere().multiplyScalar(0.2));
            setParticle(i, buffers, p, new THREE.Color(1, 1, 1), 2);
        } else if (rand < 0.525) {
            // Triangle 1 (Blue-ish)
            const p = getPointOnTriangle(t1);
            setParticle(i, buffers, p, new THREE.Color(0.4, 0.6, 1), 0);
        } else {
            // Triangle 2 (Gold-ish)
            const p = getPointOnTriangle(t2);
            setParticle(i, buffers, p, new THREE.Color(1, 0.8, 0.4), 1);
        }
    }
    return buffers;
};

// 3. Merkaba (Star Tetrahedron)
export const generateMerkabaData = () => {
    const buffers = createBuffer();
    const R = 2.0;
    
    // Tetrahedron 1: (1,1,1), (1,-1,-1), (-1,1,-1), (-1,-1,1) (Scaled)
    const t1 = [
        new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(R),
        new THREE.Vector3(1, -1, -1).normalize().multiplyScalar(R),
        new THREE.Vector3(-1, 1, -1).normalize().multiplyScalar(R),
        new THREE.Vector3(-1, -1, 1).normalize().multiplyScalar(R)
    ];
    
    // Tetrahedron 2: (-1,-1,-1), (-1,1,1), (1,-1,1), (1,1,-1) (Scaled)
    const t2 = [
        new THREE.Vector3(-1, -1, -1).normalize().multiplyScalar(R),
        new THREE.Vector3(-1, 1, 1).normalize().multiplyScalar(R),
        new THREE.Vector3(1, -1, 1).normalize().multiplyScalar(R),
        new THREE.Vector3(1, 1, -1).normalize().multiplyScalar(R)
    ];

    // Edges map: 0-1, 0-2, 0-3, 1-2, 1-3, 2-3
    const edges = [[0,1], [0,2], [0,3], [1,2], [1,3], [2,3]];
    
    const getPointOnTetra = (verts: THREE.Vector3[]) => {
        const edgeIdx = Math.floor(Math.random() * 6);
        const [a, b] = edges[edgeIdx];
        const p1 = verts[a];
        const p2 = verts[b];
        const alpha = Math.random();
        const p = new THREE.Vector3().lerpVectors(p1, p2, alpha);
        // Jitter
        p.add(randomInSphere().multiplyScalar(0.05));
        return p;
    };

    for(let i=0; i<PARTICLE_COUNT; i++) {
        if (Math.random() < 0.5) {
            // T1 (Male, Sun) - Gold
            const p = getPointOnTetra(t1);
            setParticle(i, buffers, p, new THREE.Color(1, 0.8, 0.2), 0);
        } else {
            // T2 (Female, Earth) - Silver
            const p = getPointOnTetra(t2);
            setParticle(i, buffers, p, new THREE.Color(0.8, 0.8, 1), 1);
        }
    }
    return buffers;
};

// 4. Tree of Life
export const generateTreeOfLifeData = () => {
    const buffers = createBuffer();
    // 10 Sephiroth coordinates (approx relative)
    const sephiroth = [
        { x: 0, y: 3.5, z: 0, color: '#fff' }, // Keter
        { x: 1.5, y: 2.5, z: 0, color: '#888' }, // Chokhmah
        { x: -1.5, y: 2.5, z: 0, color: '#333' }, // Binah
        { x: 1.5, y: 0.5, z: 0, color: '#22f' }, // Chesed
        { x: -1.5, y: 0.5, z: 0, color: '#f22' }, // Gevurah
        { x: 0, y: 0, z: 0, color: '#ff2' }, // Tiferet
        { x: 1.5, y: -1.5, z: 0, color: '#2f2' }, // Netzach
        { x: -1.5, y: -1.5, z: 0, color: '#fa2' }, // Hod
        { x: 0, y: -2.5, z: 0, color: '#a2f' }, // Yesod
        { x: 0, y: -4.0, z: 0, color: '#322' }, // Malkuth
    ];
    
    // Connections (indices)
    const paths = [
        [0,1], [0,2], [1,2], 
        [1,3], [2,4], 
        [1,5], [2,5], 
        [3,4], [3,5], [4,5],
        [3,6], [4,7], 
        [5,6], [5,7], [5,8],
        [6,7], [6,8], [7,8],
        [8,9]
    ];

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const rand = Math.random();
        if (rand < 0.2) {
            // Sephira (Sphere)
            const idx = Math.floor(Math.random() * sephiroth.length);
            const s = sephiroth[idx];
            const p = randomInSphere().multiplyScalar(0.4).add(new THREE.Vector3(s.x, s.y, s.z));
            setParticle(i, buffers, p, new THREE.Color(s.color), 0);
        } else {
            // Path
            const pIdx = Math.floor(Math.random() * paths.length);
            const [a, b] = paths[pIdx];
            const s1 = sephiroth[a];
            const s2 = sephiroth[b];
            
            const alpha = Math.random();
            const px = s1.x + (s2.x - s1.x) * alpha;
            const py = s1.y + (s2.y - s1.y) * alpha;
            const pz = s1.z + (s2.z - s1.z) * alpha;
            
            // Jitter
            const j = (Math.random()-0.5) * 0.1;
            
            setParticle(i, buffers, new THREE.Vector3(px+j, py+j, pz+j), new THREE.Color(0.8, 0.8, 0.8), 1);
        }
    }
    return buffers;
};

// 6. Grid of Life (Isotropic Vector Matrix / 64 Tetrahedron)
export const generateGridOfLifeData = () => {
    const buffers = createBuffer();
    // Generate a simple cubic or tet grid layout
    const size = 3;
    const spacing = 1.0;
    
    const points: THREE.Vector3[] = [];
    for(let x=-size; x<=size; x++) {
        for(let y=-size; y<=size; y++) {
            for(let z=-size; z<=size; z++) {
                if (Math.abs(x)+Math.abs(y)+Math.abs(z) <= size + 1) {
                    points.push(new THREE.Vector3(x*spacing, y*spacing, z*spacing));
                }
            }
        }
    }
    
    for(let i=0; i<PARTICLE_COUNT; i++) {
        const rand = Math.random();
        if (rand < 0.3) {
            // Nodes
            const p = points[Math.floor(Math.random()*points.length)];
            const j = randomInSphere().multiplyScalar(0.15);
            setParticle(i, buffers, p.clone().add(j), new THREE.Color(0, 1, 1), 0);
        } else {
            // Lines
            const p1 = points[Math.floor(Math.random()*points.length)];
            const p2 = p1.clone().add(new THREE.Vector3(
                 Math.round(Math.random()*2-1)*spacing, 
                 Math.round(Math.random()*2-1)*spacing, 
                 Math.round(Math.random()*2-1)*spacing
            ));
            
            const alpha = Math.random();
            const p = new THREE.Vector3().lerpVectors(p1, p2, alpha);
            setParticle(i, buffers, p, new THREE.Color(0, 0.5, 1), 1);
        }
    }
    return buffers;
};

// 7. Sri Yantra
export const generateSriYantraData = () => {
    const buffers = createBuffer();
    // 9 Interlocking triangles.
    const triangles = [
        { dir: 1, y: 0.2, s: 2.0 },
        { dir: 1, y: 0.5, s: 1.5 },
        { dir: 1, y: 0.8, s: 1.0 },
        { dir: 1, y: 1.0, s: 0.6 },
        { dir: -1, y: -0.2, s: 2.0 },
        { dir: -1, y: -0.5, s: 1.5 },
        { dir: -1, y: -0.8, s: 1.0 },
        { dir: -1, y: -1.0, s: 0.6 },
        { dir: -1, y: -1.2, s: 0.4 },
    ];
    
    const getTriPoint = (t: {dir: number, y: number, s: number}) => {
        let v: THREE.Vector3[];
        if (t.dir === 1) {
            v = [
                new THREE.Vector3(0, t.y + t.s, 0),
                new THREE.Vector3(t.s * 0.866, t.y - t.s * 0.5, 0),
                new THREE.Vector3(-t.s * 0.866, t.y - t.s * 0.5, 0)
            ];
        } else {
             v = [
                new THREE.Vector3(0, t.y - t.s, 0),
                new THREE.Vector3(t.s * 0.866, t.y + t.s * 0.5, 0),
                new THREE.Vector3(-t.s * 0.866, t.y + t.s * 0.5, 0)
            ];
        }
        const edge = Math.floor(Math.random() * 3);
        return new THREE.Vector3().lerpVectors(v[edge], v[(edge+1)%3], Math.random());
    };

    for(let i=0; i<PARTICLE_COUNT; i++) {
        if (Math.random() < 0.1) {
            // Center Bindu
            setParticle(i, buffers, randomInSphere().multiplyScalar(0.1), new THREE.Color(1, 1, 1), 0);
        } else if (Math.random() < 0.8) {
            // Triangles
            const tIdx = Math.floor(Math.random() * triangles.length);
            const p = getTriPoint(triangles[tIdx]);
            p.z = (Math.random()-0.5) * 0.1;
            setParticle(i, buffers, p, new THREE.Color(1, 0.4, 0.4), tIdx + 1);
        } else {
            // Outer Circles
            const r = 2.5;
            const ang = Math.random() * Math.PI * 2;
            const p = new THREE.Vector3(r * Math.cos(ang), r * Math.sin(ang), 0);
            setParticle(i, buffers, p, new THREE.Color(1, 0.8, 0.2), 11);
        }
    }
    return buffers;
};

// 8. Triquetra (New - 3 Continuous Arcs/Petals)
export const generateTriquetraData = () => {
    const buffers = createBuffer();
    
    // Scale factor
    const R = 1.5;
    
    // We generate 3 "petals" or "vesica piscis" shapes arranged radially.
    // Each petal is formed by two circle arcs.
    // To make it look like a continuous knot, we weave them.
    
    for(let i=0; i<PARTICLE_COUNT; i++) {
        // Choose one of 3 petals
        const petal = Math.floor(Math.random() * 3);
        const petalAngle = petal * (2 * Math.PI / 3) + Math.PI/2; // Pointing up at 90 deg
        
        // Construct a single vertical petal (pointed oval)
        // A vesica piscis is the intersection of two circles.
        // We want the outline.
        // Right Arc: Center at (-offset, 0), Radius arcR.
        // Left Arc: Center at (offset, 0), Radius arcR.
        
        const arcR = R * 0.8;
        const offset = R * 0.4;
        
        // To find the tips (intersection points):
        // x=0 => y^2 = arcR^2 - offset^2 => y = +/- sqrt(arcR^2 - offset^2)
        const tipY = Math.sqrt(arcR*arcR - offset*offset);
        
        // We only want the outer arcs that form the petal shape.
        // For Right Arc (center -offset): we want positive X (relative to its center)?
        // No, the petal is centered at 0.
        // Right Arc passes through (0, tipY) and (0, -tipY) and (arcR-offset, 0).
        // This forms the RIGHT side of the petal.
        
        const side = Math.random() > 0.5 ? 1 : -1; // 1 = Right side of petal, -1 = Left side
        
        // Arc Center in local petal space
        const cx = -side * offset; 
        const cy = 0;
        
        // Calculate angle range to hit the tips
        // At tip (0, tipY): 
        // dx = 0 - cx = side*offset
        // dy = tipY
        // angle = atan2(dy, dx)
        const maxAng = Math.atan2(tipY, side * offset); 
        const minAng = Math.atan2(-tipY, side * offset);
        
        // Random angle within the arc segment
        const a = minAng + Math.random() * (maxAng - minAng);
        
        let lx = cx + arcR * Math.cos(a);
        let ly = cy + arcR * Math.sin(a);
        
        // Add thickness/glow
        const jitter = randomInSphere().multiplyScalar(0.06);
        lx += jitter.x;
        ly += jitter.y;
        
        // Rotate to petal position
        const px = lx * Math.cos(petalAngle) - ly * Math.sin(petalAngle);
        const py = lx * Math.sin(petalAngle) + ly * Math.cos(petalAngle);
        
        // Weaving effect (Z-depth)
        // We want over-under pattern at intersections.
        // Intersections happen near the center? No, triquetra loops overlap.
        // Simple heuristic: Z based on distance from center or angle phase
        const pz = Math.sin(a * 4 + petal * 2) * 0.2 + jitter.z;
        
        setParticle(i, buffers, new THREE.Vector3(px, py, pz), new THREE.Color(1, 0.84, 0), petal); // Gold
    }
    return buffers;
};

// 9. Golden Rectangles (New - 3 Orthogonal)
export const generateGoldenRectanglesData = () => {
    const buffers = createBuffer();
    const phi = 1.61803398875;
    const s = 1.5; // Scale
    
    const rects = [
        { type: 0, w: 1, h: phi }, // XY plane? No, Borromean are usually (1, phi, 0) cyclic
        { type: 1, w: 1, h: phi }, 
        { type: 2, w: 1, h: phi }
    ];

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const rIdx = Math.floor(Math.random() * 3);
        const r = rects[rIdx];
        
        // Perimeter position
        const peri = 2 * (r.w + r.h);
        const d = Math.random() * peri;
        
        let u = 0, v = 0;
        if (d < r.w) { u = -r.w/2 + d; v = r.h/2; }
        else if (d < r.w + r.h) { u = r.w/2; v = r.h/2 - (d - r.w); }
        else if (d < 2*r.w + r.h) { u = r.w/2 - (d - (r.w + r.h)); v = -r.h/2; }
        else { u = -r.w/2; v = -r.h/2 + (d - (2*r.w + r.h)); }
        
        u *= s; v *= s;
        
        const jit = randomInSphere().multiplyScalar(0.08);
        const p = new THREE.Vector3();
        
        // Cyclic assignment for Icosahedron planes
        if (rIdx === 0) { 
            // Plane 1: x=u, y=v, z=0 (approx)
            // Actually: (0, +/-1, +/-phi) is one. (+/-phi, 0, +/-1) is another. (+/-1, +/-phi, 0) is third.
            // Let's stick to standard XYZ planes for visual clarity of "3 rectangles"
            p.set(u, v, 0); 
        } else if (rIdx === 1) { 
            p.set(0, u, v); 
        } else { 
            p.set(v, 0, u); 
        }
        
        p.add(jit);
        const c = new THREE.Color(1.0, 0.8 + rIdx*0.05, 0.2); // Gold variants
        
        setParticle(i, buffers, p, c, rIdx);
        
        // Inner Volume (faint)
        if (Math.random() < 0.05) {
             p.multiplyScalar(Math.random());
             setParticle(i, buffers, p, c, 4);
        }
    }
    return buffers;
};

// 5. Earth
export const generateEarthData = () => {
    const buffers = createBuffer();
    
    // Helper to check if point is on land
    const isLand = (lat: number, lon: number) => {
        for (const cap of LAND_CAPS) {
            const dLat = lat - cap.lat;
            let dLon = lon - cap.lon;
            if (dLon > 180) dLon -= 360;
            if (dLon < -180) dLon += 360;
            const dLonCorr = dLon * Math.cos(cap.lat * Math.PI / 180);
            const dist = Math.sqrt(dLat*dLat + dLonCorr*dLonCorr);
            if (dist < cap.r) return true;
        }
        return false;
    };

    const isCity = (lat: number, lon: number) => {
        for (const city of CITY_CAPS) {
            const dLat = lat - city.lat;
            let dLon = lon - city.lon;
            if (dLon > 180) dLon -= 360;
            if (dLon < -180) dLon += 360;
            const dist = Math.sqrt(dLat*dLat + dLon*dLon);
            if (dist < city.r) return true;
        }
        return false;
    };
    
    const R = 2.0;

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2; 
        const phi = Math.acos(2 * Math.random() - 1);
        
        const lat = 90 - (phi * 180 / Math.PI);
        const lon = (theta * 180 / Math.PI) - 180;
        
        let color = new THREE.Color(CONTINENT_COLORS.ocean);
        let r = R;
        let group = 0;
        
        if (isCity(lat, lon)) {
            color = new THREE.Color(CONTINENT_COLORS.city);
            r = R * 1.02;
            group = 2;
        } else if (isLand(lat, lon)) {
            color = new THREE.Color(CONTINENT_COLORS.land);
            color.g += (Math.random()-0.5)*0.1;
            r = R * 1.005;
            group = 1;
        } else {
             color.b += (Math.random()-0.5)*0.1;
        }
        
        if (Math.random() < 0.15) {
             r = R * 1.05;
             color = new THREE.Color(CONTINENT_COLORS.cloud);
             group = 3;
        }

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        
        setParticle(i, buffers, new THREE.Vector3(x, y, z), color, group);
    }
    return buffers;
};
