import { LogOut, Plus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ChatList from './ChatList'
import DocumentList from './DocumentList'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import UploadBox from './UploadBox'

function SectionTitle({ children, count }) {
  return (
    <h2 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
      {children}
      {count > 0 && <span className="font-medium normal-case">{count}</span>}
    </h2>
  )
}

export default function Sidebar({ docs, sessions, activeSessionId, onNewChat, onSelectSession, onSessionDeleted, onDocumentDeleted, onClose }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button type="button" onClick={onClose} aria-label="Close sidebar" className="btn-ghost size-9 p-0 lg:hidden">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <section aria-labelledby="docs-heading">
          <SectionTitle count={docs.total}>
            <span id="docs-heading">Documents</span>
          </SectionTitle>
          <UploadBox onUpload={docs.upload} />
          <div className="mt-3">
            <DocumentList docs={docs} onDeleted={onDocumentDeleted} />
          </div>
        </section>

        <section aria-labelledby="chats-heading">
          <SectionTitle>
            <span id="chats-heading">Chats</span>
          </SectionTitle>
          <button
            type="button"
            onClick={onNewChat}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:ring-4 focus-visible:ring-indigo-500/30 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
          >
            <Plus className="size-4" aria-hidden="true" /> New chat
          </button>
          <ChatList sessions={sessions} activeId={activeSessionId} onSelect={onSelectSession} onDeleted={onSessionDeleted} />
        </section>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white uppercase"
        >
          {user.email[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Signed in as</p>
          <p className="truncate text-sm font-medium" title={user.email}>
            {user.email}
          </p>
        </div>
        <button type="button" onClick={logout} aria-label="Log out" title="Log out" className="btn-ghost size-9 p-0">
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )
}
