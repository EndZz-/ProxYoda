#!/usr/bin/env node

const http = require('http');
const os = require('os');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`Local IP: ${localIP}`);

// Test different connection options
const testHosts = [
  { hostname: 'localhost', port: 8080 },
  { hostname: '127.0.0.1', port: 8080 },
  { hostname: localIP, port: 8080 },
];

async function testConnection(hostname, port) {
  return new Promise((resolve) => {
    console.log(`\nTesting connection to ${hostname}:${port}...`);
    
    const options = {
      hostname,
      port,
      path: '/server',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Connected! Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(3000);
    req.end();
  });
}

async function checkServerStatus(hostname, port) {
  return new Promise((resolve) => {
    console.log(`\nChecking server status at ${hostname}:${port}...`);

    const options = {
      hostname,
      port,
      path: '/server',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Server status response:\n${data}`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Status check failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

async function testJobSubmission(hostname, port) {
  return new Promise((resolve) => {
    console.log(`\nTesting job submission to ${hostname}:${port}...`);

    const jobXML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest version="1.0">
  <SourceFilePath>D:\\test\\input.mov</SourceFilePath>
  <DestinationPath>D:\\test\\output</DestinationPath>
  <SourcePresetPath>C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\proxy1.epr</SourcePresetPath>
</manifest>`;

    const options = {
      hostname,
      port,
      path: '/job',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(jobXML)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response body:\n${data}`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Job submission failed: ${error.message}`);
      resolve(false);
    });

    req.write(jobXML);
    req.end();
  });
}

async function main() {
  console.log('=== AME Web Service Connection Tester ===\n');

  for (const host of testHosts) {
    const connected = await testConnection(host.hostname, host.port);
    if (connected) {
      console.log(`\n✅ Found working connection at ${host.hostname}:${host.port}`);
      await checkServerStatus(host.hostname, host.port);
      await testJobSubmission(host.hostname, host.port);
      break;
    }
  }
}

main();

