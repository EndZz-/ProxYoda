import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { execSync, spawn, exec } from 'child_process'
import ffprobeStatic from 'ffprobe-static'
import os from 'os'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use Electron's built-in app.isPackaged instead of electron-is-dev
const isDev = !app.isPackaged

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Dev tools can be opened manually with Ctrl+Shift+I or View menu
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('App ready event fired')
  createWindow()
});

app.on('window-all-closed', () => {
  console.log('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for file dialogs
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

// IPC handlers for file operations
ipcMain.handle('file:readDir', async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true })
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name),
    }))
  } catch (error) {
    return { error: error.message }
  }
})

// Helper function to get bundled MediaInfo CLI path
function getBundledMediaInfoPath() {
  if (app.isPackaged) {
    // In packaged app, MediaInfo is in resources folder
    return path.join(process.resourcesPath, 'MediaInfo', 'MediaInfo.exe')
  } else {
    // In development, use the Dependencies folder
    return path.join(__dirname, '..', 'Dependencies', 'MediaInfo_CLI_25.10_Windows_x64', 'MediaInfo.exe')
  }
}

// IPC handler for getting video metadata
ipcMain.handle('video:getMetadata', async (event, filePath) => {
  try {
    // Try MediaInfo first (better support for NOTCHLC files)
    try {
      // Try bundled MediaInfo CLI first, then fall back to system locations
      const mediaInfoPaths = [
        getBundledMediaInfoPath(),  // Bundled with app
        'mediainfo',  // If in PATH
      ]

      let output = null
      for (const mediaInfoPath of mediaInfoPaths) {
        try {
          const mediaInfoCmd = `"${mediaInfoPath}" --Inform="Video;%Width%|%Height%|%Frame_rate%" "${filePath}"`
          output = execSync(mediaInfoCmd, { encoding: 'utf-8' }).trim()
          if (output) break
        } catch (e) {
          // Try next path
          continue
        }
      }

      if (!output) {
        throw new Error('MediaInfo CLI not found')
      }

      if (output) {
        const parts = output.split('|')
        if (parts.length >= 2) {
          // Remove spaces (thousand separators) and parse
          const width = parseInt(parts[0].replace(/\s/g, ''))
          const height = parseInt(parts[1].replace(/\s/g, ''))
          const fps = parts[2] ? parts[2].trim() : null

          if (width && height && !isNaN(width) && !isNaN(height)) {
            console.log(`MediaInfo: Got resolution ${width}x${height} for ${filePath}`)
            return {
              width: width,
              height: height,
              fps: fps || null,
            }
          }
        }
      }
    } catch (mediaInfoError) {
      console.log('MediaInfo not available or failed:', mediaInfoError.message)
    }

    // Fall back to ffprobe
    try {
      const ffprobePath = ffprobeStatic.path
      const cmd = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "${filePath}"`
      const output = execSync(cmd, { encoding: 'utf-8' }).trim()

      if (!output) {
        return { error: 'No video stream found' }
      }

      const [width, height, fps] = output.split(',')
      console.log(`ffprobe: Got resolution ${width}x${height} for ${filePath}`)
      return {
        width: parseInt(width),
        height: parseInt(height),
        fps: fps,
      }
    } catch (ffprobeError) {
      console.error('ffprobe also failed:', ffprobeError.message)
      return { error: 'Could not determine video resolution with MediaInfo or ffprobe' }
    }
  } catch (error) {
    console.error('Error getting video metadata:', error.message)
    return { error: error.message }
  }
})

// IPC handler for saving preset files
ipcMain.handle('ame:savePreset', async (event, presetName, presetXML, version) => {
  try {
    const { execSync } = require('child_process')
    const userName = process.env.USERNAME
    const presetDir = `C:\\Users\\${userName}\\Documents\\Adobe\\Adobe Media Encoder\\${version}\\Presets`

    // Create directory if it doesn't exist
    if (!fs.existsSync(presetDir)) {
      fs.mkdirSync(presetDir, { recursive: true })
    }

    const presetPath = path.join(presetDir, `${presetName}.epr`)
    fs.writeFileSync(presetPath, presetXML, 'utf-8')

    return { success: true, path: presetPath }
  } catch (error) {
    return { error: error.message }
  }
})

// Helper function to check if AME is currently running
async function isAMERunning() {
  try {
    return new Promise((resolve) => {
      // First try the specific filter
      exec('tasklist /FI "IMAGENAME eq Adobe Media Encoder.exe"', (error, stdout) => {
        if (error) {
          console.log('   tasklist error:', error.message)
          resolve(false)
          return
        }

        console.log('   tasklist full output:')
        console.log(stdout)

        // Check multiple variations
        const isRunning =
          stdout.toLowerCase().includes('adobe media encoder.exe') ||
          stdout.toLowerCase().includes('adobe media encoder') ||
          stdout.toLowerCase().includes('ame.exe')

        console.log('   AME detected:', isRunning)
        resolve(isRunning)
      })
    })
  } catch (error) {
    console.error('   Error checking if AME is running:', error)
    return false
  }
}

// Helper function to get local IP address
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

// Helper function to kill orphaned ame_webservice_console.exe processes
async function killWebServiceConsole() {
  return new Promise((resolve) => {
    console.log('   🧹 Cleaning up orphaned web service console instances...')
    exec('taskkill /f /im ame_webservice_console.exe', (error) => {
      if (error) {
        console.log('   No orphaned web service console found (or already killed)')
      } else {
        console.log('   ✅ Killed orphaned web service console')
      }
      resolve()
    })
  })
}

// Helper function to ensure AME Web Service is running
// Based on proven test script approach:
// 1. Always kill orphaned console processes to free port
// 2. Check if AME itself is running
// 3. Launch web service console with appropriate wait times
async function ensureAMEWebServiceRunning(ameIP = 'localhost', amePort = 8087) {
  try {
    console.log(`   Checking if AME Web Service is available on ${ameIP}:${amePort}...`)

    // Step 1: Kill orphaned console processes to ensure Port is free
    await killWebServiceConsole()

    // Step 2: Check if AME itself is running
    const ameRunning = await isAMERunning()
    console.log('   AME application is currently running:', ameRunning)

    // Step 3: Find and launch the web service console
    const serviceConsolePaths = [
      'C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\ame_webservice_console.exe',
      'C:\\Program Files\\Adobe\\Adobe Media Encoder 2024\\ame_webservice_console.exe',
      'C:\\Program Files\\Adobe\\Adobe Media Encoder 2023\\ame_webservice_console.exe',
      'C:\\Program Files (x86)\\Adobe\\Adobe Media Encoder 2025\\ame_webservice_console.exe',
      'C:\\Program Files (x86)\\Adobe\\Adobe Media Encoder 2024\\ame_webservice_console.exe',
    ]

    let serviceConsolePath = null
    for (const p of serviceConsolePaths) {
      if (fs.existsSync(p)) {
        serviceConsolePath = p
        break
      }
    }

    if (!serviceConsolePath) {
      console.error('   ❌ AME Web Service console not found in any expected location')
      return false
    }

    console.log('   Found service console at:', serviceConsolePath)

    // Launch the web service console using exec with "start" command
    // This is more reliable when running from Electron
    console.log('   🚀 Launching AME Web Service console...')
    try {
      // Use "start" command to launch in a new process, similar to double-clicking
      const command = `start "" "${serviceConsolePath}"`
      console.log('   Executing:', command)

      exec(command, { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error('   ⚠️ exec error (may still work):', error.message)
        }
        if (stderr) {
          console.error('   ⚠️ stderr:', stderr)
        }
        if (stdout) {
          console.log('   stdout:', stdout)
        }
      })

      console.log('   ✅ AME Web Service console launch command executed')
    } catch (spawnError) {
      console.error('   ❌ Failed to launch AME Web Service console:', spawnError.message)
      return false
    }

    // Wait for service to initialize (longer wait if AME wasn't running)
    if (!ameRunning) {
      console.log('   ⏳ AME is not running. Waiting 15 seconds for AME and Web Service to handshake...')
      await new Promise(resolve => setTimeout(resolve, 15000))
    } else {
      console.log('   ⏳ AME is open but console was reset. Waiting 5 seconds for Web Service to re-bind...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    console.log('   ✅ AME Web Service should now be ready')
    return true
  } catch (error) {
    console.error('   Error ensuring AME Web Service:', error.message)
    return false
  }
}

// Helper function to add jobs via AME Web Service (when AME is already open)
async function addJobsViaWebService(jobs, settings) {
  try {
    // Get network settings from settings object
    const networkSettings = settings?.networkSettings || {}
    const amePort = networkSettings.amePort || 8087
    // Use the ameIP from settings - AME binds to the IP specified in its config (or auto-detects)
    const ameIP = networkSettings.ameIP || 'localhost'

    console.log(`   Using AME Web Service at ${ameIP}:${amePort}`)

    // Ensure the web service is running
    const serviceRunning = await ensureAMEWebServiceRunning(ameIP, amePort)
    if (!serviceRunning) {
      console.error('   ❌ AME Web Service is not available')
      return { success: false, error: 'AME Web Service is not available', method: 'webservice' }
    }

    console.log('   ✅ AME Web Service is available')
    console.log('   Submitting ' + jobs.length + ' job(s) to AME Web Service...')

    // Submit each job individually
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const jobXML = generateAMEWebServiceXML(job)

      console.log(`   Job ${i + 1} XML:`)
      console.log(jobXML)

      // Retry logic for when AME is busy
      const maxRetries = 30 // Max 30 retries (30 seconds total with 1s delay)
      let retryCount = 0
      let jobSubmitted = false

      while (!jobSubmitted && retryCount < maxRetries) {
        try {
          const result = await new Promise((resolve, reject) => {
            const options = {
              hostname: ameIP,
              port: amePort,
              path: '/job',
              method: 'POST',
              headers: {
                'Content-Type': 'application/xml',
                'Content-Length': Buffer.byteLength(jobXML)
              },
              timeout: 5000
            }

            if (retryCount === 0) {
              console.log(`   Connecting to ${options.hostname}:${options.port}${options.path}`)
            }

            const req = http.request(options, (res) => {
              let data = ''
              res.on('data', (chunk) => {
                data += chunk
              })
              res.on('end', () => {
                if (retryCount === 0) {
                  console.log(`   Job ${i + 1} response (status: ${res.statusCode}):`, data.substring(0, 200))
                }

                // Check if server is offline
                if (data.includes('Server offline') || data.includes('ServerStatus>Offline')) {
                  console.warn(`   ⚠️ Job ${i + 1}: AME Web Service server is offline`)
                  reject(new Error('AME Web Service server is offline - AME may not be launched with --webservice flag'))
                } else if (data.includes('<SubmitResult>Busy</SubmitResult>')) {
                  // AME is busy encoding - need to retry
                  resolve({ busy: true })
                } else if (data.includes('<SubmitResult>Accepted</SubmitResult>') ||
                           res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 202) {
                  console.log(`   ✅ Job ${i + 1} submitted successfully`)
                  resolve({ success: true })
                } else {
                  console.warn(`   ⚠️ Job ${i + 1} returned status ${res.statusCode}`)
                  console.warn(`   Response body: ${data}`)
                  reject(new Error(`Web service returned status ${res.statusCode}: ${data}`))
                }
              })
            })

            req.on('error', (error) => {
              // Handle the common "Connection Reset" quirk of the AME Web Service
              if (error.code === 'ECONNRESET') {
                console.log(`   ⚠️ Job ${i + 1}: Socket reset (AME quirk - likely success)`)
                resolve({ success: true })
              } else {
                console.error(`   ❌ Job ${i + 1} error:`, error.message || error.toString())
                console.error(`   Error code: ${error.code}`)
                reject(error)
              }
            })

            req.on('timeout', () => {
              console.error(`   ❌ Job ${i + 1} timeout after 5 seconds`)
              req.destroy()
              reject(new Error('Request timeout'))
            })

            try {
              req.write(jobXML)
              req.end()
            } catch (writeError) {
              console.error(`   ❌ Job ${i + 1} write error:`, writeError.message)
              reject(writeError)
            }
          })

          if (result.busy) {
            retryCount++
            if (retryCount === 1) {
              console.log(`   ⏳ Job ${i + 1}: AME is busy encoding, waiting for it to be ready...`)
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
          } else if (result.success) {
            jobSubmitted = true
          }
        } catch (jobError) {
          console.error(`   ❌ Job ${i + 1} failed:`, jobError.message || jobError.toString())
          console.error(`   Job error details:`, jobError)
          throw jobError
        }
      }

      if (!jobSubmitted) {
        console.error(`   ❌ Job ${i + 1} failed after ${maxRetries} retries - AME remained busy`)
        throw new Error(`Job ${i + 1} failed: AME remained busy after ${maxRetries} seconds`)
      }
    }

    console.log('   ✅ All jobs submitted successfully to AME Web Service')
    return { success: true, jobCount: jobs.length, method: 'webservice' }
  } catch (error) {
    console.error('   ❌ Error submitting jobs to AME Web Service:', error.message)
    return { success: false, error: error.message, method: 'webservice' }
  }
}

// Helper function to generate XML for a single AME Web Service job
function generateAMEWebServiceXML(job) {
  // ✅ IMPORTANT: DestinationPath must be the FULL OUTPUT FILE PATH, not just the directory
  // AME needs to know the exact output filename

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<manifest version="1.0">\n'
  xml += `  <SourceFilePath>${escapeXML(job.inputPath)}</SourceFilePath>\n`
  xml += `  <DestinationPath>${escapeXML(job.outputPath)}</DestinationPath>\n`
  xml += `  <SourcePresetPath>${escapeXML(job.presetPath)}</SourcePresetPath>\n`
  xml += '</manifest>\n'

  return xml
}

// Helper function to escape XML special characters
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Helper function to generate ExtendScript for watch folder jobs
function generateWatchFolderScript(jobs) {
  let jsx = '// Adobe Media Encoder ExtendScript - Add encoding jobs\n'
  jsx += '// Wait for AME to fully initialize\n'
  jsx += 'function waitForFrontend(maxAttempts) {\n'
  jsx += '  var attempts = 0;\n'
  jsx += '  var frontend = null;\n'
  jsx += '  while (attempts < maxAttempts) {\n'
  jsx += '    try {\n'
  jsx += '      frontend = app.getFrontend();\n'
  jsx += '      if (frontend) return frontend;\n'
  jsx += '    } catch (e) {}\n'
  jsx += '    $.sleep(500);\n'
  jsx += '    attempts++;\n'
  jsx += '  }\n'
  jsx += '  return null;\n'
  jsx += '}\n\n'
  jsx += 'try {\n'
  jsx += '  // Wait up to 10 seconds for frontend to be ready\n'
  jsx += '  var frontend = waitForFrontend(20);\n'
  jsx += '  if (!frontend) {\n'
  jsx += '    alert("Error: Could not get AME frontend after waiting");\n'
  jsx += '    throw new Error("Frontend not available");\n'
  jsx += '  }\n'
  jsx += '\n'
  jsx += '  var successCount = 0;\n'
  jsx += '  var failCount = 0;\n'
  jsx += '\n'

  jobs.forEach((job, index) => {
    // Escape backslashes properly for ExtendScript
    const escapePath = (p) => p.replace(/\\/g, '\\\\')

    // Extract directory from output path (destination must be folder, not file)
    const outputDir = job.outputPath.substring(0, job.outputPath.lastIndexOf('\\'))

    jsx += `  // Job ${index + 1}: ${job.presetName}\n`
    jsx += `  var source${index} = "${escapePath(job.inputPath)}";\n`
    jsx += `  var destination${index} = "${escapePath(outputDir)}";\n`
    jsx += `  var preset${index} = "${escapePath(job.presetPath)}";\n`
    jsx += `  \n`
    jsx += `  // Create destination folder if it doesn't exist\n`
    jsx += `  var destFolder${index} = new Folder(destination${index});\n`
    jsx += `  if (!destFolder${index}.exists) {\n`
    jsx += `    destFolder${index}.create();\n`
    jsx += `  }\n`
    jsx += `  \n`
    jsx += `  var result${index} = frontend.addFileToBatch(source${index}, "", preset${index}, destination${index});\n`
    jsx += `  if (result${index}) {\n`
    jsx += `    successCount++;\n`
    jsx += `  } else {\n`
    jsx += `    failCount++;\n`
    jsx += `  }\n`
    jsx += '\n'
  })

  jsx += '  if (failCount > 0) {\n'
  jsx += '    alert("Added " + successCount + " job(s), " + failCount + " failed");\n'
  jsx += '  }\n'
  jsx += '} catch (error) {\n'
  jsx += '  alert("Error adding jobs to AME: " + error.message);\n'
  jsx += '}\n'

  return jsx
}

// IPC handler for adding jobs to AME
// Uses JSX Script method - only works when AME is closed
ipcMain.handle('ame:addJobsViaWatchFolder', async (event, jobs, settings) => {
  try {
    console.log('🟣 ame:addJobsViaWatchFolder handler called with', jobs.length, 'jobs')

    // Check if AME is already running
    const ameRunning = await isAMERunning()

    if (ameRunning) {
      console.log('   ❌ AME is already running - cannot use JSX method')
      return {
        success: false,
        error: 'AME_ALREADY_OPEN',
        message: 'Adobe Media Encoder is already open. Please close AME first, then try again.'
      }
    }

    // Check if destination folders exist
    const missingFolders = []
    for (const job of jobs) {
      const outputDir = job.outputPath.substring(0, job.outputPath.lastIndexOf('\\'))
      if (!fs.existsSync(outputDir)) {
        // Check if this folder is already in the list
        if (!missingFolders.includes(outputDir)) {
          missingFolders.push(outputDir)
        }
      }
    }

    if (missingFolders.length > 0) {
      console.log('   ❌ Missing destination folders:', missingFolders)
      return {
        success: false,
        error: 'FOLDERS_NOT_FOUND',
        missingFolders: missingFolders,
        message: `Destination folder structure does not exist. Please create the folder structure before sending proxies.`
      }
    }

    // Use JSX Script method to launch AME with jobs
    console.log('   Using JSX Script method (AME is closed)...')
    const result = await addJobsViaJSXScript(jobs)
    return result
  } catch (error) {
    console.error('   Error in ame:addJobsViaWatchFolder:', error.message)
    return { error: error.message }
  }
})

// Helper function to add jobs via JSX script (when AME is closed)
// Launches AME with --console es.processFile to execute the JSX script
async function addJobsViaJSXScript(jobs) {
  const userName = process.env.USERNAME
  const watchFolderPath = `C:\\Users\\${userName}\\Documents\\AME_Watch_Folder`

  // Create watch folder if it doesn't exist
  if (!fs.existsSync(watchFolderPath)) {
    fs.mkdirSync(watchFolderPath, { recursive: true })
    console.log('   Created watch folder:', watchFolderPath)
  }

  // Create a JSX script that will add jobs to AME
  const jsxContent = generateWatchFolderScript(jobs)
  const jsxPath = path.join(watchFolderPath, `process_jobs_${Date.now()}.jsx`)
  fs.writeFileSync(jsxPath, jsxContent, 'utf-8')
  console.log('   Created JSX script:', jsxPath)

  // Find AME executable
  const amePaths = [
    'C:\\Program Files\\Adobe\\Adobe Media Encoder 2025\\Adobe Media Encoder.exe',
    'C:\\Program Files\\Adobe\\Adobe Media Encoder 2024\\Adobe Media Encoder.exe',
    'C:\\Program Files\\Adobe\\Adobe Media Encoder 2023\\Adobe Media Encoder.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Media Encoder 2025\\Adobe Media Encoder.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Media Encoder 2024\\Adobe Media Encoder.exe',
  ]

  let amePath = null
  for (const p of amePaths) {
    if (fs.existsSync(p)) {
      amePath = p
      break
    }
  }

  if (!amePath) {
    throw new Error('Adobe Media Encoder not found in common installation paths')
  }

  console.log('   Found AME at:', amePath)
  console.log('   Launching AME with JSX script...')

  // Build the full command with proper quoting for Windows
  const fullCommand = `"${amePath}" --console es.processFile "${jsxPath}"`
  console.log(`   Command: ${fullCommand}`)

  // Launch AME with the JSX script using shell: true for proper argument parsing
  const child = spawn(fullCommand, [], {
    shell: true,
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  })
  child.unref()

  console.log('   AME launch command sent successfully')
  return { success: true, jsxPath, watchFolderPath, jobCount: jobs.length, method: 'jsx' }
}

// IPC handler for executing batch file (kept for backward compatibility)
ipcMain.handle('ame:executeBatch', async (event, batchContent) => {
  try {
    console.log('🟣 ame:executeBatch handler called')
    console.log('   batchContent length:', batchContent.length)

    const tempDir = os.tmpdir()
    const batchPath = path.join(tempDir, `ame_batch_${Date.now()}.bat`)

    console.log('   Writing batch file to:', batchPath)
    fs.writeFileSync(batchPath, batchContent, 'utf-8')

    console.log('   Executing batch file...')
    execSync(`start "" "${batchPath}"`)

    console.log('   Batch file executed successfully')
    return { success: true, batchPath }
  } catch (error) {
    console.error('   Error executing batch:', error.message)
    return { error: error.message }
  }
})

// IPC handler for getting system username
ipcMain.handle('system:getUsername', async () => {
  return process.env.USERNAME || 'user'
})

// IPC handler for opening file in explorer
ipcMain.handle('shell:showItemInFolder', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath)
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
})

