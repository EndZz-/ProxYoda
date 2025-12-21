# AME Web Service Testing Instructions

## Current Status

The test scripts show that:
- ✅ Web service console is running on `192.168.10.57:8080`
- ✅ AME instance is running
- ❌ But AME is NOT connected to the web service console
- ❌ Server reports `ServerStatus>Offline`

## The Problem

The `ame_webservice_console.exe` is just the **server component**. It needs an actual AME instance to be **connected to it** to process jobs.

Currently:
1. Web service console is running (standalone)
2. AME is running (standalone)
3. They are NOT communicating with each other

## Solution

You need to launch AME in a way that connects it to the web service console.

### Option 1: Launch AME with --webservice flag (RECOMMENDED)

Close the current AME instance and launch it with:

```bash
"C:\Program Files\Adobe\Adobe Media Encoder 2025\Adobe Media Encoder.exe" --webservice
```

This will:
- Launch AME
- Connect it to the web service console
- Allow jobs to be submitted via the web service

### Option 2: Use the Web Service Console to Launch AME

The `ame_webservice_console.exe` might have a button or menu to launch AME. Check the console window.

## Testing Steps

1. **Close current AME instance**
   ```bash
   taskkill /IM "Adobe Media Encoder.exe" /F
   ```

2. **Keep web service console running**
   - Leave `ame_webservice_console.exe` open

3. **Launch AME with --webservice flag**
   ```bash
   "C:\Program Files\Adobe\Adobe Media Encoder 2025\Adobe Media Encoder.exe" --webservice
   ```

4. **Run the test script**
   ```bash
   node test-ame-webservice-jobs.js
   ```

5. **Check the response**
   - Should NOT contain `ServerStatus>Offline`
   - Should show `SubmitResult>Success` or similar

## Test Scripts

- **test-ame-webservice-jobs.js** - Main test with your files
- **test-variations.js** - Tests different XML formats
- **diagnose-ame-service.js** - Checks service status

## Next Steps

Once you get the web service working:
1. Note what response you get
2. Update `electron/main.js` if needed
3. Test with the ProxyThis app
4. Verify jobs appear in AME queue

## Notes

The current implementation in ProxyThis already has a fallback:
- Tries web service first
- Falls back to JSX method if web service fails
- This is why "Send to AME" works even though web service is offline

The JSX method is reliable and works great. The web service method would be faster, but requires proper AME setup.

