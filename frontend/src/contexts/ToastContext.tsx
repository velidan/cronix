import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Toast, { ToastType, ToastPosition } from '../components/Toast'

export interface ToastOptions {
  id?: string
  type?: ToastType
  title: string
  message?: string
  duration?: number
  position?: ToastPosition
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface ToastContextType {
  showToast: (options: ToastOptions) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
  success: (title: string, message?: string, options?: Partial<ToastOptions>) => string
  error: (title: string, message?: string, options?: Partial<ToastOptions>) => string
  warning: (title: string, message?: string, options?: Partial<ToastOptions>) => string
  info: (title: string, message?: string, options?: Partial<ToastOptions>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastItem extends Required<ToastOptions> {
  createdAt: number
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastCounter = useRef(0)

  const generateToastId = useCallback(() => {
    toastCounter.current += 1
    return `toast-${Date.now()}-${toastCounter.current}`
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((options: ToastOptions): string => {
    const id = options.id || generateToastId()
    const newToast: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 5000,
      position: options.position || 'top-right',
      action: options.action,
      dismissible: options.dismissible ?? true,
      createdAt: Date.now(),
    }

    setToasts((prev) => {
      // Remove duplicate toasts with same title and message
      const filtered = prev.filter(
        (t) => !(t.title === newToast.title && t.message === newToast.message)
      )
      // Limit to 5 toasts maximum
      const limited = filtered.slice(-4)
      return [...limited, newToast]
    })

    // Auto dismiss after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }

    return id
  }, [generateToastId, hideToast])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for different toast types
  const success = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>): string => {
      return showToast({ ...options, type: 'success', title, message })
    },
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>): string => {
      return showToast({ ...options, type: 'error', title, message, duration: options?.duration ?? 7000 })
    },
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>): string => {
      return showToast({ ...options, type: 'warning', title, message })
    },
    [showToast]
  )

  const info = useCallback(
    (title: string, message?: string, options?: Partial<ToastOptions>): string => {
      return showToast({ ...options, type: 'info', title, message })
    },
    [showToast]
  )

  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position
    if (!acc[position]) {
      acc[position] = []
    }
    acc[position].push(toast)
    return acc
  }, {} as Record<ToastPosition, ToastItem[]>)

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        clearAllToasts,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-50 pointer-events-none ${getPositionClasses(position as ToastPosition)}`}
        >
          <AnimatePresence mode="sync">
            {positionToasts.map((toast) => (
              <Toast
                key={toast.id}
                id={toast.id}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => hideToast(toast.id)}
                action={toast.action}
                dismissible={toast.dismissible}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </ToastContext.Provider>
  )
}

function getPositionClasses(position: ToastPosition): string {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4'
    case 'top-center':
      return 'top-4 left-1/2 -translate-x-1/2'
    case 'top-right':
      return 'top-4 right-4'
    case 'bottom-left':
      return 'bottom-4 left-4'
    case 'bottom-center':
      return 'bottom-4 left-1/2 -translate-x-1/2'
    case 'bottom-right':
      return 'bottom-4 right-4'
    default:
      return 'top-4 right-4'
  }
}