// IPC handler for creating folder structure using xcopy
ipcMain.handle('file:createFolderStructure', async (event, originalPath, proxyPath) => {
  try {
    if (!originalPath || !proxyPath) {
      return { error: 'Both original and proxy paths are required' }
    }

    // Use xcopy to copy folder structure only (/T = tree only, /E = empty directories)
    const command = `xcopy "${originalPath}" "${proxyPath}" /T /E /Y`
    execSync(command, { stdio: 'pipe' })

    return { success: true, message: `Folder structure created successfully` }
  } catch (error) {
    return { error: error.message }
  }
})

// IPC handler for writing files
ipcMain.handle('file:writeFile', async (event, filePath, content) => {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, path: filePath }
  } catch (error) {
    return { error: error.message }
  }
})

// IPC handler for reading files
ipcMain.handle('file:readFile', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { error: error.message }
  }
})

// IPC handler for deleting files
ipcMain.handle('file:deleteFile', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
})

// IPC handler for getting available network adapters
ipcMain.handle('network:getAdapters', async (event) => {
  try {
    const interfaces = os.networkInterfaces()
    const adapters = []

    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          adapters.push({
            name: name,
            address: addr.address,
            label: `${name} (${addr.address})`
          })
        }
      }
    }

    // Add localhost as an option
    adapters.unshift({
      name: 'localhost',
      address: 'localhost',
      label: 'localhost'
    })

    return { success: true, adapters }
  } catch (error) {
    console.error('Error getting network adapters:', error)
    return { success: false, error: error.message, adapters: [] }
  }
})

