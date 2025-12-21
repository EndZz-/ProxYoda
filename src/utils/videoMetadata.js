export async function getVideoResolution(filePath) {
  try {
    if (window.electronAPI) {
      console.log('Calling electronAPI.getVideoMetadata for:', filePath)
      const metadata = await window.electronAPI.getVideoMetadata(filePath)
      console.log('Received metadata response:', metadata)
      if (metadata.error) {
        console.error('Error getting video metadata for', filePath, ':', metadata.error)
        return null
      }
      console.log('Got metadata for', filePath, ':', metadata)
      return {
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
      }
    }
    // Web mode - cannot determine resolution without ffprobe
    console.warn('Web mode: Cannot determine video resolution without ffprobe')
    return null
  } catch (error) {
    console.error('Error getting video metadata for', filePath, ':', error.message || error)
    console.error('Full error:', error)
    return null
  }
}

export function calculateScaledResolution(width, height, scale) {
  if (scale === 'custom') {
    return null // User will input custom resolution
  }

  const scaleFactor = parseFloat(scale)
  const newWidth = Math.round(width * scaleFactor)
  const newHeight = Math.round(height * scaleFactor)

  // Ensure dimensions are even (required for most codecs)
  return {
    width: newWidth % 2 === 0 ? newWidth : newWidth - 1,
    height: newHeight % 2 === 0 ? newHeight : newHeight - 1,
  }
}

export function formatResolution(width, height) {
  return `${width}x${height}`
}

export function parseResolution(resolutionString) {
  const [width, height] = resolutionString.split('x').map(Number)
  return { width, height }
}

