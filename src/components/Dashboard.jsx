import { useState, useEffect, useRef } from 'react'
import '../styles/Dashboard.css'
import FileList from './FileList'
import AutoRefreshControl from './AutoRefreshControl'
import { scanDirectory, findProxiesForFile } from '../utils/fileScanner'
import { launchAMEWithJobs, createPresetFile } from '../utils/ameIntegration'
import { scanAMEVersions, scanAMEPresets } from '../utils/amePresetBuilder'
import { useModal } from './Modal'

export default function Dashboard({
  settings,
  setSettings,
  dirHandles,
  setDirHandles,
  files,
  setFiles,
  selectedFiles,
  setSelectedFiles,
  filter,
  setFilter,
  lastRefresh,
  setLastRefresh,
  isScanning,
  setIsScanning,
  scanProgress,
  setScanProgress
}) {
  const { alert } = useModal()
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null)
  const [autoSubmitToAME, setAutoSubmitToAME] = useState(false)
  const [ameVersions, setAmeVersions] = useState([])
  const [amePresets, setAmePresets] = useState({})
  const [presetOverrides, setPresetOverrides] = useState({})

  // Get selectedAmeVersion from settings (shared with SettingsPanel)
  const selectedAmeVersion = settings.selectedAmeVersion || '25.0'

  // Load AME versions and presets on component mount or when selectedAmeVersion changes
  useEffect(() => {
    let isMounted = true

    const loadAmeData = async () => {
      try {
        // First, scan for available AME versions
        const versions = await scanAMEVersions()
        if (!isMounted) return

        setAmeVersions(versions)

        // If we have a saved version in settings, use it; otherwise find one with presets
        let versionToUse = settings.selectedAmeVersion
        let presets = {}

        if (versionToUse && versions.includes(versionToUse)) {
          // Use the saved version from settings
          presets = await scanAMEPresets(versionToUse)
        } else {
          // No saved version or saved version not found - find first version with presets
          for (const version of versions) {
            const versionPresets = await scanAMEPresets(version)
            if (Object.keys(versionPresets).length > 0) {
              versionToUse = version
              presets = versionPresets
              break
            }
          }

          // Save the auto-detected version to settings
          if (versionToUse && versionToUse !== settings.selectedAmeVersion) {
            setSettings(prev => ({ ...prev, selectedAmeVersion: versionToUse }))
          }
        }

        if (!isMounted) return

        setAmePresets(presets)
      } catch (error) {
        console.error('Error loading AME data:', error)
      }
    }

    loadAmeData()

    return () => {
      isMounted = false
    }
  }, [settings.selectedAmeVersion])

  const handleCreateFolderStructure = async () => {
    if (!settings.originalPath || !settings.proxyPath) {
      await alert('Please set both Original Files Folder and Proxy Files Folder')
      return
    }

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.createFolderStructure(
          settings.originalPath,
          settings.proxyPath
        )
        if (result.success) {
          await alert('✅ Folder structure created successfully!')
        } else {
          await alert('❌ Error: ' + result.error)
        }
      } else {
        await alert('This feature is only available in Electron mode')
      }
    } catch (error) {
      console.error('Error creating folder structure:', error)
      await alert('❌ Error creating folder structure: ' + error.message)
    }
  }

  const handleBrowseFolder = async (type) => {
    if (window.electronAPI) {
      // Electron mode
      const path = await window.electronAPI.openDirectory()
      console.log('Selected path:', path)
      if (path) {
        const newSettings = {
          ...settings,
          [type === 'original' ? 'originalPath' : 'proxyPath']: path,
        }
        console.log('New settings:', newSettings)
        setSettings(newSettings)
      }
    } else {
      // Web mode - use File System Access API (no upload, just local access)
      try {
        const dirHandle = await window.showDirectoryPicker()
        if (dirHandle) {
          // Store the directory handle in state (not in settings, since it can't be serialized)
          setDirHandles({
            ...dirHandles,
            [type]: dirHandle,
          })
          // Store the path name in settings for display and persistence
          setSettings({
            ...settings,
            [type === 'original' ? 'originalPath' : 'proxyPath']: dirHandle.name,
          })
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error selecting folder:', err)
          alert('Please use a modern browser (Chrome, Edge) that supports folder selection')
        }
      }
    }
  }

  const scanFiles = async () => {
    if (!settings.originalPath) {
      alert('Please set original files folder in Settings')
      return
    }

    try {
      setIsScanning(true)
      setScanProgress({ current: 0, total: 0 })
      const scannedFiles = await scanDirectory(settings.originalPath, dirHandles.original)

      // Detect unique resolutions and update settings if needed
      const uniqueResolutions = {}
      scannedFiles.forEach(file => {
        if (file.resolution && file.resolution !== 'Unknown') {
          uniqueResolutions[file.resolution] = settings.resolutionMappings?.[file.resolution] || 0.25
        }
      })

      // Update settings with detected resolutions (replace, don't merge)
      setSettings({
        ...settings,
        resolutionMappings: uniqueResolutions,
      })

      // Add proxy information to each file with progress tracking (sequential for better progress visibility)
      setScanProgress({ current: 0, total: scannedFiles.length })
      const filesWithProxies = []

      // Helper function to yield to browser for rendering
      const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0))

      for (let i = 0; i < scannedFiles.length; i++) {
        const file = scannedFiles[i]
        const result = {
          ...file,
          proxies: await findProxiesForFile(file, settings.proxyPath, uniqueResolutions, dirHandles.proxy),
        }
        filesWithProxies.push(result)
        setScanProgress({ current: i + 1, total: scannedFiles.length })

        // Yield to browser every 5 files to allow rendering
        if ((i + 1) % 5 === 0) {
          await yieldToBrowser()
        }
      }

      setFiles(filesWithProxies)
      setLastRefresh(new Date())
      setScanProgress({ current: 0, total: 0 })
    } catch (error) {
      console.error('Error scanning files:', error)
      await alert('❌ Error scanning files: ' + error.message)
    } finally {
      setIsScanning(false)
      setScanProgress({ current: 0, total: 0 })
    }
  }

  const handleRefresh = () => {
    scanFiles()
  }

  const handleQuickRefresh = async () => {
    if (!settings.proxyPath) {
      await alert('Please set proxy files folder in Settings')
      return
    }

    try {
      setIsScanning(true)
      setScanProgress({ current: 0, total: files.length })

      // Helper function to yield to browser for rendering
      const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0))

      // Only check if proxy files exist, don't re-scan resolutions
      const updatedFiles = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const updatedProxies = await findProxiesForFile(file, settings.proxyPath, settings.resolutionMappings || {}, dirHandles.proxy)
        updatedFiles.push({
          ...file,
          proxies: updatedProxies,
        })
        setScanProgress({ current: i + 1, total: files.length })

        // Yield to browser every 5 files to allow rendering
        if ((i + 1) % 5 === 0) {
          await yieldToBrowser()
        }
      }

      setFiles(updatedFiles)
      setLastRefresh(new Date())
      setScanProgress({ current: 0, total: 0 })
    } catch (error) {
      console.error('Error in quick refresh:', error)
      alert('Error in quick refresh: ' + error.message)
    } finally {
      setIsScanning(false)
      setScanProgress({ current: 0, total: 0 })
    }
  }

  const handleAutoRefresh = (interval, submitToAME = false) => {
    if (interval > 0) {
      setAutoSubmitToAME(submitToAME)
      const id = setInterval(() => {
        scanFiles().then(() => {
          if (submitToAME) {
            // Auto-submit missing proxies to AME
            handleAutoSubmitToAME()
          }
        })
      }, interval * 60 * 1000)
      setAutoRefreshInterval(id)
    } else if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
      setAutoRefreshInterval(null)
      setAutoSubmitToAME(false)
    }
  }

  const handleAutoSubmitToAME = async () => {
    if (!settings.presets || Object.keys(settings.presets).length === 0) {
      console.log('No presets configured for auto-submit')
      return
    }

    try {
      // Find all files with missing proxies
      const filesWithMissingProxies = files.filter(file =>
        file.proxies.some(proxy => !proxy.exists)
      )

      if (filesWithMissingProxies.length === 0) {
        console.log('No missing proxies to submit')
        return
      }

      // Get username for preset path
      const username = await window.electronAPI.getUsername()
      const ameVersion = settings.selectedAmeVersion || '25.0'

      // Create jobs for missing proxies
      const jobs = []
      for (const file of filesWithMissingProxies) {
        for (const proxy of file.proxies) {
          if (!proxy.exists) {
            // Construct output path using relative path to preserve folder structure
            const relativePath = file.relativePath || file.name
            const baseName = relativePath.replace(/\.[^/.]+$/, '')
            const outputPath = `${settings.proxyPath}\\${baseName}${proxy.name}.mov`
            // Use the preset that corresponds to this file's resolution
            const presetName = proxy.resolution
            const presetPath = `C:\\Users\\${username}\\Documents\\Adobe\\Adobe Media Encoder\\${ameVersion}\\Presets\\${presetName}.epr`

            jobs.push({
              inputPath: file.path,
              outputPath: outputPath,
              presetName: presetName,
              presetPath: presetPath,
            })
          }
        }
      }

      if (jobs.length > 0) {
        const firstPreset = Object.values(settings.presets)[0]
        await createPresetFile(firstPreset.presetName, firstPreset.xml)
        await launchAMEWithJobs(jobs)
        console.log(`Auto-submitted ${jobs.length} jobs to Adobe Media Encoder`)
      }
    } catch (error) {
      console.error('Error in auto-submit to AME:', error)
    }
  }

  const handleSelectFile = (fileId) => {
    console.log('🔵 Dashboard.handleSelectFile called with fileId:', fileId)
    console.log('   Current selectedFiles:', Array.from(selectedFiles))

    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      console.log('   File was selected, removing it')
      newSelected.delete(fileId)
    } else {
      console.log('   File was not selected, adding it')
      newSelected.add(fileId)
    }

    console.log('   New selectedFiles:', Array.from(newSelected))
    setSelectedFiles(newSelected)
  }

  const handleSelectMultipleFiles = (fileIds, shouldSelect) => {
    console.log('🟣 Dashboard.handleSelectMultipleFiles called')
    console.log('   fileIds.length:', fileIds.length)
    console.log('   shouldSelect:', shouldSelect)
    console.log('   Current selectedFiles.size:', selectedFiles.size)

    const newSelected = new Set(selectedFiles)

    if (shouldSelect) {
      // Add all files
      console.log('   Adding', fileIds.length, 'files to selection')
      fileIds.forEach(fileId => {
        newSelected.add(fileId)
      })
    } else {
      // Remove all files
      console.log('   Removing', fileIds.length, 'files from selection')
      fileIds.forEach(fileId => {
        newSelected.delete(fileId)
      })
    }

    console.log('   New selectedFiles.size:', newSelected.size)
    setSelectedFiles(newSelected)
  }

  const handlePresetOverride = (fileId, presetName) => {
    const newOverrides = { ...presetOverrides }
    if (presetName === null || presetName === '') {
      // Remove the override to unassign
      delete newOverrides[fileId]
    } else {
      newOverrides[fileId] = presetName
    }
    setPresetOverrides(newOverrides)
  }

  const getPresetAssignmentCounts = () => {
    const counts = {}
    const presetAssignments = settings.presetAssignments || {}
    let unassignedCount = 0

    files.forEach(file => {
      // Check for preset override first, then fall back to assignment
      let assignedPreset = presetOverrides[file.id]
      if (!assignedPreset) {
        assignedPreset = presetAssignments[file.resolution]
      }

      if (assignedPreset && assignedPreset !== 'unassigned') {
        counts[assignedPreset] = (counts[assignedPreset] || 0) + 1
      } else {
        unassignedCount++
      }
    })

    // Add unassigned count if there are any
    if (unassignedCount > 0) {
      counts['Unassigned'] = unassignedCount
    }

    return counts
  }

  const handleSendToAME = async () => {
    console.log('🟣 handleSendToAME called')
    console.log('   selectedFiles.size:', selectedFiles.size)
    console.log('   selectedFiles:', Array.from(selectedFiles))

    if (selectedFiles.size === 0) {
      await alert('Please select files to send to AME')
      return
    }

    try {
      // Get selected files
      const selectedFilesList = files.filter(f => selectedFiles.has(f.id))
      console.log('   selectedFilesList.length:', selectedFilesList.length)

      // Get username for preset path
      const username = await window.electronAPI.getUsername()
      const ameVersion = settings.selectedAmeVersion || '25.0'

      // Create jobs for each selected file and missing proxy
      const jobs = []
      for (const file of selectedFilesList) {
        console.log('   Processing file:', file.name)
        console.log('     file.proxies.length:', file.proxies.length)

        for (const proxy of file.proxies) {
          console.log('     Checking proxy:', proxy.name, 'exists:', proxy.exists)

          if (!proxy.exists) {
            // Get the preset for this file
            // First check if there's a preset override for this file
            let presetName = presetOverrides[file.id]

            // If no override, check if there's an assigned preset for this resolution
            if (!presetName) {
              const presetAssignments = settings.presetAssignments || {}
              presetName = presetAssignments[file.resolution]
            }

            console.log('     presetName for', file.name, ':', presetName)

            if (!presetName || presetName === 'unassigned') {
              console.log('     Skipping - no preset assigned')
              continue
            }

            // Construct output path using relative path to preserve folder structure
            const relativePath = file.relativePath || file.name
            const baseName = relativePath.replace(/\.[^/.]+$/, '')
            const outputPath = `${settings.proxyPath}\\${baseName}${proxy.name}.mov`
            const presetPath = `C:\\Users\\${username}\\Documents\\Adobe\\Adobe Media Encoder\\${ameVersion}\\Presets\\${presetName}.epr`

            jobs.push({
              inputPath: file.path,
              outputPath: outputPath,
              presetName: presetName,
              presetPath: presetPath,
            })
            console.log('     Added job:', { inputPath: file.path, outputPath: outputPath, presetName, presetPath })
          }
        }
      }

      console.log('   Total jobs created:', jobs.length)

      if (jobs.length === 0) {
        await alert('No jobs to send - either all files have proxies or no presets are assigned')
        return
      }

      console.log('   Sending jobs to AME...')
      // Launch AME with jobs - only works when AME is closed
      await launchAMEWithJobs(jobs, settings)

      await alert(`✅ Sent ${jobs.length} jobs to Adobe Media Encoder`)
      setSelectedFiles(new Set())
    } catch (error) {
      console.error('Error sending to AME:', error)

      // Special handling for AME already open
      if (error.code === 'AME_ALREADY_OPEN') {
        await alert('⚠️ Adobe Media Encoder is already open.\n\nPlease close AME completely, then click "Send to AME" again.\n\nProxYoda will launch AME with all your jobs in the queue.')
      } else if (error.code === 'FOLDERS_NOT_FOUND') {
        const folderList = error.missingFolders?.slice(0, 3).join('\n') || ''
        const moreCount = (error.missingFolders?.length || 0) > 3 ? `\n...and ${error.missingFolders.length - 3} more` : ''
        await alert(`⚠️ Folder structure does not exist.\n\nThe following destination folders are missing:\n${folderList}${moreCount}\n\nPlease click "Create Folder Structure" first, then click "Send to AME" again.`)
      } else {
        await alert('❌ Error sending to AME: ' + error.message)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [autoRefreshInterval])

  return (
    <div className="dashboard">
      <section className="folder-paths-section">
        <h3>Folder Paths</h3>
        <div className="folder-paths-row">
          <div className="folder-setting">
            <label>Original Files Folder:</label>
            <div className="folder-input">
              <input
                type="text"
                value={settings.originalPath || ''}
                onChange={(e) => setSettings({ ...settings, originalPath: e.target.value })}
                placeholder="Select original files folder or type path"
                title={settings.originalPath || ''}
              />
              <button onClick={() => handleBrowseFolder('original')}>Browse</button>
            </div>
          </div>

          <div className="folder-setting">
            <label>Proxy Files Folder:</label>
            <div className="folder-input">
              <input
                type="text"
                value={settings.proxyPath || ''}
                onChange={(e) => setSettings({ ...settings, proxyPath: e.target.value })}
                placeholder="Select proxy files folder or type path"
                title={settings.proxyPath || ''}
              />
              <button onClick={() => handleBrowseFolder('proxy')}>Browse</button>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-controls">
        <button className="btn btn-primary" onClick={handleRefresh} disabled={isScanning}>
          {isScanning ? '⏳ Scanning...' : '🔄 Refresh'}
        </button>
        <button className="btn btn-secondary" onClick={handleQuickRefresh} disabled={isScanning || files.length === 0}>
          ⚡ Quick Refresh
        </button>
        <AutoRefreshControl onIntervalChange={handleAutoRefresh} />
        <button className="btn btn-secondary" onClick={handleCreateFolderStructure}>
          📁 Create Folder Structure
        </button>
        <button
          className="btn btn-success"
          onClick={handleSendToAME}
          disabled={selectedFiles.size === 0}
        >
          📤 Send to AME ({selectedFiles.size})
        </button>
      </div>

      {isScanning && scanProgress.total > 0 && (
        <div className="scan-progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Processing: {scanProgress.current} / {scanProgress.total} files
          </div>
        </div>
      )}

      <div className="dashboard-info">
        <div className="filter-item">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Files</option>
            <option value="missing">Missing Proxies</option>
            <option value="complete">Complete Proxies</option>
          </select>
        </div>
        <div className="info-item">
          <span className="info-label">Total Files:</span>
          <span className="info-value">{files.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Proxies:</span>
          <span className="info-value">{files.reduce((sum, file) => sum + file.proxies.filter(p => p.exists).length, 0)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Selected:</span>
          <span className="info-value">{selectedFiles.size}</span>
        </div>
        <div className="info-separator"></div>
        {Object.entries(getPresetAssignmentCounts()).map(([presetName, count]) => (
          <div key={presetName} className="info-item">
            <span className="info-label">{presetName}:</span>
            <span className="info-value">{count} file{count !== 1 ? 's' : ''}</span>
          </div>
        ))}
        {lastRefresh && (
          <span className="last-refresh">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
        )}
      </div>

      <FileList
        files={files}
        selectedFiles={selectedFiles}
        onSelectFile={handleSelectFile}
        onSelectMultipleFiles={handleSelectMultipleFiles}
        filter={filter}
        proxyPath={settings.proxyPath}
        originalPath={settings.originalPath}
        presets={amePresets}
        presetAssignments={settings.presetAssignments || {}}
        presetOverrides={presetOverrides}
        onPresetOverride={handlePresetOverride}
      />
    </div>
  )
}

