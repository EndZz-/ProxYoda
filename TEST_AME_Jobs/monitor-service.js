#!/usr/bin/env node

/**
 * Monitor AME Web Service status continuously
 * Useful for testing when you're making changes
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

async function checkStatus() {
  return new Promise((resolve) => {
    const localIP = getLocalIP()
    const options = {
      hostname: localIP,
      port: 8080,
      path: '/server',
      method: 'GET',
      timeout: 2000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const isOnline = data.includes('ServerStatus>Online') || 
                        (data.includes('ServerStatus>Offline') === false && res.statusCode === 200)
        const hasServer = !data.includes('NoServer')
        resolve({ online: isOnline, hasServer, data })
      })
    })

    req.on('error', () => {
      resolve({ online: false, hasServer: false, error: true })
    })

    req.end()
  })
}

function getAMEStatus() {
  try {
    execSync('tasklist | findstr "Adobe Media Encoder"', { encoding: 'utf-8' })
    return 'RUNNING'
  } catch {
    return 'STOPPED'
  }
}

function getConsoleStatus() {
  try {
    execSync('tasklist | findstr "ame_webservice_console"', { encoding: 'utf-8' })
    return 'RUNNING'
  } catch {
    return 'STOPPED'
  }
}

async function monitor() {
  console.clear()
  console.log('📡 AME Web Service Monitor')
  console.log('='.repeat(50))
  console.log(`Last updated: ${new Date().toLocaleTimeString()}`)
  console.log('Press Ctrl+C to stop\n')

  while (true) {
    const status = await checkStatus()
    const ameStatus = getAMEStatus()
    const consoleStatus = getConsoleStatus()

    console.log('\r📊 Status:')
    console.log(`  Console: ${consoleStatus === 'RUNNING' ? '✅' : '❌'} ${consoleStatus}`)
    console.log(`  AME:     ${ameStatus === 'RUNNING' ? '✅' : '❌'} ${ameStatus}`)
    console.log(`  Server:  ${status.online ? '✅' : '❌'} ${status.online ? 'ONLINE' : 'OFFLINE'}`)
    
    if (status.error) {
      console.log(`  Connection: ❌ ERROR`)
    } else {
      console.log(`  Connection: ✅ OK`)
    }

    console.log(`\n⏰ Checking every 2 seconds... (${new Date().toLocaleTimeString()})`)

    await new Promise(r => setTimeout(r, 2000))
  }
}

monitor().catch(console.error)

