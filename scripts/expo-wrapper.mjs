#!/usr/bin/env node
import { spawn } from 'child_process';
import { createRequire } from 'module';

const args = process.argv.slice(2);
const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');

function run(commandArgs) {
  const child = spawn(process.execPath, commandArgs, {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

if (args[0] === 'export:web') {
  run([
    expoCli,
    'export',
    '--platform',
    'web',
    '--non-interactive',
    '--log-level',
    'debug',
    ...args.slice(1),
  ]);
} else {
  run([expoCli, ...args]);
}
