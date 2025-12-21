/**
 * Multiple_Direct.cjs - Test sending multiple jobs via AME Web Service (localhost)
 */

const http = require('http')
const { exec, spawn } = require('child_process')

// Connection settings - LOCALHOST
const HOST = 'localhost'
const PORT = 12345

// Test files
const TEST_FILES = [
  'D:\\CACHE\\AME\\test_A.mov',
  'D:\\CACHE\\AME\\test_B.mov',
  'D:\\CACHE\\AME\\test_C.mov',
  'D:\\CACHE\\AME\\test_D.mov'
]

const OUTPUT_DIR = 'D:\\CACHE\\AME\\Proxies'
const PRESET_PATH = 'C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\proxy1.epr'

const AME_CONSOLE_PATH = 'C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\ame_webservice_console.exe'

// --- UTILITY FUNCTIONS ---
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateXML(inputPath, outputPath, presetPath) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(inputPath)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(outputPath)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(presetPath)}</SourcePresetPath>\n`
  xml += '</manifest>\n'
  return xml
}

function getOutputPath(inputPath) {
  const fileName = inputPath.split('\\').pop().replace('.mov', '_proxy.mov')
  return `${OUTPUT_DIR}\\${fileName}`
}

// --- PROCESS MANAGEMENT ---
async function ensureAMERunning() {
  return new Promise((resolve) => {
    console.log("🧹 Cleaning up orphaned web service instances...")
    exec('taskkill /f /im ame_webservice_console.exe', () => {
      exec('tasklist /FI "IMAGENAME eq Adobe Media Encoder.exe"', (err, stdout) => {
        const isRunning = stdout.toLowerCase().includes("adobe media encoder.exe")
        
        if (!isRunning) {
          console.log("🚀 AME is not running. Launching via Web Service Console...")
          const child = spawn(AME_CONSOLE_PATH, [], { detached: true, stdio: 'ignore' })
          child.unref()
          console.log("⏳ Waiting 15 seconds for AME and Web Service to handshake...")
          setTimeout(resolve, 15000)
        } else {
          console.log("⚠️ AME is open but console was reset. Restarting listener...")
          const child = spawn(AME_CONSOLE_PATH, [], { detached: true, stdio: 'ignore' })
          child.unref()
          console.log("⏳ Waiting 5 seconds for Web Service to re-bind...")
          setTimeout(resolve, 5000)
        }
      })
    })
  })
}

// --- WEB SERVICE COMMUNICATION ---
function sendJob(xml) {
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

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data })
      })
    })

    req.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        resolve({ statusCode: 200, body: 'ECONNRESET (likely success)' })
      } else {
        reject(err)
      }
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(xml)
    req.end()
  })
}

// --- MAIN TEST ---
async function run() {
  console.log('='.repeat(60))
  console.log('Multiple Jobs Test - LOCALHOST (' + HOST + ':' + PORT + ')')
  console.log('='.repeat(60))
  
  await ensureAMERunning()
  
  console.log('\n📋 Submitting', TEST_FILES.length, 'jobs RAPIDLY (no delay between)...\n')
  
  const results = []
  
  for (let i = 0; i < TEST_FILES.length; i++) {
    const inputPath = TEST_FILES[i]
    const outputPath = getOutputPath(inputPath)
    const xml = generateXML(inputPath, outputPath, PRESET_PATH)
    
    console.log(`📤 Job ${i + 1}: ${inputPath.split('\\').pop()}`)
    
    try {
      const response = await sendJob(xml)
      const isAccepted = response.body.includes('<SubmitResult>Accepted')
      const isBusy = response.body.includes('<SubmitResult>Busy')
      
      console.log(`   Status: ${response.statusCode}`)
      console.log(`   Result: ${isAccepted ? '✅ ACCEPTED' : isBusy ? '⏳ BUSY' : '❓ OTHER'}`)
      
      results.push({ file: inputPath.split('\\').pop(), accepted: isAccepted, busy: isBusy })
    } catch (error) {
      console.log(`   ❌ Error: ${error.message || error.code || JSON.stringify(error)}`)
      results.push({ file: inputPath.split('\\').pop(), error: error.message || error.code || 'unknown' })
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY:')
  console.log('  Accepted:', results.filter(r => r.accepted).length)
  console.log('  Busy:', results.filter(r => r.busy).length)
  console.log('  Errors:', results.filter(r => r.error).length)
  console.log('='.repeat(60))
}

run().catch(console.error)

