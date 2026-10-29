import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Register from './pages/Register'

// The app page (markdown rendering etc.) loads separately so the sign-in page stays light.
const Home = lazy(() => import('./pages/Home'))

const pageLoader = (
  <div className="grid min-h-dvh place-items-center text-indigo-600" role="status" aria-label="Loading">
    <Spinner className="size-8" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={pageLoader}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
