#!/usr/bin/env node

/**
 * Test script for sending jobs to AME Web Service
 * Updated for specific paths: D:\- CACHE\AME\Test.mov
 */

import http from 'http'
import os from 'os'
import path from 'path'

// Configuration - Updated with your requested paths
const TEST_FILE = 'D:\\- CACHE\\AME\\Test.mov'
const PROXY_PATH = 'D:\\- CACHE\\AME\\Proxies\\test2.mov' // Note: Web service prefers trailing slash for directories
const PRESET_PATH = 'C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\Proxy3.epr'

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

// Escape XML special characters
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Generate XML manifest for web service
function generateXML(inputPath, destinationDir, presetPath) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(inputPath)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(destinationDir)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(presetPath)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

// Send job to AME Web Service
async function sendJobToAME(xml) {
  return new Promise((resolve, reject) => {
    // Note: Using 'localhost' is often more reliable than Local IP for 2025 Windows security
    const options = {
      hostname: '192.168.10.57', 
      port: 8087,
      path: '/job',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(xml)
      },
      timeout: 5000
    }

    console.log(`\n📤 Sending to ${options.hostname}:${options.port}${options.path}`)

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log(`\n📥 Response (status: ${res.statusCode}):`)
        console.log(data)
        resolve({ statusCode: res.statusCode, body: data })
      })
    })

    req.on('error', (error) => {
      console.error(`\n❌ Error:`, error.message)
      reject(error)
    })

    req.on('timeout', () => {
      console.error(`\n❌ Timeout after 5 seconds`)
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(xml)
    req.end()
  })
}

// Main test function
async function runTest() {
  console.log('🧪 AME Web Service Job Test')
  console.log('='.repeat(50))
  console.log(`\n📁 Test File: ${TEST_FILE}`)
  console.log(`📁 Destination: ${PROXY_PATH}`)
  console.log(`📁 Preset: ${PRESET_PATH}`)

  // Generate XML
  const xml = generateXML(TEST_FILE, PROXY_PATH, PRESET_PATH)
  console.log('\n📋 Generated XML:')
  console.log('─'.repeat(50))
  console.log(xml)
  console.log('─'.repeat(50))

  // Send to AME
  try {
    const response = await sendJobToAME(xml)
    if (response.body.includes('Succeeded')) {
      console.log('\n✅ Job added to AME Queue successfully!')
    } else if (response.body.includes('Offline')) {
      console.log('\n⚠️  AME is open but Web Service is reporting OFFLINE status.')
    }
  } catch (error) {
    console.error('\n❌ Failed to connect to AME Web Service. Check if ame_webservice_console.exe is running.')
  }
}

runTest().catch(console.error)
