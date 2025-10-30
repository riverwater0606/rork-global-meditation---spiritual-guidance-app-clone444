import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const pkgDir = path.join(projectRoot, 'node_modules', '@worldcoin', 'minikit-js');
const jsTarget = path.join(pkgDir, 'minikit.js');
const dtsTarget = path.join(pkgDir, 'minikit.d.ts');
const packageJsonPath = path.join(pkgDir, 'package.json');
const idKitDir = path.join(projectRoot, 'node_modules', '@worldcoin', 'idkit-core');
const idKitPackageJsonPath = path.join(idKitDir, 'package.json');
const idKitHashingJs = path.join(idKitDir, 'hashing.js');
const idKitHashingDts = path.join(idKitDir, 'hashing.d.ts');
const idKitBackendJs = path.join(idKitDir, 'backend.js');
const idKitBackendDts = path.join(idKitDir, 'backend.d.ts');

try {
  if (fs.existsSync(pkgDir)) {
    if (!fs.existsSync(jsTarget)) {
      const jsContent = "export { MiniKit } from './build/index.js';\n";
      fs.writeFileSync(jsTarget, jsContent);
      console.log('[fix-minikit-entry] Created minikit.js shim');
    }
    if (!fs.existsSync(dtsTarget)) {
      const dtsContent = "export { MiniKit } from './build/index.js';\n";
      fs.writeFileSync(dtsTarget, dtsContent);
      console.log('[fix-minikit-entry] Created minikit.d.ts shim');
    }

    if (fs.existsSync(packageJsonPath)) {
      const raw = fs.readFileSync(packageJsonPath, 'utf8');
      const pkgJson = JSON.parse(raw);
      let mutated = false;

      if (pkgJson.main !== './build/index.js') {
        pkgJson.main = './build/index.js';
        mutated = true;
      }

      if (pkgJson.module && pkgJson.module !== './build/index.js') {
        pkgJson.module = './build/index.js';
        mutated = true;
      }

      if (pkgJson.types !== './build/index.d.ts') {
        pkgJson.types = './build/index.d.ts';
        mutated = true;
      }

      if (pkgJson.exports?.['.']?.import?.default !== './build/index.js') {
        pkgJson.exports = pkgJson.exports || {};
        pkgJson.exports['.'] = pkgJson.exports['.'] || {};
        pkgJson.exports['.'].import = pkgJson.exports['.'].import || {};
        pkgJson.exports['.'].import.types = './build/index.d.ts';
        pkgJson.exports['.'].import.default = './build/index.js';
        pkgJson.exports['.'].require = pkgJson.exports['.'].require || {};
        pkgJson.exports['.'].require.types = './build/index.d.cts';
        pkgJson.exports['.'].require.default = './build/index.cjs';
        mutated = true;
      }

      if (mutated) {
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
        console.log('[fix-minikit-entry] Updated package.json entrypoints');
      }
    }
  }
} catch (error) {
  console.warn('[fix-minikit-entry] Failed to create shim files', error);
}

try {
  if (fs.existsSync(idKitPackageJsonPath)) {
    const raw = fs.readFileSync(idKitPackageJsonPath, 'utf8');
    const pkgJson = JSON.parse(raw);
    let mutated = false;

    if (pkgJson.main !== './build/index.js') {
      pkgJson.main = './build/index.js';
      mutated = true;
    }

    if (pkgJson.module && pkgJson.module !== './build/index.js') {
      pkgJson.module = './build/index.js';
      mutated = true;
    }

    if (pkgJson.types !== './build/index.d.ts') {
      pkgJson.types = './build/index.d.ts';
      mutated = true;
    }

    if (pkgJson.exports?.['.']?.import !== './build/index.js') {
      pkgJson.exports = pkgJson.exports || {};
      pkgJson.exports['.'] = {
        ...(pkgJson.exports['.'] || {}),
        import: './build/index.js',
        types: './build/index.d.ts',
        require: './build/index.cjs',
      };
      mutated = true;
    }

    if (pkgJson.exports?.['./backend']?.import !== './build/lib/backend.js') {
      pkgJson.exports = pkgJson.exports || {};
      pkgJson.exports['./backend'] = {
        import: './build/lib/backend.js',
        types: './build/lib/backend.d.ts',
        require: './build/lib/backend.cjs',
      };
      mutated = true;
    }

    if (pkgJson.exports?.['./hashing']?.import !== './build/lib/hashing.js') {
      pkgJson.exports = pkgJson.exports || {};
      pkgJson.exports['./hashing'] = {
        import: './build/lib/hashing.js',
        types: './build/lib/hashing.d.ts',
        require: './build/lib/hashing.cjs',
      };
      mutated = true;
    }

    if (mutated) {
      fs.writeFileSync(idKitPackageJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
      console.log('[fix-minikit-entry] Updated idkit-core package.json entrypoints');
    }

    if (!fs.existsSync(idKitHashingJs)) {
      fs.writeFileSync(idKitHashingJs, "export * from './build/lib/hashing.js';\n");
      console.log('[fix-minikit-entry] Created idkit-core hashing.js shim');
    }

    if (!fs.existsSync(idKitHashingDts)) {
      fs.writeFileSync(idKitHashingDts, "export * from './build/lib/hashing.js';\n");
      console.log('[fix-minikit-entry] Created idkit-core hashing.d.ts shim');
    }

    if (!fs.existsSync(idKitBackendJs)) {
      fs.writeFileSync(idKitBackendJs, "export * from './build/lib/backend.js';\n");
      console.log('[fix-minikit-entry] Created idkit-core backend.js shim');
    }

    if (!fs.existsSync(idKitBackendDts)) {
      fs.writeFileSync(idKitBackendDts, "export * from './build/lib/backend.js';\n");
      console.log('[fix-minikit-entry] Created idkit-core backend.d.ts shim');
    }
  }
} catch (error) {
  console.warn('[fix-minikit-entry] Failed to update idkit-core entrypoints', error);
}
