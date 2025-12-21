import { getVideoResolution, formatResolution } from './videoMetadata'

const SUPPORTED_FORMATS = ['.mov', '.mp4', '.notchlc', '.hap']

// Store directory handles globally for web mode
let dirHandles = {
  original: null,
  proxy: null,
}

export function setDirectoryHandles(original, proxy) {
  dirHandles.original = original
  dirHandles.proxy = proxy
}

export async function scanDirectory(dirPath, dirHandle = null, rootPath = null) {
  if (!dirPath) return []

  // Set rootPath on first call
  if (rootPath === null) {
    rootPath = dirPath
  }

  try {
    let files = []

    if (window.electronAPI) {
      // Electron mode - use file system API
      files = await window.electronAPI.readDir(dirPath)
    } else if (dirHandle) {
      // Web mode - use File System Access API
      files = await scanDirectoryHandle(dirHandle)
    } else {
      console.error('No directory handle provided for web mode')
      return []
    }

    const videoFiles = []

    for (const file of files) {
      if (file.isDirectory) {
        let subDirHandle = null
        if (!window.electronAPI && dirHandle) {
          try {
            subDirHandle = await dirHandle.getDirectoryHandle(file.name)
          } catch (e) {
            console.warn(`Could not access subdirectory: ${file.name}`)
            continue
          }
        }
        const subFiles = await scanDirectory(file.path, subDirHandle, rootPath)
        videoFiles.push(...subFiles)
      } else {
        const ext = getFileExtension(file.name).toLowerCase()
        if (SUPPORTED_FORMATS.includes(ext)) {
          // Get video resolution
          const metadata = await getVideoResolution(file.path, file.handle)
          const resolution = metadata
            ? formatResolution(metadata.width, metadata.height)
            : 'Unknown'

          // Calculate relative path from root
          let relativePath = file.path
          if (window.electronAPI && rootPath) {
            // In Electron, calculate relative path
            // Normalize paths to use forward slashes for comparison
            const normalizedPath = file.path.replace(/\\/g, '/')
            const normalizedRoot = rootPath.replace(/\\/g, '/')

            if (normalizedPath.startsWith(normalizedRoot + '/')) {
              relativePath = normalizedPath.substring(normalizedRoot.length + 1)
              // Convert back to backslashes for Windows
              relativePath = relativePath.replace(/\//g, '\\')
            }
          }

          videoFiles.push({
            id: `${file.path}`,
            name: file.name,
            path: file.path,
            relativePath: relativePath,
            extension: ext,
            resolution: resolution,
            width: metadata?.width,
            height: metadata?.height,
            proxies: [],
          })
        }
      }
    }

    return videoFiles
  } catch (error) {
    console.error('Error scanning directory:', error)
    return []
  }
}

async function scanDirectoryHandle(dirHandle) {
  const files = []
  try {
    for await (const entry of dirHandle.values()) {
      files.push({
        name: entry.name,
        isDirectory: entry.kind === 'directory',
        path: entry.name,
        handle: entry,
      })
    }
  } catch (error) {
    console.error('Error reading directory handle:', error)
  }
  return files
}

export function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot)
}

export function getFileNameWithoutExtension(filename) {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? filename : filename.substring(0, lastDot)
}

export async function findProxiesForFile(originalFile, proxyDir, resolutionMappings, proxyDirHandle = null) {
  const baseName = getFileNameWithoutExtension(originalFile.name)
  const proxies = []

  if (!proxyDir || !originalFile.resolution) {
    return proxies
  }

  // Get the scale for this file's resolution
  const scale = resolutionMappings[originalFile.resolution]
  if (scale === undefined) {
    // Resolution not in mappings, can't determine proxy settings
    return proxies
  }

  // Construct the proxy directory path using the same relative path structure
  const relativePath = originalFile.relativePath || originalFile.name
  const relativeDir = relativePath.substring(0, relativePath.lastIndexOf('\\'))
  const proxySubDir = relativeDir ? `${proxyDir}\\${relativeDir}` : proxyDir

  // Look for a proxy file that starts with {baseName}_ (matches any suffix like _proxy, _proxy4, etc.)
  const proxyNamePattern = `${baseName}_`

  // Check if proxy file exists
  let exists = false
  try {
    let proxyFiles = []

    if (window.electronAPI) {
      // Electron mode - read from the proxy subdirectory
      const result = await window.electronAPI.readDir(proxySubDir)
      // Check if result is an error object
      if (result && result.error) {
        console.warn(`Could not read proxy directory ${proxySubDir}: ${result.error}`)
        proxyFiles = []
      } else {
        proxyFiles = result || []
      }
    } else if (proxyDirHandle) {
      // Web mode - navigate to the same relative path in proxy folder
      let currentHandle = proxyDirHandle
      if (relativeDir) {
        const pathParts = relativeDir.split('\\')
        for (const part of pathParts) {
          try {
            currentHandle = await currentHandle.getDirectoryHandle(part)
          } catch (e) {
            console.warn(`Could not access proxy subdirectory: ${part}`)
            return proxies
          }
        }
      }
      proxyFiles = await scanDirectoryHandle(currentHandle)
    }

    // Check if any file starts with the proxy name pattern and has a supported format
    if (Array.isArray(proxyFiles)) {
      exists = proxyFiles.some(f =>
        f.name.startsWith(proxyNamePattern) && SUPPORTED_FORMATS.includes(getFileExtension(f.name).toLowerCase())
      )
    }
  } catch (error) {
    console.warn(`Error checking proxy file in ${proxySubDir}:`, error.message)
  }

  proxies.push({
    name: '_proxy',
    exists: exists,
    resolution: originalFile.resolution,
    scale: scale,
  })

  return proxies
}

export function createFolderStructure(originalPath, proxyPath) {
  // TODO: Implement folder creation logic
  console.log('Creating folder structure from', originalPath, 'to', proxyPath)
}