// IPC handler for setting ProxYoda IP in vite.config.js
ipcMain.handle('network:setProxYodaIP', async (event, ipAddress) => {
  try {
    console.log(`Setting ProxYoda IP to ${ipAddress}...`)

    const viteConfigPath = path.join(__dirname, '..', 'vite.config.js')

    // Check if file exists
    if (!fs.existsSync(viteConfigPath)) {
      return { success: false, error: `Vite config not found at ${viteConfigPath}` }
    }

    // Always use '0.0.0.0' to bind to all interfaces
    // This allows both Electron app (localhost) and web UI (network IP) to work
    const newConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Use '0.0.0.0' to bind to all interfaces (localhost + network IP)
    // This allows both Electron app (localhost) and web UI (network IP) to work
    host: '0.0.0.0',
    port: 5173,
  },
})
`

    // Write the updated config
    fs.writeFileSync(viteConfigPath, newConfig, 'utf-8')

    console.log(`Successfully set ProxYoda IP. Web UI accessible at http://${ipAddress}:5173/`)
    return { success: true, message: `ProxYoda web UI will be accessible at http://${ipAddress}:5173/\nRestart the dev server to apply changes.` }
  } catch (error) {
    console.error('Error setting ProxYoda IP:', error)
    return { success: false, error: error.message }
  }
})

