import { AlertCircle, CheckCircle2, FileText, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from './ConfirmDialog'
import Skeleton from './Skeleton'
import Spinner from './Spinner'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function StatusBadge({ status }) {
  if (status === 'processing')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Processing
      </span>
    )
  if (status === 'ready')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        <CheckCircle2 className="size-3" aria-hidden="true" /> Ready
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
      <AlertCircle className="size-3" aria-hidden="true" /> Failed
    </span>
  )
}

export default function DocumentList({ docs, onDeleted }) {
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState(null)

  async function confirmDelete() {
    const doc = pendingDelete
    try {
      await docs.remove(doc.id)
      toast.success(`Deleted “${doc.filename}”.`)
      onDeleted?.(doc.id)
      setPendingDelete(null)
    } catch (err) {
      toast.error(getErrorMessage(err, { 409: 'This document is still processing. Try again shortly.' }))
      setPendingDelete(null)
    }
  }

  if (docs.loading) return <Skeleton rows={3} className="h-16" />

  if (docs.error)
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
        {docs.error}{' '}
        <button type="button" onClick={docs.reload} className="font-semibold underline">
          Retry
        </button>
      </div>
    )

  if (!docs.items.length)
    return <p className="px-1 py-2 text-sm text-slate-500 dark:text-slate-400">No documents yet. Upload a PDF to get started.</p>

  return (
    <>
      <ul className="space-y-1.5">
        {docs.items.map((doc) => (
          <li
            key={doc.id}
            className="group rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={doc.filename}>
                  {doc.filename}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusBadge status={doc.status} />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                    {doc.status === 'ready' && ` · ${doc.chunk_count} chunks`} · {formatSize(doc.size_bytes)}
                  </span>
                </div>
                {doc.status === 'failed' && doc.error_message && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{doc.error_message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPendingDelete(doc)}
                disabled={doc.status === 'processing'}
                aria-label={`Delete ${doc.filename}`}
                title={doc.status === 'processing' ? 'Wait for processing to finish' : 'Delete'}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {docs.hasMore && (
        <button type="button" onClick={docs.loadMore} disabled={docs.loadingMore} className="btn-ghost mt-2 w-full text-xs">
          {docs.loadingMore && <Spinner className="size-3.5" />} Load more ({docs.total - docs.items.length} more)
        </button>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete document?"
        message={`“${pendingDelete?.filename}” and its search index will be removed. Past answers keep their sources.`}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
