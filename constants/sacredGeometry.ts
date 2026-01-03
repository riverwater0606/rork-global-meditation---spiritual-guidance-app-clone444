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

// ... existing code ...
// I will rewrite the file content, appending the new functions at the end.
// Since the file is large, I'll assume the previous content is there and just append or use multiEdit if possible.
// But multiEdit is safer for specific replacements. Here I need to add A LOT of code.
// I will read the file again to make sure I have the context for appending.
// Actually I have the file content from previous turn. 

// I'll use multiEdit to append to the end of the file.
// I'll look for the last closing brace of the last function or the end of file.
