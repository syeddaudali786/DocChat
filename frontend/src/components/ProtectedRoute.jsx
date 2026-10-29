import { RefreshCw, WifiOff } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center text-indigo-600" role="status" aria-label="Loading">
      <Spinner className="size-8" />
    </div>
  )
}

function ServerUnreachable({ onRetry }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <WifiOff className="mx-auto size-10 text-slate-400" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold">Can&apos;t reach the server</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Check your connection and that the API is running, then try again.
        </p>
        <button type="button" onClick={onRetry} className="btn-primary mt-6">
          <RefreshCw className="size-4" aria-hidden="true" /> Retry
        </button>
      </div>
    </div>
  )
}

// Only for signed-in users; others go to /login and come back afterwards.
export function ProtectedRoute() {
  const { status, retry } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'error') return <ServerUnreachable onRetry={retry} />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

// Login/register pages: signed-in users are sent to the app.
export function PublicOnlyRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
