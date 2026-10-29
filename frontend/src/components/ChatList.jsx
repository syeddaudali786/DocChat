import { MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from './ConfirmDialog'
import Skeleton from './Skeleton'
import Spinner from './Spinner'

export default function ChatList({ sessions, activeId, onSelect, onDeleted }) {
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState(null)

  async function confirmDelete() {
    const session = pendingDelete
    try {
      await sessions.remove(session.id)
      toast.success('Chat deleted.')
      onDeleted?.(session.id)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
    setPendingDelete(null)
  }

  if (sessions.loading) return <Skeleton rows={4} className="h-9" />

  if (sessions.error)
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
        {sessions.error}{' '}
        <button type="button" onClick={() => sessions.refresh()} className="font-semibold underline">
          Retry
        </button>
      </div>
    )

  if (!sessions.items.length)
    return <p className="px-1 py-2 text-sm text-slate-500 dark:text-slate-400">No chats yet. Ask a question to start one.</p>

  return (
    <>
      <ul className="space-y-0.5">
        {sessions.items.map((s) => {
          const active = s.id === activeId
          return (
            <li key={s.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={active ? 'true' : undefined}
                title={s.title}
                className={`flex w-full items-center gap-2.5 rounded-lg py-2 pr-9 pl-2.5 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  active
                    ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                <span className="truncate">{s.title}</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete(s)}
                aria-label={`Delete chat: ${s.title}`}
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1.5 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-red-950/40"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          )
        })}
      </ul>

      {sessions.hasMore && (
        <button type="button" onClick={sessions.loadMore} disabled={sessions.loadingMore} className="btn-ghost mt-2 w-full text-xs">
          {sessions.loadingMore && <Spinner className="size-3.5" />} Load more
        </button>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete chat?"
        message={`“${pendingDelete?.title}” and all its messages will be permanently deleted.`}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
