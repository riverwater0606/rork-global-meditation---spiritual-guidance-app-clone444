import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const binDir = path.join(projectRoot, 'node_modules', '.bin');
const expoBin = path.join(binDir, 'expo');
const wrapperSource = path.join(projectRoot, 'scripts', 'expo-wrapper.mjs');

try {
  if (!fs.existsSync(wrapperSource)) {
    console.warn('[patch-expo-bin] Wrapper script missing, skipping');
    process.exit(0);
  }

  if (!fs.existsSync(expoBin)) {
    console.warn('[patch-expo-bin] Expo binary not found at', expoBin);
    process.exit(0);
  }

  const original = fs.readFileSync(expoBin, 'utf8');
  if (original.includes('expo-wrapper.mjs')) {
    // Already patched.
    process.exit(0);
  }

  const backupPath = path.join(binDir, 'expo-original');
  fs.writeFileSync(backupPath, original, 'utf8');

  const wrapperContent = `#!/usr/bin/env node\nrequire(${JSON.stringify(wrapperSource)});\n`;
  fs.writeFileSync(expoBin, wrapperContent, { mode: 0o755 });
  console.log('[patch-expo-bin] Patched expo binary to use wrapper');
} catch (error) {
  console.warn('[patch-expo-bin] Failed to patch expo binary:', error);
}
