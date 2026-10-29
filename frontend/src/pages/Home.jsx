import { useCallback, useEffect, useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import Sidebar from '../components/Sidebar'
import useChat from '../hooks/useChat'
import useDocuments from '../hooks/useDocuments'
import useSessions from '../hooks/useSessions'

export default function Home() {
  const docs = useDocuments()
  const sessions = useSessions()
  const refreshSessions = sessions.refresh
  const chat = useChat({ onSessionChanged: useCallback(() => refreshSessions({ silent: true }), [refreshSessions]) })
  const [scope, setScope] = useState('') // '' = all documents, otherwise a ready document id
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Fall back to "all documents" if the selected one is deleted or no longer ready.
  useEffect(() => {
    if (scope && !docs.readyDocuments.some((d) => d.id === scope)) setScope('')
  }, [scope, docs.readyDocuments])

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  function newChat() {
    chat.newChat()
    setDrawerOpen(false)
  }

  function selectSession(id) {
    if (id !== chat.sessionId) chat.openSession(id)
    setDrawerOpen(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar: static on desktop, slide-in drawer on mobile */}
      <aside
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-[85vw] max-w-80 border-r border-slate-200 shadow-2xl transition-[translate,visibility] duration-300 lg:visible lg:static lg:w-80 lg:translate-x-0 lg:shadow-none dark:border-slate-800 ${
          drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full' // invisible keeps it out of the tab order
        }`}
      >
        <Sidebar
          docs={docs}
          sessions={sessions}
          activeSessionId={chat.sessionId}
          onNewChat={newChat}
          onSelectSession={selectSession}
          onSessionDeleted={(id) => id === chat.sessionId && chat.newChat()}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      <main className="flex min-w-0 flex-1">
        <ChatWindow
          chat={chat}
          docs={docs}
          scope={scope}
          onScopeChange={setScope}
          onOpenSidebar={() => setDrawerOpen(true)}
          onNewChat={newChat}
        />
      </main>
    </div>
  )
}
