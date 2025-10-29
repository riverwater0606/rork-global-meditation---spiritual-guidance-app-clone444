import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');

const child = spawn('npx', ['expo', 'export', '--platform', 'web'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    CI: '1',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[export-web] Failed to start expo export:', error);
  process.exit(1);
});
