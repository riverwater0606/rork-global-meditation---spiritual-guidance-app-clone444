import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const appDir = path.join(projectRoot, 'app');
const targetLink = path.resolve(projectRoot, '..', 'app');

try {
  const stats = fs.lstatSync(targetLink);
  if (stats.isSymbolicLink() || stats.isDirectory()) {
    // Already exists, nothing to do.
    process.exit(0);
  }
} catch (error) {
  if ((error && error.code) !== 'ENOENT') {
    console.warn('[setup-web-export] Unable to inspect existing target:', error);
  }
}

try {
  if (!fs.existsSync(appDir)) {
    console.warn('[setup-web-export] Project app directory missing:', appDir);
    process.exit(0);
  }

  if (fs.existsSync(targetLink)) {
    // Remove stale file.
    fs.rmSync(targetLink, { recursive: true, force: true });
  }

  fs.symlinkSync(appDir, targetLink, 'dir');
  console.log('[setup-web-export] Created symlink', targetLink, '->', appDir);
} catch (error) {
  console.warn('[setup-web-export] Failed to create symlink:', error);
}
