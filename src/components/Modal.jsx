import { createContext, useContext, useState, useCallback } from 'react'
import '../styles/Modal.css'

const ModalContext = createContext(null)

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
    onCancel: null,
  })

  const showModal = useCallback((options) => {
    setModalState({
      isOpen: true,
      title: options.title || 'ProxYoda',
      message: options.message || '',
      type: options.type || 'info',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    })
  }, [])

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const alert = useCallback((message, title = 'ProxYoda') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type: message.startsWith('✅') ? 'success' : message.startsWith('❌') ? 'error' : 'info',
        onConfirm: () => {
          hideModal()
          resolve(true)
        },
      })
    })
  }, [showModal, hideModal])

  const confirm = useCallback((message, title = 'Confirm') => {
    return new Promise((resolve) => {
      showModal({
        title,
        message,
        type: 'confirm',
        onConfirm: () => {
          hideModal()
          resolve(true)
        },
        onCancel: () => {
          hideModal()
          resolve(false)
        },
      })
    })
  }, [showModal, hideModal])

  return (
    <ModalContext.Provider value={{ showModal, hideModal, alert, confirm }}>
      {children}
      {modalState.isOpen && (
        <div className="modal-overlay" onClick={() => modalState.type !== 'confirm' && hideModal()}>
          <div className={`modal-container modal-${modalState.type}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalState.title}</h3>
              <button className="modal-close" onClick={hideModal}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalState.message}</p>
            </div>
            <div className="modal-footer">
              {modalState.type === 'confirm' ? (
                <>
                  <button className="modal-btn modal-btn-cancel" onClick={modalState.onCancel}>
                    Cancel
                  </button>
                  <button className="modal-btn modal-btn-confirm" onClick={modalState.onConfirm}>
                    OK
                  </button>
                </>
              ) : (
                <button className="modal-btn modal-btn-confirm" onClick={modalState.onConfirm}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

