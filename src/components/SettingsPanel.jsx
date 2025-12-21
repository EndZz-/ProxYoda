import { useState, useEffect } from 'react'
import '../styles/SettingsPanel.css'
import { saveProxyPresets } from '../utils/presetManager'
import { scanAMEVersions, scanAMEPresets, buildPresetXML } from '../utils/amePresetBuilder'
import { useModal } from './Modal'

export default function SettingsPanel({ settings, setSettings }) {
  const { alert, confirm } = useModal()
  const [resolutions, setResolutions] = useState(settings.resolutionMappings || {})
  const [proxySettings, setProxySettings] = useState(settings.proxySettings || {})
  const [presetAssignments, setPresetAssignments] = useState(settings.presetAssignments || {})
  const [customResolutions, setCustomResolutions] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [ameVersions, setAmeVersions] = useState([])
  const [selectedAmeVersion, setSelectedAmeVersion] = useState('25.0')
  const [amePresets, setAmePresets] = useState({})
  const [sortColumn, setSortColumn] = useState('resolution')
  const [sortDirection, setSortDirection] = useState('asc')
  const [codecSettings, setCodecSettings] = useState(settings.codecSettings || {})
  const [isRefreshingPresets, setIsRefreshingPresets] = useState(false)
  const [networkSettings, setNetworkSettings] = useState(settings.networkSettings || {
    proxYodaIP: 'localhost',
  })
  const [networkAdapters, setNetworkAdapters] = useState([])
  const [isSettingProxYodaIP, setIsSettingProxYodaIP] = useState(false)

  useEffect(() => {
    setResolutions(settings.resolutionMappings || {})
    setProxySettings(settings.proxySettings || {})
    setPresetAssignments(settings.presetAssignments || {})
    setCodecSettings(settings.codecSettings || {})
    setNetworkSettings(settings.networkSettings || {
      proxYodaIP: 'localhost',
    })
  }, [settings.resolutionMappings, settings.proxySettings, settings.presetAssignments, settings.codecSettings, settings.networkSettings])

  useEffect(() => {
    // Load AME versions and network adapters on component mount
    loadAmeVersions()
    loadNetworkAdapters()
  }, [])

  const loadNetworkAdapters = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getNetworkAdapters()
        if (result.success) {
          setNetworkAdapters(result.adapters)
        }
      }
    } catch (error) {
      console.error('Error loading network adapters:', error)
    }
  }

  useEffect(() => {
    // Load presets when version changes
    loadAmePresets(selectedAmeVersion)
  }, [selectedAmeVersion])

  const loadAmeVersions = async () => {
    try {
      const versions = await scanAMEVersions()
      setAmeVersions(versions)
      if (versions.length > 0 && !versions.includes(selectedAmeVersion)) {
        setSelectedAmeVersion(versions[0])
      }
    } catch (error) {
      console.error('Error loading AME versions:', error)
    }
  }

  const loadAmePresets = async (version) => {
    try {
      const presets = await scanAMEPresets(version)
      setAmePresets(presets)

      // Clear any assignments that no longer exist in the new version
      const validPresetNames = Object.keys(presets)
      const updatedAssignments = { ...presetAssignments }
      let hasChanges = false

      Object.keys(updatedAssignments).forEach(resolution => {
        if (updatedAssignments[resolution] && !validPresetNames.includes(updatedAssignments[resolution])) {
          updatedAssignments[resolution] = 'unassigned'
          hasChanges = true
        }
      })

      if (hasChanges) {
        setPresetAssignments(updatedAssignments)
        setSettings({
          ...settings,
          presetAssignments: updatedAssignments,
        })
      }
    } catch (error) {
      console.error('Error loading AME presets:', error)
    }
  }

  const handlePresetAssignmentChange = (resolution, presetName) => {
    const updatedAssignments = {
      ...presetAssignments,
      [resolution]: presetName,
    }
    setPresetAssignments(updatedAssignments)
    setSettings({
      ...settings,
      presetAssignments: updatedAssignments,
    })
  }

  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortedResolutions = () => {
    const resolutionArray = Object.entries(resolutions).map(([res, scale]) => ({
      resolution: res,
      scale: scale,
    }))

    resolutionArray.sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case 'resolution':
          aValue = a.resolution
          bValue = b.resolution
          break
        case 'scale':
          // Sort by scale value numerically
          const scaleMap = { 'skip': -1, 'custom': 0, 1: 1, 0.5: 2, 0.25: 3, 0.125: 4, 0.0625: 5 }
          aValue = scaleMap[a.scale] ?? 999
          bValue = scaleMap[b.scale] ?? 999
          break
        case 'proxyName':
          aValue = proxySettings[a.resolution]?.proxyName || ''
          bValue = proxySettings[b.resolution]?.proxyName || ''
          break
        case 'codec':
          aValue = codecSettings[a.resolution] || 'Select Codec'
          bValue = codecSettings[b.resolution] || 'Select Codec'
          break
        case 'audio':
          aValue = proxySettings[a.resolution]?.includeAudio ? 1 : 0
          bValue = proxySettings[b.resolution]?.includeAudio ? 1 : 0
          break
        case 'alpha':
          aValue = proxySettings[a.resolution]?.includeAlpha ? 1 : 0
          bValue = proxySettings[b.resolution]?.includeAlpha ? 1 : 0
          break
        case 'preset':
          aValue = presetAssignments[a.resolution] || 'unassigned'
          bValue = presetAssignments[b.resolution] || 'unassigned'
          break
        default:
          return 0
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle numeric comparison
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return resolutionArray
  }

  const handleResolutionChange = (resolution, scale) => {
    const newResolutions = { ...resolutions }
    newResolutions[resolution] = scale
    setResolutions(newResolutions)

    // Clear custom resolution if switching away from custom
    if (scale !== 'custom') {
      const newCustom = { ...customResolutions }
      delete newCustom[resolution]
      setCustomResolutions(newCustom)
    }

    setSettings({
      ...settings,
      resolutionMappings: newResolutions,
    })
  }

  const handleCustomResolutionChange = (resolution, value) => {
    const newCustom = { ...customResolutions }
    newCustom[resolution] = value
    setCustomResolutions(newCustom)

    // Update the resolution mapping with custom value
    const newResolutions = { ...resolutions }
    newResolutions[resolution] = value
    setResolutions(newResolutions)
    setSettings({
      ...settings,
      resolutionMappings: newResolutions,
    })
  }

  const handleProxySettingChange = (resolution, field, value) => {
    const newProxySettings = { ...proxySettings }
    if (!newProxySettings[resolution]) {
      newProxySettings[resolution] = {}
    }
    newProxySettings[resolution][field] = value
    setProxySettings(newProxySettings)
  }

  const handleCodecChange = (resolution, codec) => {
    const newCodecSettings = { ...codecSettings }
    newCodecSettings[resolution] = codec
    setCodecSettings(newCodecSettings)
    setSettings({
      ...settings,
      codecSettings: newCodecSettings,
    })
  }

  const handleNetworkSettingChange = (field, value) => {
    const newNetworkSettings = { ...networkSettings }
    newNetworkSettings[field] = value
    setNetworkSettings(newNetworkSettings)
    setSettings({
      ...settings,
      networkSettings: newNetworkSettings,
    })
  }

  const handleSetProxYodaIP = async () => {
    try {
      const ipAddress = networkSettings.proxYodaIP || 'localhost'
      setIsSettingProxYodaIP(true)

      const result = await window.electronAPI.setProxYodaIP(ipAddress)

      if (result.success) {
        await alert(`✅ ProxYoda IP set to ${ipAddress}\n\nPlease restart the dev server for changes to take effect.\n\nThe web UI will be accessible at: http://${ipAddress}:5173/`)
      } else {
        await alert(`❌ Error setting ProxYoda IP: ${result.error}`)
      }
    } catch (error) {
      console.error('Error setting ProxYoda IP:', error)
      await alert(`❌ Error: ${error.message}`)
    } finally {
      setIsSettingProxYodaIP(false)
    }
  }

  const handleSaveProxyPreset = async (resolution) => {
    const proxyName = proxySettings[resolution]?.proxyName?.trim()

    if (!proxyName) {
      alert(`Please enter a proxy name for ${resolution}`)
      return
    }

    if (!selectedAmeVersion) {
      alert('Please select an AME version first in Manage AME Presets')
      return
    }

    try {
      setIsSaving(true)

      // Get the scale value
      const scale = resolutions[resolution]
      let width, height

      if (scale === 'custom') {
        // Use custom resolution values
        const customRes = customResolutions[resolution]
        if (customRes) {
          const parts = customRes.split('x')
          width = parseInt(parts[0])
          height = parseInt(parts[1])
        } else {
          throw new Error('Custom resolution not set')
        }
      } else if (scale === 'skip') {
        throw new Error('Cannot save preset for skipped resolution')
      } else if (scale === 1) {
        // Match: use original resolution
        const parsed = parseResolution(resolution)
        if (parsed) {
          width = parsed.width
          height = parsed.height
        } else {
          throw new Error('Could not parse resolution')
        }
      } else {
        // Calculate scaled resolution
        const scaledRes = calculateScaledResolution(resolution, scale)
        const parts = scaledRes.split('x')
        width = parseInt(parts[0])
        height = parseInt(parts[1])
      }

      // Get the preset path for the selected AME version
      const username = await window.electronAPI.getUsername()
      const presetPath = `C:\\Users\\${username}\\Documents\\Adobe\\Adobe Media Encoder\\${selectedAmeVersion}\\Presets\\${proxyName}.epr`

      // Build the preset XML with correct parameters
      const presetConfig = {
        presetName: proxyName,
        width: Math.round(width),
        height: Math.round(height),
        includeAudio: proxySettings[resolution]?.includeAudio || false,
        includeAlpha: proxySettings[resolution]?.includeAlpha || false,
        codec: codecSettings[resolution] || 'NotchLC',
      }

      const presetXML = await buildPresetXML(presetConfig)

      // Save the EPR file
      const result = await window.electronAPI.writeFile(presetPath, presetXML)
      if (result.error) {
        throw new Error(result.error)
      }

      await alert(`✅ Proxy preset "${proxyName}" saved successfully to AME ${selectedAmeVersion}!`)

      // Refresh the AME presets list
      await loadAmePresets(selectedAmeVersion)

      // Update settings
      setSettings({
        ...settings,
        proxySettings: proxySettings,
      })
    } catch (error) {
      console.error('Error saving proxy preset:', error)
      await alert('❌ Error saving proxy preset: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAmePreset = async (presetName) => {
    const confirmed = await confirm(`Delete AME preset "${presetName}"?`, 'Delete Preset')
    if (!confirmed) {
      return
    }

    try {
      const preset = amePresets[presetName]
      if (!preset || !preset.path) {
        await alert('Preset path not found')
        return
      }

      const result = await window.electronAPI.deleteFile(preset.path)
      if (result.error) {
        throw new Error(result.error)
      }

      await alert(`✅ AME preset "${presetName}" deleted successfully`)
      // Refresh the presets list
      await loadAmePresets(selectedAmeVersion)
    } catch (error) {
      console.error('Error deleting AME preset:', error)
      await alert('❌ Error deleting AME preset: ' + error.message)
    }
  }

  const handleRefreshPresets = async () => {
    setIsRefreshingPresets(true)
    try {
      await loadAmePresets(selectedAmeVersion)
    } finally {
      setIsRefreshingPresets(false)
    }
  }

  const scaleOptions = [
    { label: '1/1 (100%)', value: 1 },
    { label: '1/2 (50%)', value: 0.5 },
    { label: '1/4 (25%)', value: 0.25 },
    { label: '1/8 (12.5%)', value: 0.125 },
    { label: '1/16 (6.25%)', value: 0.0625 },
    { label: 'Custom', value: 'custom' },
    { label: 'Skip', value: 'skip' },
  ]

  const parseResolution = (resolutionStr) => {
    const match = resolutionStr.match(/(\d+)x(\d+)/)
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) }
    }
    return null
  }

  const calculateScaledResolution = (resolution, scale) => {
    const parsed = parseResolution(resolution)
    if (!parsed) return null

    // If scale is 1 (Match), return the original resolution
    if (scale === 1) {
      return resolution
    }

    const scaledWidth = Math.round(parsed.width * scale)
    const scaledHeight = Math.round(parsed.height * scale)
    return `${scaledWidth}x${scaledHeight}`
  }

  const handleCustomResolutionWidthChange = (resolution, width) => {
    const parsed = parseResolution(resolution)
    if (!parsed) return

    const aspectRatio = parsed.height / parsed.width
    const height = Math.round(width * aspectRatio)
    const customValue = `${width}x${height}`

    handleCustomResolutionChange(resolution, customValue)
  }

  const handleCustomResolutionHeightChange = (resolution, height) => {
    const parsed = parseResolution(resolution)
    if (!parsed) return

    const aspectRatio = parsed.width / parsed.height
    const width = Math.round(height * aspectRatio)
    const customValue = `${width}x${height}`

    handleCustomResolutionChange(resolution, customValue)
  }

  return (
    <div className="settings-panel">
      {/* Network Settings Section */}
      <section className="settings-section">
        <div className="section-header-row">
          <h2>🌐 Network Settings</h2>
          <button
            onClick={loadNetworkAdapters}
            className="refresh-adapters-button"
            title="Refresh network adapter list"
          >
            🔄 Refresh Adapters
          </button>
        </div>
        <p className="section-desc">Configure network address for ProxYoda web access</p>

        <div className="network-settings-grid">
          <div className="network-setting-item">
            <label htmlFor="proxYoda-ip">ProxYoda IP Address</label>
            <div className="port-input-group">
              <select
                id="proxYoda-ip"
                value={networkSettings.proxYodaIP || 'localhost'}
                onChange={(e) => handleNetworkSettingChange('proxYodaIP', e.target.value)}
                className="network-input"
              >
                {networkAdapters.map((adapter) => (
                  <option key={adapter.address} value={adapter.address}>
                    {adapter.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSetProxYodaIP}
                disabled={isSettingProxYodaIP}
                className="set-port-button"
                title="Apply IP to Vite config for web access"
              >
                {isSettingProxYodaIP ? 'Setting...' : 'Set ProxYoda IP'}
              </button>
            </div>
            <small className="setting-hint">Select the network adapter for ProxYoda web app. Click "Set ProxYoda IP" to apply.</small>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Proxy Mappings</h2>
        <p className="section-desc">Configure proxy encoding settings for each resolution</p>

        {Object.keys(resolutions).length > 0 && (
          <div className="resolution-mappings-table">
            <div className="table-header">
              <div
                className={`header-cell resolution-col ${sortColumn === 'resolution' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('resolution')}
              >
                Resolution {sortColumn === 'resolution' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div
                className={`header-cell scale-col ${sortColumn === 'scale' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('scale')}
              >
                Scale {sortColumn === 'scale' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div
                className={`header-cell proxy-name-col ${sortColumn === 'proxyName' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('proxyName')}
              >
                Proxy Name {sortColumn === 'proxyName' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div
                className={`header-cell codec-col ${sortColumn === 'codec' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('codec')}
              >
                Codec {sortColumn === 'codec' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div
                className={`header-cell checkbox-col ${sortColumn === 'audio' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('audio')}
              >
                Audio {sortColumn === 'audio' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div
                className={`header-cell checkbox-col ${sortColumn === 'alpha' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('alpha')}
              >
                Alpha {sortColumn === 'alpha' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
              <div className="header-cell action-col">Action</div>
              <div
                className={`header-cell preset-col ${sortColumn === 'preset' ? 'sorted' : ''}`}
                onClick={() => handleColumnSort('preset')}
              >
                Assigned Preset {sortColumn === 'preset' && (sortDirection === 'asc' ? '▲' : '▼')}
              </div>
            </div>

            {getSortedResolutions().map(({ resolution, scale }) => (
              <div key={resolution} className="resolution-row">
                <div className="cell resolution-col">
                  <span className="resolution-label">{resolution}</span>
                </div>

                <div className="cell scale-col">
                  <div className="scale-selector">
                    <select
                      value={scale === 'custom' ? 'custom' : scale === 'skip' ? 'skip' : scale}
                      onChange={(e) => handleResolutionChange(resolution, e.target.value)}
                    >
                      {scaleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {scale !== 'custom' && scale !== 'skip' && (
                      <span className="scaled-resolution">
                        {calculateScaledResolution(resolution, scale)}
                      </span>
                    )}
                  </div>
                  {scale === 'custom' && (
                    <div className="custom-resolution-inputs">
                      <div className="resolution-input-group">
                        <label>Width:</label>
                        <input
                          type="number"
                          value={customResolutions[resolution]?.split('x')[0] || ''}
                          onChange={(e) => handleCustomResolutionWidthChange(resolution, parseInt(e.target.value) || 0)}
                          className="resolution-number-input"
                        />
                      </div>
                      <div className="resolution-input-group">
                        <label>Height:</label>
                        <input
                          type="number"
                          value={customResolutions[resolution]?.split('x')[1] || ''}
                          onChange={(e) => handleCustomResolutionHeightChange(resolution, parseInt(e.target.value) || 0)}
                          className="resolution-number-input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="cell proxy-name-col">
                  <input
                    type="text"
                    placeholder="e.g., Proxy_1080p"
                    value={proxySettings[resolution]?.proxyName || ''}
                    onChange={(e) => handleProxySettingChange(resolution, 'proxyName', e.target.value)}
                    className="proxy-name-input"
                  />
                </div>

                <div className="cell codec-col">
                  <select
                    value={codecSettings[resolution] || 'Select Codec'}
                    onChange={(e) => handleCodecChange(resolution, e.target.value)}
                    className="codec-dropdown"
                  >
                    <option value="Select Codec">Select Codec</option>
                    <option value="NotchLC">NotchLC</option>
                    <option value="Prores422">Prores 4:2:2</option>
                  </select>
                </div>

                <div className="cell checkbox-col">
                  <input
                    type="checkbox"
                    checked={proxySettings[resolution]?.includeAudio || false}
                    onChange={(e) => handleProxySettingChange(resolution, 'includeAudio', e.target.checked)}
                    className="checkbox-input"
                  />
                </div>

                <div className="cell checkbox-col">
                  <input
                    type="checkbox"
                    checked={proxySettings[resolution]?.includeAlpha || false}
                    onChange={(e) => handleProxySettingChange(resolution, 'includeAlpha', e.target.checked)}
                    className="checkbox-input"
                    disabled={codecSettings[resolution] === 'Prores422'}
                    title={codecSettings[resolution] === 'Prores422' ? 'Alpha not supported in Prores 4:2:2' : ''}
                  />
                </div>

                <div className="cell action-col">
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => handleSaveProxyPreset(resolution)}
                    disabled={isSaving}
                  >
                    {isSaving ? '💾...' : '💾 Save'}
                  </button>
                </div>

                <div className="cell preset-col">
                  <select
                    value={presetAssignments[resolution] || 'unassigned'}
                    onChange={(e) => handlePresetAssignmentChange(resolution, e.target.value)}
                    className="preset-assignment-dropdown"
                  >
                    <option value="unassigned">Unassigned</option>
                    {Object.keys(amePresets).sort((a, b) => a.localeCompare(b)).map(presetName => (
                      <option key={presetName} value={presetName}>
                        {presetName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {Object.keys(resolutions).length === 0 && (
          <p className="empty-msg">No resolutions detected yet. Scan original files first.</p>
        )}
      </section>

      <section className="settings-section">
        <h2>Manage AME Presets</h2>
        <p className="section-desc">View and delete Adobe Media Encoder presets</p>

        <div className="ame-version-selector">
          <label htmlFor="ame-version">AME Version:</label>
          <select
            id="ame-version"
            value={selectedAmeVersion}
            onChange={(e) => setSelectedAmeVersion(e.target.value)}
          >
            {ameVersions.map(version => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
          <button
            className="btn btn-small btn-refresh"
            onClick={handleRefreshPresets}
            disabled={isRefreshingPresets}
            title="Refresh presets list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36" />
            </svg>
            {isRefreshingPresets ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {ameVersions.length > 0 ? (
          <div className="ame-presets-list">
            {Object.entries(amePresets).map(([presetName, preset]) => (
              <div key={presetName} className="preset-item">
                <div className="preset-info">
                  <span className="preset-name">{presetName}</span>
                  <span className="preset-path">{preset.path}</span>
                </div>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteAmePreset(presetName)}
                >
                  Delete
                </button>
              </div>
            ))}
            {Object.keys(amePresets).length === 0 && (
              <p className="empty-msg">No presets found for version {selectedAmeVersion}</p>
            )}
          </div>
        ) : (
          <p className="empty-msg">No Adobe Media Encoder versions found. Please install AME first.</p>
        )}
      </section>
    </div>
  )
}

