import { AlertCircle, ChevronUp, Menu, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import Skeleton from './Skeleton'
import Spinner from './Spinner'

function SearchScope({ documents, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="search-scope" className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">
        Search in
      </label>
      <select
        id="search-scope"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-44 py-2 pr-8 sm:w-56"
        aria-label="Search in"
      >
        <option value="">All my documents</option>
        {documents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.filename}
          </option>
        ))}
      </select>
    </div>
  )
}

function ErrorBanner({ error, onRetry, onNewChat, onDismiss }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-3xl animate-fade-in items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{error.message}</p>
      {error.status === 404 ? (
        <button type="button" onClick={onNewChat} className="font-semibold whitespace-nowrap underline">
          New chat
        </button>
      ) : (
        error.question && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-semibold whitespace-nowrap underline">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Retry
          </button>
        )
      )}
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900/40">
        <X className="size-4" />
      </button>
    </div>
  )
}

export default function ChatWindow({ chat, docs, scope, onScopeChange, onOpenSidebar, onNewChat }) {
  const scrollRef = useRef(null)
  const hasReadyDocs = docs.readyDocuments.length > 0
  const lastId = chat.messages.at(-1)?.id

  // Scroll to the newest message (not when older ones are prepended).
  useEffect(() => {
    const el = scrollRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [lastId, chat.sending, chat.error])

  const send = (question) => chat.send(question, scope || null)
  const showEmpty = !chat.loadingMessages && chat.messages.length === 0 && !chat.sending

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <button type="button" onClick={onOpenSidebar} aria-label="Open sidebar" className="btn-ghost size-9 p-0 lg:hidden">
          <Menu className="size-5" />
        </button>
        <h1 className="flex-1 truncate text-base font-semibold sm:text-lg">Ask your documents</h1>
        <SearchScope documents={docs.readyDocuments} value={scope} onChange={onScopeChange} />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite" aria-busy={chat.sending}>
        {chat.loadingMessages ? (
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
            <Skeleton rows={1} className="ml-auto h-10 w-2/3" />
            <Skeleton rows={1} className="h-28 w-4/5" />
            <Skeleton rows={1} className="ml-auto h-10 w-1/2" />
          </div>
        ) : showEmpty ? (
          <EmptyState
            hasReadyDocs={hasReadyDocs}
            hasAnyDocs={docs.items.length > 0}
            onAsk={send}
            onOpenSidebar={onOpenSidebar}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            {chat.hasEarlier && (
              <div className="text-center">
                <button type="button" onClick={chat.loadEarlier} disabled={chat.loadingEarlier} className="btn-ghost text-xs">
                  {chat.loadingEarlier ? <Spinner className="size-3.5" /> : <ChevronUp className="size-3.5" aria-hidden="true" />}
                  Load earlier messages
                </button>
              </div>
            )}
            {chat.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {chat.sending && <TypingIndicator />}
          </div>
        )}
        {chat.error && (
          <div className="px-4 pb-6">
            <ErrorBanner error={chat.error} onRetry={chat.retry} onNewChat={onNewChat} onDismiss={chat.dismissError} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={send}
        sending={chat.sending}
        disabled={!hasReadyDocs}
        disabledReason={
          docs.loading
            ? 'Loading your documents…'
            : docs.items.length
              ? 'Wait until at least one document is ready to ask questions.'
              : 'Upload a PDF in the sidebar to start asking questions.'
        }
      />
    </div>
  )
}
