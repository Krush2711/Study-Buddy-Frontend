import { Suspense, lazy, useEffect } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { X } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { MarketingLayout } from '../layouts/MarketingLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { GuestRoute, ProtectedRoute } from './guards'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui/Feedback'

/* Route-level code splitting keeps the marketing bundle separate from the app. */
const LandingPage = lazy(() => import('../pages/LandingPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SignupPage = lazy(() => import('../pages/SignupPage'))
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const DashboardPage = lazy(() => import('../pages/app/DashboardPage'))
const TrackerPage = lazy(() => import('../pages/app/TrackerPage'))
const PlannerPage = lazy(() => import('../pages/app/PlannerPage'))
const RevisionPage = lazy(() => import('../pages/app/RevisionPage'))
const LibraryPage = lazy(() => import('../pages/app/LibraryPage'))
const NotesPage = lazy(() => import('../pages/app/NotesPage'))
const SettingsPage = lazy(() => import('../pages/app/SettingsPage'))

const AdminPage = lazy(() => import('../pages/admin/AdminPage'))

/* ------------------------------ Fallbacks ------------------------------ */

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[7.5rem] rounded-[var(--radius-card)]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
    </div>
  )
}

/** The section title is announced on navigation for screen-reader users. */
function RouteAnnouncer() {
  const location = useLocation()

  useEffect(() => {
    const main = document.getElementById('main-content') ?? document.getElementById('admin-main')
    main?.focus({ preventScroll: true })
  }, [location.pathname])

  return null
}

/**
 * Shown when a token was rejected mid-session. States what happened, and lets the
 * user dismiss rather than trapping them on a banner that never clears.
 */
function SessionExpiredNotice() {
  const { sessionExpired, clearSessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!sessionExpired) return null

  return (
    <div
      role="status"
      className="glass-float fixed left-1/2 top-20 z-[55] flex w-[min(92vw,26rem)] -translate-x-1/2 items-start gap-3 rounded-[0.875rem] px-4 py-3 animate-enter"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-medium text-ink">Your session expired</p>
        <p className="mt-0.5 text-[0.8125rem] text-ink-2">
          Sign in again to continue. Nothing you had already saved was lost.
        </p>
        <button
          type="button"
          onClick={() => {
            clearSessionExpired()
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
          }}
          className="mt-2 text-[0.8125rem] font-medium text-brand hover:underline"
        >
          Go to sign in
        </button>
      </div>
      <button
        type="button"
        onClick={clearSessionExpired}
        aria-label="Dismiss"
        className="rounded-md p-1 text-ink-3 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

/* -------------------------------- Routes ------------------------------- */

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <RouteAnnouncer />
      <SessionExpiredNotice />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Marketing */}
          <Route
            path="/"
            element={
              <MarketingLayout>
                <LandingPage />
              </MarketingLayout>
            }
          />

          {/* Authentication — guest-only */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            }
          />
          {/* Google redirect target. Not guest-guarded: it also clears a stale
              session after a failed OAuth round trip. */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Application */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/tracker"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TrackerPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/planner"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PlannerPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/revision"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RevisionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/library"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LibraryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/library/:documentId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LibraryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NotesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notes/:documentId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NotesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Administration. Intentionally NOT wrapped in ProtectedRoute — the
              admin scheme authenticates with an API key, not the user's JWT, and
              the backend is the only authority on access. */}
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminPage />
              </AdminLayout>
            }
          />

          {/* Legacy redirects from the demo's file names */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />

          <Route
            path="*"
            element={
              <MarketingLayout>
                <NotFoundPage />
              </MarketingLayout>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
