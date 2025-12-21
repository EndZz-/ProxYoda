#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Find AME installation
const amePaths = [
  'C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\Adobe Media Encoder.exe',
  'C:\\Program Files\\Adobe\\Adobe Media Encoder 2024\\Adobe Media Encoder.exe',
  'C:\\Program Files (x86)\\Adobe\\Adobe Media Encoder 2025\\Adobe Media Encoder.exe',
];

let amePath = null;
const fs = require('fs');
for (const p of amePaths) {
  if (fs.existsSync(p)) {
    amePath = p;
    break;
  }
}

if (!amePath) {
  console.error('❌ Adobe Media Encoder not found');
  process.exit(1);
}

console.log(`Found AME at: ${amePath}`);
console.log('\nLaunching AME with web service enabled...');
console.log('Command: "' + amePath + '" --webservice');

// Launch AME with web service
const child = spawn(amePath, ['--webservice'], {
  detached: true,
  stdio: 'ignore'
});

child.unref();

console.log('✅ AME launched with web service');
console.log('Wait a few seconds for AME to start, then run: node test-ame-webservice.cjs');

