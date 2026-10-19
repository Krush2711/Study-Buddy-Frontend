import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Logo } from '../components/ui/Logo'

/**
 * Deliberately distinct from the user-facing app: a neutral, denser surface so an
 * operator knows at a glance they are in a privileged area and not looking at
 * their own study data.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-[0.875rem] focus:font-medium focus:text-ink focus:shadow-[var(--shadow-float)]"
      >
        Skip to content
      </a>

      <header className="glass-bar sticky top-0 z-20 border-b border-[var(--line)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo size={26} />
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--warning)_35%,transparent)] bg-[var(--warning-soft)] px-2 py-0.5 text-[0.75rem] font-medium text-[var(--warning)]"
            aria-label="Administration area"
          >
            <ShieldAlert size={12} aria-hidden="true" />
            Admin
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/app"
              className="btn btn-ghost !min-h-8 !px-2.5 !text-[0.8125rem]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <main
        id="admin-main"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>

      <footer className="border-t border-[var(--line)] px-4 py-4 sm:px-6">
        <p className="mx-auto max-w-7xl text-[0.75rem] text-ink-3">
          Authorization is enforced by the backend through the X-Admin-Api-Key
          scheme. This interface is not a security boundary.
        </p>
      </footer>
    </div>
  )
}
