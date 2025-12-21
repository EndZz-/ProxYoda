# AME Web Service Testing

This folder contains test scripts for experimenting with sending jobs to the Adobe Media Encoder (AME) web service.

## Files

- **test-ame-webservice-jobs.js** - Main test script for sending jobs to AME web service

## Setup

### 1. Ensure Test Files Exist
- Source file: `D:\- CACHE\AME\Test.mov`
- Output directory: `D:\- CACHE\AME\Proxies`

### 2. Start AME Web Service Console
Open the AME web service console:
```
C:\Program Files\Adobe\Adobe Media Encoder 2025\ame_webservice_console.exe
```

Wait for it to show "Creating AMEServer - Succeeded"

## Running Tests

### Basic Test
```bash
node test-ame-webservice-jobs.js
```

This will:
1. Display the test configuration
2. Show your local IP address
3. Generate the XML manifest
4. Send the job to the AME web service
5. Display the response

## What to Look For

### Success Response
- Status code: 200, 201, or 202
- Response should NOT contain "ServerStatus>Offline"
- Job should appear in AME queue

### Failure Response
- Status code: 500 or other error
- Response contains "ServerStatus>Offline"
- Connection refused error

## Modifying the Test

Edit the configuration at the top of the script:
```javascript
const TEST_FILE = 'D:\\- CACHE\\AME\\Test.mov'
const PROXY_PATH = 'D:\\- CACHE\\AME\\Proxies'
const PRESET_PATH = 'C:\\Users\\aquez\\Documents\\Adobe\\Adobe Media Encoder\\25.0\\Presets\\proxy1.epr'
```

## Debugging

The script outputs:
- Local IP being used
- Full XML manifest being sent
- Complete response from server
- Any errors encountered

Use this information to debug what's being sent and what the server is responding with.

## Next Steps

Once you find the correct XML format and sequence that works:
1. Update the `generateAMEWebServiceXML()` function in `electron/main.js`
2. Test with the ProxyThis app
3. Verify jobs are added to AME queue

