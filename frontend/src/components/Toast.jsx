import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const STYLES = {
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  error: { icon: XCircle, color: 'text-red-500' },
  info: { icon: Info, color: 'text-indigo-500' },
}

export default function Toast({ type, message, onDismiss }) {
  const { icon: Icon, color } = STYLES[type] ?? STYLES.info
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} aria-hidden="true" />
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded-md p-0.5 text-slate-400 transition hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:hover:text-slate-200"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
