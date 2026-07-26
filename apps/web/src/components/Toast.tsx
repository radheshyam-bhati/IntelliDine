interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss?: () => void
}

const styles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-900 text-white',
}

export default function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  return (
    <div className={`fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto rounded-lg px-4 py-3 text-sm text-center shadow-lg ${styles[type]}`}>
      <div className="flex items-center justify-center gap-2">
        <span>{message}</span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-white/70 hover:text-white ml-2" aria-label="Dismiss">
            &times;
          </button>
        )}
      </div>
    </div>
  )
}
