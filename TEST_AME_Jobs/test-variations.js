#!/usr/bin/env node

/**
 * Test different XML variations to find what works with AME web service
 * This helps us understand the correct format and fields needed
 */

import http from 'http'
import os from 'os'

const TEST_FILE = 'D:\\- CACHE\\AME\\Test.mov'
const PROXY_PATH = 'D:\\- CACHE\\AME\\Proxies'
const OUTPUT_PATH = `${PROXY_PATH}\\Test_Proxy.mov`
const PRESET_PATH = 'C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\proxy1.epr'

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

function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Variation 1: Current format (DestinationPath = directory)
function xmlVariation1() {
  const destinationDir = OUTPUT_PATH.substring(0, OUTPUT_PATH.lastIndexOf('\\'))
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(TEST_FILE)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(destinationDir)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(PRESET_PATH)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

// Variation 2: DestinationPath = full output file path
function xmlVariation2() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(TEST_FILE)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(OUTPUT_PATH)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(PRESET_PATH)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

// Variation 3: With OutputFilename
function xmlVariation3() {
  const destinationDir = OUTPUT_PATH.substring(0, OUTPUT_PATH.lastIndexOf('\\'))
  const filename = OUTPUT_PATH.substring(OUTPUT_PATH.lastIndexOf('\\') + 1)
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(TEST_FILE)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(destinationDir)}</DestinationPath>\n`
  xml += `  <OutputFilename>${escapeXML(filename)}</OutputFilename>\n`
  xml += `  <SourcePresetPath>${escapeXML(PRESET_PATH)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

// Variation 4: With Job wrapper
function xmlVariation4() {
  const destinationDir = OUTPUT_PATH.substring(0, OUTPUT_PATH.lastIndexOf('\\'))
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += '  <Job>\n'
  xml += `    <SourceFilePath>${escapeXML(TEST_FILE)}</SourceFilePath>\n`
  xml += `    <DestinationPath>${escapeXML(destinationDir)}</DestinationPath>\n`
  xml += `    <SourcePresetPath>${escapeXML(PRESET_PATH)}</SourcePresetPath>\n`
  xml += '  </Job>\n'
  xml += '</manifest>\n'
  return xml
}

async function sendXML(xml, variationName) {
  return new Promise((resolve) => {
    const localIP = getLocalIP()
    const options = {
      hostname: localIP,
      port: 8080,
      path: '/job',
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(xml)
      },
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log(`\n${variationName}:`)
        console.log(`  Status: ${res.statusCode}`)
        if (data.includes('NoServer')) console.log('  Result: ❌ NoServer')
        else if (data.includes('Success')) console.log('  Result: ✅ Success')
        else console.log('  Result: ⚠️  Unknown')
        resolve()
      })
    })

    req.on('error', () => resolve())
    req.write(xml)
    req.end()
  })
}

async function runTests() {
  console.log('🧪 Testing XML Variations\n')
  
  await sendXML(xmlVariation1(), 'Variation 1 (Dir only)')
  await new Promise(r => setTimeout(r, 1000))
  
  await sendXML(xmlVariation2(), 'Variation 2 (Full path)')
  await new Promise(r => setTimeout(r, 1000))
  
  await sendXML(xmlVariation3(), 'Variation 3 (With filename)')
  await new Promise(r => setTimeout(r, 1000))
  
  await sendXML(xmlVariation4(), 'Variation 4 (Job wrapper)')
  
  console.log('\n✅ All variations tested')
}

runTests().catch(console.error)

