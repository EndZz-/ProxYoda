import { v4 as uuidv4 } from 'uuid'

export async function buildPresetXML(presetConfig) {
  const {
    presetName,
    width,
    height,
    includeAudio = false,
    includeAlpha = false,
    codec = 'NotchLC', // Default to NotchLC for backward compatibility
  } = presetConfig

  // Route to appropriate codec template builder
  switch (codec) {
    case 'Prores422':
      return await buildProres422PresetXML(presetName, width, height, includeAudio)
    case 'H264':
      return await buildH264PresetXML(presetName, width, height, includeAudio)
    case 'NotchLC':
    default:
      return buildNotchLCPresetXML(presetName, width, height, includeAudio, includeAlpha)
  }
}

function buildNotchLCPresetXML(presetName, width, height, includeAudio, includeAlpha) {
  const presetId = uuidv4()
  const doAudio = includeAudio ? 'true' : 'false'
  const alphaParamValue = includeAlpha ? '<ParamValue>true</ParamValue>' : ''

  // NotchLC codec template based on Adobe Media Encoder samples
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PremiereData Version="3">
	<PresetName>${escapeXml(presetName)}</PresetName>
	<PresetComments>Custom</PresetComments>
	<PresetUserComments></PresetUserComments>
	<PresetCreatorApp>Adobe Media Encoder</PresetCreatorApp>
	<ExporterName></ExporterName>
	<ExporterClassID>1668047726</ExporterClassID>
	<ExporterFileType>6515822</ExporterFileType>
	<ExportParamContainer ObjectRef="1"/>
	<PresetID>${presetId}</PresetID>
	<DoAudio>${doAudio}</DoAudio>
	<DoVideo>true</DoVideo>
	<FolderDisplayPath></FolderDisplayPath>
	<StandardFilters Version="1">
		<CropType>0</CropType>
		<UseFrameBlending>false</UseFrameBlending>
		<CustomStartTime>-101606400000000000</CustomStartTime>
		<MaximumFileSize>2000000</MaximumFileSize>
		<TimeInterpolationType>0</TimeInterpolationType>
	</StandardFilters>
	<ExportXMPOptionKey>10</ExportXMPOptionKey>
	<IngestCopyVerificationType>-1</IngestCopyVerificationType>
	<DoEffects>true</DoEffects>
	<DoCaptions>false</DoCaptions>
	<DoMetadata>true</DoMetadata>
	<ExporterParamContainer ObjectID="1" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="2"/>
		</ParamContainerItems>
		<ContainedParamsVersion>7</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="2" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>10</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>0</ParamIdentifier>
		<ParamName></ParamName>
		<ExporterChildParams ObjectRef="3"/>
	</ExporterParam>
	<ExporterParamContainer ObjectID="3" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="4"/>
			<ParamContainerItem Index="1" ObjectRef="18"/>
		</ParamContainerItems>
		<ContainedParamsVersion>7</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="4" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>ADBEVideoTabGroup</ParamIdentifier>
		<ExporterChildParams ObjectRef="5"/>
	</ExporterParam>
	<ExporterParamContainer ObjectID="5" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="6"/>
			<ParamContainerItem Index="1" ObjectRef="7"/>
			<ParamContainerItem Index="2" ObjectRef="17"/>
		</ParamContainerItems>
		<ContainedParamsVersion>7</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="6" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>ADBEVideoCodecGroup</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="7" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>1</ParamOrdinalValue>
		<ParamIdentifier>ADBEBasicVideoGroup</ParamIdentifier>
		<ExporterChildParams ObjectRef="8"/>
	</ExporterParam>
	<ExporterParamContainer ObjectID="8" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="9"/>
			<ParamContainerItem Index="1" ObjectRef="10"/>
			<ParamContainerItem Index="2" ObjectRef="11"/>
			<ParamContainerItem Index="3" ObjectRef="12"/>
			<ParamContainerItem Index="4" ObjectRef="13"/>
			<ParamContainerItem Index="5" ObjectRef="14"/>
			<ParamContainerItem Index="6" ObjectRef="15"/>
			<ParamContainerItem Index="7" ObjectRef="16"/>
		</ParamContainerItems>
		<ContainedParamsVersion>1</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="9" ClassID="d0f6b8af-8ddb-4381-acf8-3e817480d07d" Version="1">
		<ParamType>7</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>ADBEVideoMatchSource</ParamIdentifier>
		<ParamArbData Encoding="base64" Checksum="3062730125">fgAAAA==</ParamArbData>
	</ExporterParam>
	<ExporterParam ObjectID="10" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamValue>${width}</ParamValue>
		<ParamType>2</ParamType>
		<ParamOrdinalValue>1</ParamOrdinalValue>
		<ParamMinValue>16</ParamMinValue>
		<ParamMaxValue>16384</ParamMaxValue>
		<ParamIdentifier>ADBEVideoWidth</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="11" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamValue>${height}</ParamValue>
		<ParamType>2</ParamType>
		<ParamOrdinalValue>2</ParamOrdinalValue>
		<ParamMinValue>16</ParamMinValue>
		<ParamMaxValue>16384</ParamMaxValue>
		<ParamIdentifier>ADBEVideoHeight</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="12" ClassID="d0f6b8af-8ddb-4381-acf8-3e817480d07d" Version="1">
		${alphaParamValue}
		<ParamType>1</ParamType>
		<ParamOrdinalValue>3</ParamOrdinalValue>
		<ParamIdentifier>NOTCHLCIncludeAlphaChannel</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="13" ClassID="8def7863-204e-4206-8791-54a78f15c66b" Version="1">
		<ParamValue>8467200000</ParamValue>
		<ParamType>4</ParamType>
		<ParamOrdinalValue>4</ParamOrdinalValue>
		<ParamIdentifier>ADBEVideoFPS</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="14" ClassID="8d9836e8-d00a-4a00-bfc0-dfbb73540736" Version="1">
		<ParamValue>1,1</ParamValue>
		<ParamType>11</ParamType>
		<ParamOrdinalValue>5</ParamOrdinalValue>
		<ParamIsHidden>true</ParamIsHidden>
		<ParamIdentifier>ADBEVideoAspect</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="15" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>2</ParamType>
		<ParamOrdinalValue>6</ParamOrdinalValue>
		<ParamIsHidden>true</ParamIsHidden>
		<ParamIdentifier>ADBEVideoFieldType</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="16" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamValue>4</ParamValue>
		<ParamType>2</ParamType>
		<ParamOrdinalValue>7</ParamOrdinalValue>
		<ParamMinValue>1</ParamMinValue>
		<ParamMaxValue>5</ParamMaxValue>
		<ParamIdentifier>ADBEVideoQuality</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="17" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>2</ParamOrdinalValue>
		<ParamIdentifier>NotchLCSpecificCodecGroup</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="18" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>1</ParamOrdinalValue>
		<ParamIdentifier>ADBEAudioTabGroup</ParamIdentifier>
		<ExporterChildParams ObjectRef="19"/>
	</ExporterParam>
	<ExporterParamContainer ObjectID="19" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="20"/>
		</ParamContainerItems>
		<ContainedParamsVersion>7</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="20" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamType>8</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>ADBEBasicAudioGroup</ParamIdentifier>
		<ExporterChildParams ObjectRef="21"/>
	</ExporterParam>
	<ExporterParamContainer ObjectID="21" ClassID="5c20a4a5-5e7c-4032-85b8-26ad4531fe7b" Version="1">
		<ParamContainerItems Version="1">
			<ParamContainerItem Index="0" ObjectRef="22"/>
			<ParamContainerItem Index="1" ObjectRef="23"/>
		</ParamContainerItems>
		<ContainedParamsVersion>1</ContainedParamsVersion>
	</ExporterParamContainer>
	<ExporterParam ObjectID="22" ClassID="018cf63d-c58d-4d39-97df-36b6b2d6ef88" Version="1">
		<ParamValue>44100.</ParamValue>
		<ParamType>3</ParamType>
		<ParamOrdinalValue>0</ParamOrdinalValue>
		<ParamIdentifier>ADBEAudioRatePerSecond</ParamIdentifier>
	</ExporterParam>
	<ExporterParam ObjectID="23" ClassID="9f049ab7-d48f-43e9-a8ca-4d7f21233625" Version="1">
		<ParamValue>2</ParamValue>
		<ParamType>2</ParamType>
		<ParamOrdinalValue>1</ParamOrdinalValue>
		<ParamIdentifier>ADBEAudioNumChannels</ParamIdentifier>
	</ExporterParam>
</PremiereData>`

  return xml
}

async function buildProres422PresetXML(presetName, width, height, includeAudio) {
  // Prores 4:2:2 codec template
  // Note: Prores 4:2:2 does NOT support alpha channels
  const presetId = uuidv4()
  const doAudio = includeAudio ? 'true' : 'false'

  // Build the template with audio/without audio variations
  const xml = await buildProres422TemplateXML(presetName, presetId, width, height, doAudio)
  return xml
}

async function buildProres422TemplateXML(presetName, presetId, width, height, doAudio) {
  // Load the appropriate template file based on audio setting
  // Templates are stored in: C:\Users\aquez\OneDrive\AI\Augment\ProxyThis\Templates\

  try {
    if (!window.electronAPI || !window.electronAPI.readFile) {
      throw new Error('Electron API not available for reading template files')
    }

    // Determine which template file to load
    const templateFileName = doAudio === 'true' ? '422 with Audio.epr' : '422 without Audio.epr'
    const templatePath = `C:\\Users\\aquez\\OneDrive\\AI\\Augment\\ProxyThis\\Templates\\${templateFileName}`

    // Read the template file
    const result = await window.electronAPI.readFile(templatePath)
    if (result.error) {
      throw new Error(result.error)
    }
    const templateContent = result.content

    // Parse and modify the template
    // Replace the preset name, ID, and resolution values
    let modifiedXml = templateContent
      .replace(/<PresetName>.*?<\/PresetName>/, `<PresetName>${escapeXml(presetName)}</PresetName>`)
      .replace(/<PresetID>.*?<\/PresetID>/, `<PresetID>${presetId}</PresetID>`)
      .replace(/<ParamValue>30<\/ParamValue>\s*<ParamType>2<\/ParamType>\s*<ParamOrdinalValue>2<\/ParamOrdinalValue>\s*<ParamMinValue>8<\/ParamMinValue>\s*<ParamMaxValue>30000<\/ParamMaxValue>\s*<ParamIdentifier>ADBEVideoWidth<\/ParamIdentifier>/,
        `<ParamValue>${width}</ParamValue>\n\t\t<ParamType>2</ParamType>\n\t\t<ParamOrdinalValue>2</ParamOrdinalValue>\n\t\t<ParamMinValue>8</ParamMinValue>\n\t\t<ParamMaxValue>30000</ParamMaxValue>\n\t\t<ParamIdentifier>ADBEVideoWidth</ParamIdentifier>`)
      .replace(/<ParamValue>30<\/ParamValue>\s*<ParamType>2<\/ParamType>\s*<ParamOrdinalValue>3<\/ParamOrdinalValue>\s*<ParamMinValue>8<\/ParamMinValue>\s*<ParamMaxValue>8192<\/ParamMaxValue>\s*<ParamIdentifier>ADBEVideoHeight<\/ParamIdentifier>/,
        `<ParamValue>${height}</ParamValue>\n\t\t<ParamType>2</ParamType>\n\t\t<ParamOrdinalValue>3</ParamOrdinalValue>\n\t\t<ParamMinValue>8</ParamMinValue>\n\t\t<ParamMaxValue>8192</ParamMaxValue>\n\t\t<ParamIdentifier>ADBEVideoHeight</ParamIdentifier>`)

    return modifiedXml
  } catch (error) {
    console.error('Error loading Prores 4:2:2 template:', error)
    throw new Error(`Failed to load Prores 4:2:2 template: ${error.message}`)
  }
}

async function buildH264PresetXML(presetName, width, height, includeAudio) {
  // H.264 codec template
  // Note: H.264 does NOT support alpha channels
  const presetId = uuidv4()
  const doAudio = includeAudio ? 'true' : 'false'

  try {
    if (!window.electronAPI || !window.electronAPI.readFile) {
      throw new Error('Electron API not available for reading template files')
    }

    // H.264 uses a single template file (we toggle DoAudio in the XML)
    const templatePath = `C:\\Users\\aquez\\OneDrive\\AI\\Augment\\ProxyThis\\Templates\\H.264_GigRecordings.epr`

    // Read the template file
    const result = await window.electronAPI.readFile(templatePath)
    if (result.error) {
      throw new Error(result.error)
    }
    const templateContent = result.content

    // Parse and modify the template
    // Replace the preset name, ID, DoAudio, and resolution values
    let modifiedXml = templateContent
      .replace(/<PresetName>.*?<\/PresetName>/, `<PresetName>${escapeXml(presetName)}</PresetName>`)
      .replace(/<PresetID>.*?<\/PresetID>/, `<PresetID>${presetId}</PresetID>`)
      .replace(/<DoAudio>.*?<\/DoAudio>/, `<DoAudio>${doAudio}</DoAudio>`)
      // Replace width (ADBEVideoWidth) - find ParamValue followed by ADBEVideoWidth identifier
      .replace(
        /(<ParamValue>)1920(<\/ParamValue>[\s\S]*?<ParamIdentifier>ADBEVideoWidth<\/ParamIdentifier>)/,
        `$1${width}$2`
      )
      // Replace height (ADBEVideoHeight) - find ParamValue followed by ADBEVideoHeight identifier
      .replace(
        /(<ParamValue>)1080(<\/ParamValue>[\s\S]*?<ParamIdentifier>ADBEVideoHeight<\/ParamIdentifier>)/,
        `$1${height}$2`
      )

    return modifiedXml
  } catch (error) {
    console.error('Error loading H.264 template:', error)
    throw new Error(`Failed to load H.264 template: ${error.message}`)
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function getAMEPresetPath(version = '25.0') {
  const documentsPath = await getDocumentsPathForVersion(version)
  return `${documentsPath}\\Adobe\\Adobe Media Encoder\\${version}\\Presets`
}

// Get the Documents path where a specific AME version exists
async function getDocumentsPathForVersion(version) {
  // First, try to get the path from getAllAMEVersions which knows where each version is
  if (window.electronAPI && window.electronAPI.getAllAMEVersions) {
    try {
      const versionData = await window.electronAPI.getAllAMEVersions()
      const versionInfo = versionData.find(v => v.version === version)
      if (versionInfo && versionInfo.documentsPath) {
        return versionInfo.documentsPath
      }
    } catch (error) {
      console.error('Error getting version path from getAllAMEVersions:', error)
    }
  }

  // Fallback to default Documents path
  return await getDocumentsPath()
}

async function getDocumentsPath() {
  // Get Documents folder path from Electron API (handles OneDrive redirection, etc.)
  if (window.electronAPI && window.electronAPI.getDocumentsPath) {
    try {
      const documentsPath = await window.electronAPI.getDocumentsPath()
      if (documentsPath) {
        return documentsPath
      }
    } catch (error) {
      console.error('Error getting Documents path from Electron API:', error)
    }
  }

  // Fallback: use username-based path
  if (window.electronAPI && window.electronAPI.getUsername) {
    try {
      const username = await window.electronAPI.getUsername()
      if (username) {
        return `C:\\Users\\${username}\\Documents`
      }
    } catch (error) {
      console.error('Error getting username from Electron API:', error)
    }
  }

  // Final fallback
  console.error('Could not determine Documents path - AME presets may not be found')
  return 'C:\\Users\\user\\Documents'
}

export async function scanAMEVersions() {
  const versions = []

  try {
    if (window.electronAPI && window.electronAPI.getAllAMEVersions) {
      // Use the new API that scans ALL Documents paths
      const versionData = await window.electronAPI.getAllAMEVersions()

      // Extract just the version numbers
      for (const item of versionData) {
        versions.push(item.version)
      }
    } else if (window.electronAPI) {
      // Fallback to old method for backwards compatibility
      const documentsPath = await getDocumentsPath()
      const ameBasePath = `${documentsPath}\\Adobe\\Adobe Media Encoder`

      const files = await window.electronAPI.readDir(ameBasePath)

      // Check if readDir returned an error object
      if (files && files.error) {
        return versions
      }

      // Ensure files is an array before iterating
      if (!Array.isArray(files)) {
        return versions
      }

      for (const file of files) {
        if (file.isDirectory) {
          // Check if this looks like a version number (e.g., "25.0", "24.6")
          if (/^\d+\.\d+$/.test(file.name)) {
            versions.push(file.name)
          }
        }
      }

      // Sort versions in descending order (newest first)
      versions.sort((a, b) => parseFloat(b) - parseFloat(a))
    }
  } catch (error) {
    console.error('Error scanning AME versions:', error)
  }

  return versions
}

export async function scanAMEPresets(version = '25.0') {
  const presets = {}

  try {
    if (window.electronAPI) {
      // Electron mode - use file system API
      const presetPath = await getAMEPresetPath(version)

      try {
        const files = await window.electronAPI.readDir(presetPath)

        // Check if readDir returned an error object
        if (files && files.error) {
          return presets
        }

        // Ensure files is an array before iterating
        if (!Array.isArray(files)) {
          return presets
        }

        for (const file of files) {
          if (!file.isDirectory && file.name.endsWith('.epr')) {
            const presetName = file.name.replace('.epr', '')
            presets[presetName] = {
              presetName,
              path: file.path,
              codec: 'Unknown', // Would need to parse XML to get codec
            }
          }
        }
      } catch (readError) {
        // Silently handle read errors (e.g., directory doesn't exist)
      }
    }
  } catch (error) {
    console.error('Error scanning AME presets:', error)
  }

  return presets
}

