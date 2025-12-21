# Send to AME - Working Implementation

## Status
✅ **WORKING**: Sending jobs to AME when AME is **CLOSED** (JSX Script Method)
🟡 **IN PROGRESS**: Sending jobs to AME when AME is **ALREADY OPEN** (Web Service Method)

## Architecture Overview

The implementation uses the **Watch Folder Method** which is the recommended approach for Adobe Media Encoder 2025.

### How It Works:
1. User selects files and clicks "Send to AME"
2. Jobs are created with source file, output path, and preset path
3. A JSX ExtendScript file is generated with the job details
4. The JSX file is executed via: `"AME.exe" --console es.processFile "path/to/script.jsx"`
5. The ExtendScript uses `app.getFrontend().addFileToBatch()` to add jobs to the queue

## Key Files & Implementation Details

### 1. src/utils/ameIntegration.js
```javascript
export async function launchAMEWithJobs(jobs) {
  // Calls window.electronAPI.addJobsViaWatchFolder(jobs)
  // This is the main entry point from the UI
}
```

### 2. electron/main.js - IPC Handler
```javascript
ipcMain.handle('ame:addJobsViaWatchFolder', async (event, jobs) => {
  // Creates watch folder at: C:\Users\{username}\Documents\AME_Watch_Folder
  // Generates JSX script with job details
  // Launches AME with: spawn(amePath, ['--console', 'es.processFile', jsxPath])
  // Uses detached: true and child.unref() for non-blocking execution
}
```

### 3. electron/preload.js
```javascript
addJobsViaWatchFolder: (jobs) => ipcRenderer.invoke('ame:addJobsViaWatchFolder', jobs)
```

## Critical Implementation Details

### ExtendScript Generation (generateWatchFolderScript)
- **Destination path**: Must be FOLDER ONLY, not full file path
  - Extract with: `job.outputPath.substring(0, job.outputPath.lastIndexOf('\\'))`
- **Path escaping**: All backslashes must be doubled for ExtendScript
  - `const escapePath = (p) => p.replace(/\\/g, '\\\\')`
- **API call**: `frontend.addFileToBatch(source, "", preset, destination)`
  - source: full file path
  - format: empty string
  - preset: full path to .epr file
  - destination: folder path only

### Process Spawning
```javascript
const child = spawn(amePath, ['--console', 'es.processFile', jsxPath], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true
})
child.unref()
```
- **detached: true** - Process runs independently
- **child.unref()** - Allows parent process to exit without waiting
- **stdio: 'ignore'** - Prevents blocking on I/O

## Implementation for Running AME Instance

### New Approach: Dual Method
The handler now checks if AME is running and uses the appropriate method:

1. **AME Closed**: Uses JSX Script Method (existing)
2. **AME Open**: Uses Web Service Method (new)

### Web Service Method Details
- **Port**: 8080 (default AME web service port)
- **Endpoint**: `/job` (for submitting jobs)
- **Health Check**: `/server` (to verify service is running)
- **Method**: HTTP POST
- **Content-Type**: application/xml
- **Payload**: XML manifest with job details

### Key Functions Added
- `isAMERunning()` - Checks tasklist for "adobe media encoder"
- `ensureAMEWebServiceRunning()` - Checks if service is running, starts it if needed
- `addJobsViaWebService(jobs)` - Sends HTTP POST to AME web service for each job
- `generateAMEWebServiceXML(job)` - Generates XML manifest for single job
- `escapeXML(str)` - Escapes XML special characters

### XML Manifest Format (Per Job)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest version="1.0">
  <SourceFilePath>C:\path\to\video.mov</SourceFilePath>
  <DestinationPath>C:\output\folder</DestinationPath>
  <SourcePresetPath>C:\path\to\preset.epr</SourcePresetPath>
</manifest>
```

### Service Startup
- Automatically checks if service is running via `/server` endpoint
- If not running, attempts to start `ame_webservice_console.exe`
- Waits 3 seconds for service to initialize
- Submits jobs one at a time to ensure proper queuing

## Testing Checklist
- [x] AME closed: Send jobs → Jobs appear in queue ✅
- [ ] AME open: Send jobs → Jobs appear in queue 🟡 (Testing needed)
- [x] Multiple jobs: All jobs added correctly ✅
- [x] ProxyThis doesn't hang: Returns immediately ✅
- [x] File paths with spaces: Handled correctly ✅

## One-Time Setup Required for Web Service

Before using the "Send to AME" feature with AME already open, run these commands as Administrator:

### 1. Install the Service (One-Time)
```cmd
"C:\Program Files\Adobe\Adobe Media Encoder 2025\AMEWinService.exe" -install
```

### 2. Verify Service is Working
Navigate to `http://localhost:8080/server` in a browser. Should return XML status showing "Online."

### 3. How It Works
- When you click "Send to AME" with AME open, the app automatically:
  1. Checks if web service is running
  2. Starts `ame_webservice_console.exe` if needed
  3. Submits jobs via HTTP POST to `/job` endpoint
  4. Jobs appear in AME queue immediately

## Testing Checklist
- [ ] Run AMEWinService.exe -install as Administrator
- [ ] Verify http://localhost:8080/server returns "Online"
- [ ] Test with AME closed (JSX method) ✅
- [ ] Test with AME open (Web Service method) 🟡
- [ ] Test multiple jobs are queued correctly
- [ ] Verify ProxyThis doesn't hang

