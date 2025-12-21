# TEST_AME_Jobs - Complete Testing Suite

## 📋 What's Here

A complete testing environment for experimenting with AME web service job submission.

## 🚀 Quick Start

1. **First time?** Read: `QUICK_START.md`
2. **Want detailed workflow?** Read: `TESTING_WORKFLOW.md`
3. **Need setup help?** Read: `INSTRUCTIONS.md`

## 📁 Files

### Documentation
- **INDEX.md** (this file) - Overview
- **QUICK_START.md** - Fast reference guide
- **INSTRUCTIONS.md** - Detailed setup instructions
- **TESTING_WORKFLOW.md** - Complete testing workflow
- **README.md** - Original documentation

### Test Scripts
- **diagnose-ame-service.js** - Check service status
- **monitor-service.js** - Real-time monitoring
- **test-ame-webservice-jobs.js** - Send test jobs
- **test-variations.js** - Test XML formats

## 🎯 Current Status

```
✅ Web Service Console: RUNNING
✅ AME Instance: RUNNING
❌ Server Status: OFFLINE (not connected)
```

**Issue:** AME is running but not connected to the web service console.

**Solution:** Launch AME with `--webservice` flag

## 🔧 Common Commands

### Check Status
```bash
node diagnose-ame-service.js
```

### Monitor in Real-time
```bash
node monitor-service.js
```

### Send Test Job
```bash
node test-ame-webservice-jobs.js
```

### Test XML Formats
```bash
node test-variations.js
```

### Fix Connection
```bash
# Close current AME
taskkill /IM "Adobe Media Encoder.exe" /F

# Launch with --webservice flag
"C:\Program Files\Adobe\Adobe Media Encoder 2025\Adobe Media Encoder.exe" --webservice
```

## 📊 Test Files Used

- **Source:** `D:\- CACHE\AME\Test.mov`
- **Output:** `D:\- CACHE\AME\Proxies\Test_Proxy.mov`
- **Preset:** `C:\Users\aquez\Documents\Adobe\Adobe Media Encoder\25.0\Presets\proxy1.epr`

## 🎓 Learning Path

1. Run `diagnose-ame-service.js` to understand current state
2. Read `INSTRUCTIONS.md` to understand the problem
3. Follow `TESTING_WORKFLOW.md` to fix it
4. Use `test-ame-webservice-jobs.js` to verify it works
5. Update `electron/main.js` with findings

## 💡 Key Insights

- **XML Format:** All 4 variations tested return same response
- **Real Issue:** AME not connected to web service console
- **Current Fallback:** JSX method works perfectly
- **Web Service:** Would be faster but requires proper setup

## 🔗 Related Files

- `electron/main.js` - Main app implementation
- `src/utils/ameIntegration.js` - Frontend integration
- `electron/preload.js` - IPC bridge

## 📝 Notes

- All scripts have detailed logging
- Modify scripts to test different scenarios
- Keep web service console running during tests
- Monitor script updates every 2 seconds

