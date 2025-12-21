import { useState, useEffect } from 'react'
import '../styles/PresetBuilder.css'
import { buildPresetXML, scanAMEPresets } from '../utils/amePresetBuilder'

export default function PresetBuilder({ settings, setSettings, resolutionMappings = {} }) {
  const [presetName, setPresetName] = useState('')
  const [selectedResolutions, setSelectedResolutions] = useState([])
  const [codec, setCodec] = useState('MOV')
  const [quality, setQuality] = useState(4)
  const [presets, setPresets] = useState(settings.presets || {})
  const [ameVersion, setAmeVersion] = useState('25.0')

  useEffect(() => {
    // Load existing presets from AME folder on component mount
    loadAMEPresets()
  }, [ameVersion])

  const loadAMEPresets = async () => {
    console.log('Loading AME presets for version:', ameVersion)
    const existingPresets = await scanAMEPresets(ameVersion)
    console.log('Existing presets loaded:', existingPresets)

    if (Object.keys(existingPresets).length > 0) {
      // Merge existing AME presets with app presets
      const mergedPresets = {
        ...existingPresets,
        ...settings.presets,
      }
      console.log('Merged presets:', mergedPresets)
      setPresets(mergedPresets)
      setSettings({
        ...settings,
        presets: mergedPresets,
      })
    } else {
      console.log('No AME presets found, showing app presets only')
      setPresets(settings.presets || {})
    }
  }

  const handleSelectAMEFolder = async () => {
    if (!window.showDirectoryPicker) {
      alert('Your browser does not support folder selection. Please use Electron app or Chrome/Edge.')
      return
    }

    try {
      const dirHandle = await window.showDirectoryPicker()
      if (dirHandle) {
        console.log('Selected AME folder:', dirHandle.name)
        // Scan the selected folder for .epr files
        const presetsFromFolder = {}
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.epr')) {
            const presetName = entry.name.replace('.epr', '')
            presetsFromFolder[presetName] = {
              presetName,
              path: entry.name,
              codec: 'Unknown',
            }
          }
        }

        console.log('Found presets in folder:', presetsFromFolder)

        if (Object.keys(presetsFromFolder).length > 0) {
          const mergedPresets = {
            ...presetsFromFolder,
            ...settings.presets,
          }
          setPresets(mergedPresets)
          setSettings({
            ...settings,
            presets: mergedPresets,
          })
          alert(`Loaded ${Object.keys(presetsFromFolder).length} presets from folder`)
        } else {
          alert('No .epr preset files found in selected folder')
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting folder:', err)
        alert('Error selecting folder: ' + err.message)
      }
    }
  }

  const handleCreatePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name')
      return
    }

    if (selectedResolutions.length === 0) {
      alert('Please select at least one resolution for this preset')
      return
    }

    const presetConfig = {
      presetName,
      codec,
      quality: parseInt(quality),
      resolutions: selectedResolutions,
    }

    const presetXML = await buildPresetXML(presetConfig)
    const newPresets = {
      ...presets,
      [presetName]: {
        ...presetConfig,
        xml: presetXML,
      },
    }

    setPresets(newPresets)
    setSettings({
      ...settings,
      presets: newPresets,
    })

    setPresetName('')
    setSelectedResolutions([])
    alert(`Preset "${presetName}" created successfully for ${selectedResolutions.length} resolution(s)!`)
  }

  const handleDeletePreset = (name) => {
    const preset = presets[name]
    const isAMEPreset = preset.path && preset.path.includes('Adobe\\Adobe Media Encoder')

    if (isAMEPreset) {
      alert('Cannot delete presets from Adobe Media Encoder folder. Delete them directly from AME.')
      return
    }

    if (window.confirm(`Delete preset "${name}"?`)) {
      const newPresets = { ...presets }
      delete newPresets[name]
      setPresets(newPresets)
      setSettings({
        ...settings,
        presets: newPresets,
      })
    }
  }

  return (
    <div className="preset-builder">
      <section className="preset-section">
        <h3>Create New Preset</h3>
        <div className="preset-form">
          <div className="form-group">
            <label>AME Version:</label>
            <select value={ameVersion} onChange={(e) => {
              setAmeVersion(e.target.value)
              loadAMEPresets()
            }}>
              <option value="24.0">24.0</option>
              <option value="24.1">24.1</option>
              <option value="24.2">24.2</option>
              <option value="24.3">24.3</option>
              <option value="24.4">24.4</option>
              <option value="24.5">24.5</option>
              <option value="24.6">24.6</option>
              <option value="25.0">25.0</option>
              <option value="25.1">25.1</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preset Name:</label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., Proxy_1080p"
            />
          </div>

          <div className="form-group">
            <label>Select Resolutions:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.keys(resolutionMappings).length > 0 ? (
                Object.entries(resolutionMappings).map(([resolution, scale]) => (
                  <label key={resolution} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedResolutions.includes(resolution)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResolutions([...selectedResolutions, resolution])
                        } else {
                          setSelectedResolutions(selectedResolutions.filter(r => r !== resolution))
                        }
                      }}
                    />
                    <span>{resolution} ({Math.round(scale * 100)}%)</span>
                  </label>
                ))
              ) : (
                <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>No resolutions configured. Scan files first in Dashboard.</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Codec:</label>
            <select value={codec} onChange={(e) => setCodec(e.target.value)}>
              <option value="MOV">MOV</option>
              <option value="MP4">MP4</option>
              <option value="NotchLC">NotchLC</option>
              <option value="HAP">HAP</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quality (1-5):</label>
            <input
              type="range"
              min="1"
              max="5"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            />
            <span className="quality-value">{quality}</span>
          </div>

          <button className="btn btn-primary" onClick={handleCreatePreset}>
            Create Preset
          </button>
        </div>
      </section>

      <section className="preset-section">
        <h3>Saved Presets</h3>
        {!window.electronAPI && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#3a3a3a', borderRadius: '4px', border: '1px solid #667eea' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#a0a0a0' }}>
              Running in web mode. Click below to select your AME Presets folder:
            </p>
            <button className="btn btn-primary" onClick={handleSelectAMEFolder}>
              Browse AME Presets Folder
            </button>
          </div>
        )}
        <div className="presets-list">
          {Object.entries(presets).map(([name, preset]) => {
            const isAMEPreset = preset.path && preset.path.includes('Adobe\\Adobe Media Encoder')
            return (
              <div key={name} className="preset-item">
                <div className="preset-info">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span className="preset-name">{name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="preset-codec">{preset.codec}</span>
                      {isAMEPreset && <span className="preset-source">AME</span>}
                      {preset.resolutions && preset.resolutions.length > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                          {preset.resolutions.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeletePreset(name)}
                  disabled={isAMEPreset}
                  title={isAMEPreset ? 'Cannot delete AME presets' : 'Delete preset'}
                >
                  Delete
                </button>
              </div>
            )
          })}
          {Object.keys(presets).length === 0 && (
            <p className="empty-msg">No presets found</p>
          )}
        </div>
      </section>
    </div>
  )
}

