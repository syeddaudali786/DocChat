import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner'

// Native <dialog> gives us focus trapping and Escape-to-close for free.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && !busy && onClose()} // click on backdrop
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 dark:bg-red-950/60">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-semibold">
              {title}
            </h2>
            <p className="mt-1 text-sm break-words text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost" autoFocus>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 focus-visible:ring-4 focus-visible:ring-red-500/30 focus-visible:outline-none disabled:opacity-60"
          >
            {busy && <Spinner />} {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
