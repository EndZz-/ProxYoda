# AME Web Service Testing Workflow

## Overview

You now have a complete testing environment to experiment with sending jobs to the AME web service. This allows you to find the correct format and sequence before implementing it in the main app.

## Available Scripts

### 1. **diagnose-ame-service.js** - Start Here
```bash
node diagnose-ame-service.js
```
**Purpose:** Check current status of AME and web service
**Output:** 
- Process status (running/stopped)
- Network connectivity
- Server status
- Analysis and recommendations

### 2. **monitor-service.js** - Real-time Monitoring
```bash
node monitor-service.js
```
**Purpose:** Watch service status while making changes
**Output:** Updates every 2 seconds
**Use Case:** Keep running while you launch/close AME

### 3. **test-ame-webservice-jobs.js** - Main Test
```bash
node test-ame-webservice-jobs.js
```
**Purpose:** Send a real job to the web service
**Output:** 
- Generated XML manifest
- Server response
- Status analysis

### 4. **test-variations.js** - Format Testing
```bash
node test-variations.js
```
**Purpose:** Test different XML formats
**Output:** Comparison of 4 different XML variations
**Use Case:** If you need to find the correct format

## Recommended Workflow

### Phase 1: Diagnose Current State
```bash
node diagnose-ame-service.js
```
This shows you what's currently running and what's not.

### Phase 2: Fix the Connection
If server is offline:
1. Close AME: `taskkill /IM "Adobe Media Encoder.exe" /F`
2. Keep console running
3. Launch AME with: `"C:\Program Files\Adobe\Adobe Media Encoder 2025\Adobe Media Encoder.exe" --webservice`

### Phase 3: Monitor Changes
```bash
node monitor-service.js
```
Keep this running while you make changes. Watch for status changes.

### Phase 4: Test Job Submission
```bash
node test-ame-webservice-jobs.js
```
Send a test job and check the response.

### Phase 5: Analyze Results
- If successful: Note the response format
- If failed: Check the error message
- Try variations if needed: `node test-variations.js`

## Test Files

All scripts use:
- **Source:** `D:\- CACHE\AME\Test.mov`
- **Output:** `D:\- CACHE\AME\Proxies\Test_Proxy.mov`
- **Preset:** `C:\Users\aquez\Documents\Adobe\Adobe Media Encoder\25.0\Presets\proxy1.epr`

Edit these paths in the scripts if you want to test with different files.

## Expected Responses

### Offline (Current)
```xml
<ServerStatus>Offline</ServerStatus>
<SubmitResult>NoServer</SubmitResult>
<Details>Server offline!</Details>
```

### Online (Goal)
```xml
<ServerStatus>Online</ServerStatus>
<SubmitResult>Success</SubmitResult>
```

## When You Find the Solution

1. **Document the response** - Copy the exact XML response
2. **Note the setup** - What was running, how was AME launched
3. **Update electron/main.js** - If XML format needs changes
4. **Test with ProxyThis** - Verify it works in the app
5. **Verify in AME** - Check that jobs appear in the queue

## Troubleshooting

### "Server offline" response
- AME is not connected to the web service console
- Solution: Launch AME with `--webservice` flag

### Connection refused
- Web service console is not running
- Solution: Start `ame_webservice_console.exe`

### No response / timeout
- Network issue or wrong IP
- Solution: Check `getLocalIP()` output

## Notes

- The JSX method (current fallback) works perfectly
- Web service method would be faster but requires proper setup
- All test scripts have detailed logging for debugging
- You can modify scripts to test different scenarios

