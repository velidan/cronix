import React from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  XCircle 
} from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  onClose: () => void
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  action,
  dismissible = true,
}) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  const colors = {
    success: 'bg-green-900/90 border-green-700 text-green-400',
    error: 'bg-red-900/90 border-red-700 text-red-400',
    warning: 'bg-yellow-900/90 border-yellow-700 text-yellow-400',
    info: 'bg-blue-900/90 border-blue-700 text-blue-400',
  }

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        pointer-events-auto mb-3 min-w-[320px] max-w-md rounded-lg 
        border backdrop-blur-sm shadow-lg ${colors[type]}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${iconColors[type]}`}>
            {icons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white break-words">
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm text-gray-300 break-words">
                {message}
              </p>
            )}
            {action && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    action.onClick()
                    onClose()
                  }}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline transition-colors"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          {dismissible && (
            <div className="flex-shrink-0">
              <button
                onClick={onClose}
                className="inline-flex rounded-md text-gray-400 hover:text-gray-200 focus:outline-none transition-colors p-0.5"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Toast