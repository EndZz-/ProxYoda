# 🎬 ProxYoda v1.0.4

**The smart video proxy manager for Adobe Media Encoder**

ProxYoda streamlines your video proxy workflow by automatically scanning your media folders, detecting missing proxies, and sending batch encoding jobs directly to Adobe Media Encoder with a single click.

![ProxYoda](https://img.shields.io/badge/Version-1.0.4-brightgreen) ![ProxYoda](https://img.shields.io/badge/Platform-Windows-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![AME](https://img.shields.io/badge/Adobe%20Media%20Encoder-2024%2F2025-red)

---

## ✨ Features

### 🔍 **Smart Folder Scanning**
- Scan your original media folder and automatically detect video files
- Identify which files are missing proxy versions
- Support for multiple video formats (MOV, MP4, NotchLC, HAP, etc.)
- Automatic resolution detection using bundled MediaInfo CLI

### 📊 **Resolution-Based Proxy Management**
- Automatically detect video resolutions from your source files
- Configure custom proxy resolutions for each source resolution
- Support for aspect ratio-aware scaling

### 🎨 **Codec Support**
- **NotchLC** - High-quality, GPU-accelerated codec with alpha channel support
- **ProRes 422** - Industry-standard intermediate codec
- **HAP** - GPU-accelerated playback codec
- Configure audio inclusion per resolution

### 📁 **Automatic Folder Structure**
- Mirror your original folder hierarchy in the proxy folder
- One-click folder structure creation
- Preserve relative paths for easy file management

### 🚀 **Adobe Media Encoder Integration**
- Send selected files directly to AME's encoding queue
- Automatic preset generation based on your settings
- Pre-flight checks ensure destination folders exist before encoding
- Smart detection of AME running state

### ⚡ **Productivity Features**
- Auto-refresh at configurable intervals
- Quick refresh to check proxy status without full rescan
- Filter files by proxy status (All, Missing, Complete)
- Batch selection for encoding multiple files

---

## 📥 Installation

### Option 1: Download Installer (Recommended)
1. Go to the [Releases](https://github.com/EndZz-/ProxYoda/releases) page
2. Download `ProxYoda-x.x.x-Win-x64-Setup.exe` for the installer
   - Or `ProxYoda-x.x.x-Win-x64-Portable.exe` for the portable version
3. Run the installer and follow the prompts
4. The app installs to `C:\Program Files\ProxYoda` by default

> **Note:** MediaInfo CLI is bundled with the app - no additional installation required!

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/EndZz-/ProxYoda.git
cd ProxYoda

# Install dependencies
npm install

# Run in development mode
npm run dev:electron

# Build the installer
npm run build
npx electron-builder --win
```

---

## 🚀 Quick Start

1. **Launch ProxYoda**

2. **Set Folder Paths** (Dashboard)
   - Click **Browse** to set your **Original Files Folder** (where your source videos are)
   - Click **Browse** to set your **Proxy Files Folder** (where proxies will be saved)

3. **Scan Your Files**
   - Click **Refresh** to scan your media folder
   - ProxYoda will detect all video files and their resolutions

4. **Configure Proxy Settings** (Settings tab)
   - Detected resolutions appear in the Proxy Mappings table
   - Set the desired proxy scale (25%, 50%, etc.) for each resolution
   - Choose codec (NotchLC or ProRes 422) and audio settings
   - Click **Save Preset** to create AME presets

5. **Create Proxies**
   - Select files with missing proxies (shown in red)
   - Click **Create Folder Structure** to set up proxy directories
   - Click **Send to AME** to queue encoding jobs in Adobe Media Encoder

---

## 🎯 Workflow Example

```
Original Folder Structure:          Proxy Folder Structure:
├── Project_A/                      ├── Project_A/
│   ├── Scene_01.mov               │   ├── Scene_01_proxy.mov
│   └── Scene_02.mov               │   └── Scene_02_proxy.mov
└── Project_B/                      └── Project_B/
    └── Interview.mov                   └── Interview_proxy.mov
```

ProxYoda maintains the same folder hierarchy, making it easy to locate proxies alongside your original files.

---

## ⚙️ Requirements

- **Windows 10/11** (x64)
- **Adobe Media Encoder 2024 or 2025** (version 24.0+)
- **NotchLC Codec** (optional, for NotchLC encoding) - [Download](https://www.notch.one/products/notch-lc/)

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server with Electron
npm run dev:electron

# Or use the batch file
Run_ProxYoda-DT.bat

# Build for production
npm run build
npx electron-builder --win
```

---

## 📝 License

MIT License - feel free to use and modify for your projects.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 🐛 Known Issues

- AME must be closed before sending jobs via JSX method (ProxYoda will warn you if it's open)
- First scan may take longer on folders with many files

---

## 💡 Tips

- Use **Quick Refresh** (⚡) after encoding to quickly check which proxies completed
- Set up **Auto Refresh** to automatically monitor proxy completion
- Use the **Filter** dropdown to show only files missing proxies
- Assign presets to resolutions for one-click batch encoding

---

Made with ❤️ for video professionals
