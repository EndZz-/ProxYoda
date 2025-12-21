# Quick Start Guide

## What You Have

Three test scripts to experiment with AME web service:

### 1. **test-ame-webservice-jobs.js** - Main Test
```bash
node test-ame-webservice-jobs.js
```
- Sends a real job to AME web service
- Uses your test file: `D:\- CACHE\AME\Test.mov`
- Shows the exact XML being sent
- Displays the server response

### 2. **test-variations.js** - XML Format Testing
```bash
node test-variations.js
```
- Tests 4 different XML formats
- Helps find the correct format if needed
- Quick comparison of responses

### 3. **diagnose-ame-service.js** - Service Status
```bash
node diagnose-ame-service.js
```
- Checks if AME and console are running
- Shows server status
- Provides analysis and recommendations

## ✅ SOLUTION FOUND!

**Key Discoveries:**
1. ✅ Use **port 8087** (not 8080!)
2. ✅ DestinationPath must be **full file path** (not just directory)
3. ✅ Jobs are now being accepted and queued!

## How to Use

### Step 1: Close Current AME
```bash
taskkill /IM "Adobe Media Encoder.exe" /F
```

### Step 2: Keep Console Running
Leave `ame_webservice_console.exe` open

### Step 3: Launch AME with --webservice
```bash
"C:\Program Files\Adobe\Adobe Media Encoder 2025\Adobe Media Encoder.exe" --webservice
```

### Step 4: Test
```bash
node test-ame-webservice-jobs.js
```

## Expected Results

### Before Fix
```
ServerStatus>Offline
SubmitResult>NoServer
```

### After Fix
```
ServerStatus>Online
SubmitResult>Success (or similar)
```

## Files Being Used

- **Source:** `D:\- CACHE\AME\Test.mov`
- **Output:** `D:\- CACHE\AME\Proxies\Test_Proxy.mov`
- **Preset:** `C:\Users\aquez\Documents\Adobe\Adobe Media Encoder\25.0\Presets\proxy1.epr`

Edit these in the test scripts if you want to use different files.

## When It Works

Once you get a successful response:
1. Check the exact response format
2. Update `electron/main.js` if needed
3. Test with ProxyThis app
4. Verify jobs appear in AME queue

## Notes

- The JSX method (current fallback) works perfectly
- Web service would be faster but requires proper setup
- All test scripts output detailed information for debugging

