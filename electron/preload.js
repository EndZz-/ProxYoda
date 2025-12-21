import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readDir: (dirPath) => ipcRenderer.invoke('file:readDir', dirPath),
  getVideoMetadata: (filePath) => ipcRenderer.invoke('video:getMetadata', filePath),
  savePresetFile: (presetName, presetXML, version) => ipcRenderer.invoke('ame:savePreset', presetName, presetXML, version),
  launchAMEWithJSX: (jsxContent) => ipcRenderer.invoke('ame:launchAMEWithJSX', jsxContent),
  addJobsViaWatchFolder: (jobs, settings) => ipcRenderer.invoke('ame:addJobsViaWatchFolder', jobs, settings),
  createAndExecuteBatch: (batchContent) => ipcRenderer.invoke('ame:executeBatch', batchContent),
  onFileSystemChange: (callback) => ipcRenderer.on('file:changed', callback),
  removeFileSystemChangeListener: () => ipcRenderer.removeAllListeners('file:changed'),
  getUsername: () => ipcRenderer.invoke('system:getUsername'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  createFolderStructure: (originalPath, proxyPath) => ipcRenderer.invoke('file:createFolderStructure', originalPath, proxyPath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:writeFile', filePath, content),
  readFile: (filePath) => ipcRenderer.invoke('file:readFile', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('file:deleteFile', filePath),
  getNetworkAdapters: () => ipcRenderer.invoke('network:getAdapters'),
  setAMEWebServicePort: (ameVersion, port) => ipcRenderer.invoke('ame:setWebServicePort', ameVersion, port),
  setProxYodaIP: (ipAddress) => ipcRenderer.invoke('network:setProxYodaIP', ipAddress),
})

