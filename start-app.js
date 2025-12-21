import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Vite dev server
console.log('Starting Vite dev server...');
const vite = spawn('node', ['node_modules/vite/bin/vite.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Wait for Vite to start, then start Electron
setTimeout(() => {
  console.log('Starting Electron app...');
  const electron = spawn('node', ['node_modules/electron/dist/electron.js', '.'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  electron.on('close', (code) => {
    console.log('Electron app closed');
    vite.kill();
    process.exit(code);
  });
}, 5000);

vite.on('close', (code) => {
  console.log('Vite dev server closed');
  process.exit(code);
});

