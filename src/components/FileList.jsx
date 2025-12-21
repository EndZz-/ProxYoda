import { useState, useEffect, useRef } from 'react'
import '../styles/FileList.css'

export default function FileList({
  files,
  selectedFiles,
  onSelectFile,
  onSelectMultipleFiles,
  filter,
  proxyPath,
  originalPath,
  presets = {},
  presetAssignments = {},
  presetOverrides = {},
  onPresetOverride = () => {}
}) {
  const [sortColumn, setSortColumn] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const selectAllCheckboxRef = useRef(null)
  const lastCheckboxClickRef = useRef({ shiftKey: false, ctrlKey: false, metaKey: false })

  const filteredFiles = files.filter(file => {
    if (filter === 'missing') {
      return file.proxies.some(p => !p.exists)
    }
    if (filter === 'complete') {
      return file.proxies.every(p => p.exists)
    }
    return true
  })

  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortedFiles = () => {
    const filesCopy = [...filteredFiles]

    filesCopy.sort((a, b) => {
      let aValue, bValue

      try {
        switch (sortColumn) {
          case 'name':
            aValue = a.name || ''
            bValue = b.name || ''
            break
          case 'proxyPath':
            aValue = getProxyPath(a) || ''
            bValue = getProxyPath(b) || ''
            break
          case 'preset':
            aValue = presetOverrides[a.id] || presetAssignments[a.resolution] || ''
            bValue = presetOverrides[b.id] || presetAssignments[b.resolution] || ''
            break
          default:
            return 0
        }

        // Ensure both values are strings for comparison
        aValue = String(aValue || '')
        bValue = String(bValue || '')

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      } catch (error) {
        console.error('Error sorting files:', error, { a, b, sortColumn })
        return 0
      }
    })

    return filesCopy
  }

  const sortedFiles = getSortedFiles()

  // Update select all checkbox indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isIndeterminate =
        filteredFiles.length > 0 &&
        filteredFiles.some(file => selectedFiles.has(file.id)) &&
        !filteredFiles.every(file => selectedFiles.has(file.id))

      selectAllCheckboxRef.current.indeterminate = isIndeterminate

      console.log('🔴 Checkbox state updated:')
      console.log('   filteredFiles.length:', filteredFiles.length)
      console.log('   selectedFiles.size:', selectedFiles.size)
      console.log('   isIndeterminate:', isIndeterminate)
      console.log('   checked:', selectAllCheckboxRef.current.checked)
    }
  }, [filteredFiles, selectedFiles])

  const handleOpenInExplorer = (filePath) => {
    if (window.electronAPI) {
      // Electron mode - use shell.showItemInFolder
      window.electronAPI.showItemInFolder(filePath).catch(err => {
        console.error('Error opening file in explorer:', err)
      })
    }
  }

  const getProxyPath = (file, proxyName = '') => {
    if (!proxyPath) return 'No proxy path set'

    // Get the relative path from the original folder
    const relativePath = file.relativePath || file.name
    // Remove the file extension
    const baseName = relativePath.replace(/\.[^/.]+$/, '')

    // Construct the proxy file path with asterisk prefix
    if (proxyName) {
      return `*${proxyPath}\\${baseName}${proxyName}.mov`
    } else {
      // Return base path without preset suffix
      return `*${proxyPath}\\${baseName}.mov`
    }
  }

  const hasProxyFile = (file) => {
    // Check if any proxy exists for this file
    return file.proxies && file.proxies.length > 0 && file.proxies.some(p => p.exists)
  }

  const handleSelectAll = (e) => {
    e.stopPropagation()

    console.log('🟢 FileList.handleSelectAll called')
    console.log('   filteredFiles.length:', filteredFiles.length)
    console.log('   selectedFiles.size:', selectedFiles.size)

    // Use filteredFiles (the actual files being displayed), not sortedFiles
    const allSelected = filteredFiles.length > 0 && filteredFiles.every(file => selectedFiles.has(file.id))

    console.log('   allSelected:', allSelected)
    console.log('   Will', allSelected ? 'DESELECT' : 'SELECT', 'all files')

    // Use the bulk selection callback to avoid React batching issues
    const fileIds = filteredFiles.map(file => file.id)
    onSelectMultipleFiles(fileIds, !allSelected)
  }

  const handleFileSelect = (e, fileId, index) => {
    e.stopPropagation()

    console.log('🟡 FileList.handleFileSelect called for fileId:', fileId, 'index:', index)
    console.log('   shiftKey:', e.shiftKey, 'ctrlKey:', e.ctrlKey, 'metaKey:', e.metaKey)
    console.log('   lastSelectedIndex:', lastSelectedIndex)
    console.log('   sortedFiles.length:', sortedFiles.length)

    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift-click: select range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)

      console.log('   Shift-click range select from', start, 'to', end)

      // Collect all file IDs in the range
      const fileIdsInRange = []
      for (let i = start; i <= end; i++) {
        const file = sortedFiles[i]
        if (file) {
          fileIdsInRange.push(file.id)
          console.log('     - File at index', i, ':', file.id)
        }
      }

      console.log('   Total files in range:', fileIdsInRange.length)

      // Use bulk selection to avoid React batching issues
      onSelectMultipleFiles(fileIdsInRange, true)
      setLastSelectedIndex(index)
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click: toggle selection
      console.log('   Ctrl/Cmd-click toggle for:', fileId)
      onSelectFile(fileId)
      setLastSelectedIndex(index)
    } else {
      // Regular click: just toggle this file
      console.log('   Regular click toggle for:', fileId)
      onSelectFile(fileId)
      setLastSelectedIndex(index)
    }
  }

  const handleMouseDown = (e, fileId, index) => {
    if (e.button === 0 && e.target.type !== 'checkbox') { // Left mouse button, but not on checkbox
      setIsDragging(true)
      setDragStart(index)
      setDragEnd(index)
    }
  }

  const handleMouseEnter = (fileId, index) => {
    if (isDragging && dragStart !== null) {
      setDragEnd(index)
    }
  }

  // Apply drag selection changes
  useEffect(() => {
    if (isDragging && dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
      const start = Math.min(dragStart, dragEnd)
      const end = Math.max(dragStart, dragEnd)

      // Select all files in the range
      for (let i = start; i <= end; i++) {
        const file = sortedFiles[i]
        if (!selectedFiles.has(file.id)) {
          onSelectFile(file.id)
        }
      }
    }
  }, [dragEnd, isDragging, dragStart, sortedFiles, selectedFiles, onSelectFile])

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  return (
    <div className="file-list">
      <div className="file-list-header" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="col-checkbox">
          <input
            type="checkbox"
            ref={selectAllCheckboxRef}
            checked={filteredFiles.length > 0 && filteredFiles.every(file => selectedFiles.has(file.id))}
            onChange={handleSelectAll}
            onClick={(e) => e.stopPropagation()}
            title="Select all files"
          />
        </div>
        <div
          className={`col-original ${sortColumn === 'name' ? 'sorted' : ''}`}
          onClick={() => handleColumnSort('name')}
        >
          Original File {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
        </div>
        <div
          className={`col-proxy-path ${sortColumn === 'proxyPath' ? 'sorted' : ''}`}
          onClick={() => handleColumnSort('proxyPath')}
        >
          Proxy Path {sortColumn === 'proxyPath' && (sortDirection === 'asc' ? '▲' : '▼')}
        </div>
        <div
          className={`col-proxies ${sortColumn === 'preset' ? 'sorted' : ''}`}
          onClick={() => handleColumnSort('preset')}
        >
          Proxy Preset {sortColumn === 'preset' && (sortDirection === 'asc' ? '▲' : '▼')}
        </div>
      </div>

      <div className="file-list-body" onMouseLeave={handleMouseUp}>
        {sortedFiles.length === 0 ? (
          <div className="empty-state">
            <p>No files found. Please scan the original files folder.</p>
          </div>
        ) : (
          sortedFiles.map((file, index) => (
            <div
              key={file.id}
              className={`file-row ${selectedFiles.has(file.id) ? 'selected' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, file.id, index)}
              onMouseEnter={() => handleMouseEnter(file.id, index)}
              onMouseUp={handleMouseUp}
            >
              <div className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    // Use the shift key info captured from the onClick event
                    const modifiedEvent = {
                      ...e,
                      shiftKey: lastCheckboxClickRef.current.shiftKey,
                      ctrlKey: lastCheckboxClickRef.current.ctrlKey,
                      metaKey: lastCheckboxClickRef.current.metaKey,
                      stopPropagation: e.stopPropagation
                    }
                    console.log('Checkbox onChange - using captured keys - shiftKey:', modifiedEvent.shiftKey, 'ctrlKey:', modifiedEvent.ctrlKey)
                    handleFileSelect(modifiedEvent, file.id, index)
                  }}
                  onClick={(e) => {
                    // Capture the modifier keys from the click event
                    lastCheckboxClickRef.current = {
                      shiftKey: e.shiftKey,
                      ctrlKey: e.ctrlKey,
                      metaKey: e.metaKey
                    }
                    console.log('Checkbox onClick - captured keys - shiftKey:', e.shiftKey, 'ctrlKey:', e.ctrlKey)
                    e.stopPropagation()
                  }}
                />
              </div>
              <div className="col-original">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-resolution">{file.resolution}</span>
                  <span
                    className="file-path"
                    onClick={() => handleOpenInExplorer(file.path)}
                    title={`${originalPath}\\${file.relativePath || file.path}`}
                  >
                    *{originalPath}\\{file.relativePath || file.path}
                  </span>
                </div>
              </div>
              <div className="col-proxy-path">
                <span
                  className={`proxy-path-item ${hasProxyFile(file) ? 'proxy-exists' : 'proxy-missing'}`}
                  title={getProxyPath(file)}
                >
                  {getProxyPath(file)}
                </span>
              </div>
              <div className="col-proxies">
                <select
                  className="preset-dropdown"
                  value={presetOverrides[file.id] || presetAssignments[file.resolution] || ''}
                  onChange={(e) => {
                    onPresetOverride(file.id, e.target.value || null)
                  }}
                >
                  <option value="">Select preset...</option>
                  {Object.keys(presets).sort((a, b) => a.localeCompare(b)).map(presetName => (
                    <option key={presetName} value={presetName}>
                      {presetName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

