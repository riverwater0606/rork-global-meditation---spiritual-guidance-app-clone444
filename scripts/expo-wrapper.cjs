#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const projectRoot = path.resolve(__dirname, '..');
const binDir = path.join(projectRoot, 'node_modules', '.bin');
const originalCli = path.join(binDir, 'expo-original');

function run(cliArgs) {
  const child = spawn(originalCli, cliArgs, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

if (args[0] === 'export:web') {
  run([
    'export',
    '--platform',
    'web',
    ...args.slice(1),
  ]);
} else {
  run(args);
}
