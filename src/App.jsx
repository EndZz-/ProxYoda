import { useState, useEffect } from 'react'
import './App.css'
import SettingsPanel from './components/SettingsPanel'
import Dashboard from './components/Dashboard'
import { ModalProvider } from './components/Modal'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('proxySettings')
    return saved ? JSON.parse(saved) : {
      originalPath: '',
      proxyPath: '',
      resolutionMappings: {},
      presets: {},
    }
  })
  const [dirHandles, setDirHandles] = useState({
    original: null,
    proxy: null,
  })
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    localStorage.setItem('proxySettings', JSON.stringify(settings))
  }, [settings])

  return (
    <ModalProvider>
      <div className="app">
        <header className="app-header">
          <h1>ProxYoda - Video Proxy Manager</h1>
          <nav className="app-nav">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </header>

        <main className="app-main">
          {activeTab === 'dashboard' && (
            <Dashboard
              settings={settings}
              setSettings={setSettings}
              dirHandles={dirHandles}
              setDirHandles={setDirHandles}
              files={files}
              setFiles={setFiles}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              filter={filter}
              setFilter={setFilter}
              lastRefresh={lastRefresh}
              setLastRefresh={setLastRefresh}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              scanProgress={scanProgress}
              setScanProgress={setScanProgress}
            />
          )}
          {activeTab === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} />}
        </main>
      </div>
    </ModalProvider>
  )
}

export default App
