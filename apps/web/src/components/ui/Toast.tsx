import { useToastStore, ToastType } from '@/stores/toastStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ICON_MAP: Record<ToastType, any> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const COLOR_MAP: Record<ToastType, string> = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
}

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore()

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full sm:w-auto">
            {toasts.map((toast) => {
                const Icon = ICON_MAP[toast.type]
                return (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full ${COLOR_MAP[toast.type]}`}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
