import { useState } from 'react'
import '../styles/AutoRefreshControl.css'

export default function AutoRefreshControl({ onIntervalChange }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [interval, setInterval] = useState(5)
  const [autoSubmit, setAutoSubmit] = useState(false)

  const handleToggle = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    onIntervalChange(newEnabled ? interval : 0, autoSubmit)
  }

  const handleIntervalChange = (e) => {
    const newInterval = parseInt(e.target.value)
    setInterval(newInterval)
    if (isEnabled) {
      onIntervalChange(newInterval, autoSubmit)
    }
  }

  const handleAutoSubmitToggle = () => {
    const newAutoSubmit = !autoSubmit
    setAutoSubmit(newAutoSubmit)
    if (isEnabled) {
      onIntervalChange(interval, newAutoSubmit)
    }
  }

  return (
    <div className="auto-refresh-control">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
        />
        Auto Refresh
      </label>
      {isEnabled && (
        <div className="refresh-options">
          <div className="interval-input">
            <input
              type="number"
              min="1"
              max="60"
              value={interval}
              onChange={handleIntervalChange}
            />
            <span>minutes</span>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoSubmit}
              onChange={handleAutoSubmitToggle}
            />
            Auto Submit to AME
          </label>
        </div>
      )}
    </div>
  )
}