// IPC handler for setting AME Web Service port in config file
ipcMain.handle('ame:setWebServicePort', async (event, ameVersion, port) => {
  try {
    console.log(`Setting AME ${ameVersion} Web Service port to ${port}...`)

    // Construct the path to the config file
    const configPath = `C:\\Program Files\\Adobe\\Adobe Media Encoder ${ameVersion}\\ame_webservice_config.ini`

    // Check if file exists
    if (!fs.existsSync(configPath)) {
      return { success: false, error: `Config file not found at ${configPath}` }
    }

    // Read the current config
    let configContent = fs.readFileSync(configPath, 'utf-8')

    // Update or add the port setting
    // Look for existing port setting
    const portRegex = /^port\s*=\s*\d+/im
    if (portRegex.test(configContent)) {
      // Replace existing port
      configContent = configContent.replace(portRegex, `port=${port}`)
    } else {
      // Add new port setting at the end
      if (!configContent.endsWith('\n')) {
        configContent += '\n'
      }
      configContent += `port=${port}\n`
    }

    // Write the updated config
    fs.writeFileSync(configPath, configContent, 'utf-8')

    console.log(`Successfully set AME ${ameVersion} Web Service port to ${port}`)
    return { success: true, message: `Port set to ${port} in ${configPath}` }
  } catch (error) {
    console.error('Error setting AME Web Service port:', error)
    return { success: false, error: error.message }
  }
})
