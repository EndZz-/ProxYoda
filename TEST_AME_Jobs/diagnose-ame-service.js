#!/usr/bin/env node

/**
 * Diagnostic script to check AME Web Service status
 * Helps understand what's happening with the service
 */

import http from 'http'
import os from 'os'
import { execSync } from 'child_process'

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

async function checkServerStatus() {
  return new Promise((resolve) => {
    const localIP = getLocalIP()
    const options = {
      hostname: localIP,
      port: 8080,
      path: '/server',
      method: 'GET',
      timeout: 3000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data })
      })
    })

    req.on('error', (err) => {
      resolve({ error: err.message })
    })

    req.end()
  })
}

function checkAMEProcess() {
  try {
    const output = execSync('tasklist | findstr "Adobe Media Encoder"', { encoding: 'utf-8' })
    return output.trim() ? 'RUNNING' : 'NOT RUNNING'
  } catch {
    return 'NOT RUNNING'
  }
}

function checkWebServiceConsole() {
  try {
    const output = execSync('tasklist | findstr "ame_webservice_console"', { encoding: 'utf-8' })
    return output.trim() ? 'RUNNING' : 'NOT RUNNING'
  } catch {
    return 'NOT RUNNING'
  }
}

async function runDiagnostics() {
  console.log('🔍 AME Web Service Diagnostics')
  console.log('='.repeat(50))

  console.log('\n📊 Process Status:')
  console.log(`  AME Instance: ${checkAMEProcess()}`)
  console.log(`  Web Service Console: ${checkWebServiceConsole()}`)

  console.log('\n🌐 Network:')
  console.log(`  Local IP: ${getLocalIP()}`)
  console.log(`  Target: ${getLocalIP()}:8080`)

  console.log('\n📡 Server Status Check:')
  const status = await checkServerStatus()
  
  if (status.error) {
    console.log(`  ❌ Connection Error: ${status.error}`)
  } else {
    console.log(`  ✅ Connected (Status: ${status.statusCode})`)
    console.log(`  Response:`)
    console.log(status.body)
  }

  console.log('\n💡 Analysis:')
  const ameRunning = checkAMEProcess() === 'RUNNING'
  const consoleRunning = checkWebServiceConsole() === 'RUNNING'
  
  if (!consoleRunning) {
    console.log('  ⚠️  Web Service Console is NOT running')
    console.log('     Start it: C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\ame_webservice_console.exe')
  } else if (!ameRunning) {
    console.log('  ⚠️  AME instance is NOT running')
    console.log('     The console is running but no AME instance is connected')
    console.log('     This is why jobs return "ServerStatus>Offline"')
    console.log('\n  To fix:')
    console.log('  1. Keep the web service console running')
    console.log('  2. Launch AME separately (it should auto-connect)')
    console.log('  3. Or launch AME with: --webservice flag')
  } else {
    console.log('  ✅ Both console and AME are running')
    console.log('     Jobs should work now')
  }
}

runDiagnostics().catch(console.error)

