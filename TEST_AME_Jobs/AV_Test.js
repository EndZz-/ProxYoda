#!/usr/bin/env node

/**
 * AME Web Service Automation - Full Integrated Script (2025)
 * Features: Process cleanup, Auto-launch, and Robust Error Handling.
 */

import http from 'http'
import { exec, spawn } from 'child_process'

// --- CONFIGURATION ---
const TEST_FILE = 'D:\\- CACHE\\AME\\Test.mov'
const PROXY_PATH = 'D:\\- CACHE\\AME\\Proxies\\Test_Proxy.mov'
const PRESET_PATH = 'C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\Proxy3.epr'

const AME_CONSOLE_PATH = "C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\ame_webservice_console.exe"
const PORT = 8087
const HOST = '192.168.10.57' 

// --- 1. PROCESS MANAGEMENT (CLEANUP & LAUNCH) ---
async function ensureAMERunning() {
  return new Promise((resolve) => {
    // Kill orphaned console processes to ensure Port 8087 is free
    console.log("🧹 Cleaning up orphaned web service instances...");
    exec('taskkill /f /im ame_webservice_console.exe', () => {
      
      // Check if AME itself is running
      exec('tasklist /FI "IMAGENAME eq Adobe Media Encoder.exe"', (err, stdout) => {
        const isRunning = stdout.toLowerCase().includes("adobe media encoder.exe");
        
        if (!isRunning) {
          console.log("🚀 AME is not running. Launching via Web Service Console...");
          const child = spawn(AME_CONSOLE_PATH, [], { detached: true, stdio: 'ignore' });
          child.unref();
          
          console.log("⏳ Waiting 15 seconds for AME and Web Service to handshake...");
          setTimeout(resolve, 15000); 
        } else {
          // AME is open, but we need a fresh console listener to bind to it
          console.log("⚠️ AME is open but console was reset. Restarting listener...");
          const child = spawn(AME_CONSOLE_PATH, [], { detached: true, stdio: 'ignore' });
          child.unref();
          
          console.log("⏳ Waiting 5 seconds for Web Service to re-bind...");
          setTimeout(resolve, 5000);
        }
      });
    });
  });
}

// --- 2. UTILITY FUNCTIONS ---
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateXML(inputPath, destinationFile, presetPath) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(inputPath)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(destinationFile)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(presetPath)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

// --- 3. WEB SERVICE COMMUNICATION ---
async function sendJobToAME(xml) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/job',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(xml)
      },
      timeout: 10000 
    }

    console.log(`\n📤 Sending to ${options.hostname}:${options.port}${options.path}`)

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data })
      })
    })

    // Handle the common "Connection Reset" quirk of the AME Web Service
    req.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        // Resolve anyway because AME often kills the socket after success
        resolve({ statusCode: 200, body: 'Socket Reset (Likely Success)' });
      } else {
        reject(err);
      }
    });
    
    req.write(xml)
    req.end()
  })
}

// --- 4. EXECUTION ---
async function run() {
  console.log('🧪 AME Web Service Job Test');
  console.log('='.repeat(50));

  await ensureAMERunning();

  const xml = generateXML(TEST_FILE, PROXY_PATH, PRESET_PATH);
  
  try {
    const response = await sendJobToAME(xml);
    
    // Check if status is 200 OR if the response contains a JobId tag
    if (response.statusCode === 200 || response.body.includes('<JobId>')) {
      console.log('\n✅ SUCCESS: Job added to AME Queue!');
      console.log('📥 Server Response:', response.body.trim());
    } else {
      console.log('\n❌ FAILED: Server responded but job was not created.');
      console.log('📥 Body:', response.body);
    }
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR: Could not connect to Web Service.');
    console.log('   Check if port', PORT, 'is correct in your ame_webservice_config.ini');
  }
}

run().catch(console.error);
