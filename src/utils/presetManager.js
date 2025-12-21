import { buildPresetXML } from './amePresetBuilder'

/**
 * Save proxy presets to EPR files in the proxy folder
 * @param {string} proxyPath - Path to the proxy folder
 * @param {object} resolutions - Resolution mappings (e.g., { '1080p': 0.5, '4K': 0.25 })
 * @param {object} proxySettings - Proxy settings for each resolution
 */
export async function saveProxyPresets(proxyPath, resolutions, proxySettings) {
  if (!window.electronAPI) {
    throw new Error('Preset saving is only available in Electron mode')
  }

  try {
    for (const [resolution, scale] of Object.entries(resolutions)) {
      const settings = proxySettings[resolution] || {}
      const proxyName = settings.proxyName || resolution

      // Build preset configuration
      const presetConfig = {
        presetName: proxyName,
        codec: 'MOV',
        quality: 4,
        resolution: resolution,
        scale: scale,
        includeAudio: settings.includeAudio || false,
        includeAlpha: settings.includeAlpha || false,
      }

      // Generate preset XML
      const presetXML = await buildPresetXML(presetConfig)

      // Save to EPR file
      const fileName = `${proxyName}.epr`
      const filePath = `${proxyPath}\\${fileName}`

      const result = await window.electronAPI.writeFile(filePath, presetXML)
      if (result.error) {
        throw new Error(result.error)
      }
      console.log(`Saved preset: ${fileName}`)
    }
  } catch (error) {
    console.error('Error saving presets:', error)
    throw error
  }
}

/**
 * Load proxy presets from EPR files in the proxy folder
 * @param {string} proxyPath - Path to the proxy folder
 * @returns {object} Loaded presets
 */
export async function loadProxyPresets(proxyPath) {
  if (!window.electronAPI) {
    return {}
  }

  try {
    const files = await window.electronAPI.readDir(proxyPath)
    const presets = {}

    for (const file of files) {
      if (file.name.endsWith('.epr')) {
        const presetName = file.name.replace('.epr', '')
        const filePath = `${proxyPath}\\${file.name}`
        const content = await window.electronAPI.readFile(filePath)

        presets[presetName] = {
          presetName,
          path: filePath,
          xml: content,
        }
      }
    }

    return presets
  } catch (error) {
    console.error('Error loading presets:', error)
    return {}
  }
}

