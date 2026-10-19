import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'
import { MARKETING_LINKS } from '../config/navigation'
import { useAuth } from '../context/AuthContext'

/**
 * Marketing chrome: a translucent bar that starts transparent over the hero and
 * gains a material once content scrolls beneath it, so the headline is never
 * competing with an opaque slab at the top of the page.
 */
export function MarketingLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-[0.875rem] focus:font-medium focus:text-ink focus:shadow-[var(--shadow-float)]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-300',
          scrolled
            ? 'glass-bar border-b border-[var(--line)]'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="StudyBuddy home" className="rounded-lg">
            <Logo size={28} />
          </Link>

          <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 md:flex">
            {MARKETING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-2.5 py-1.5 text-[0.875rem] font-medium text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <Link to="/app">
                <Button variant="primary" size="sm" iconRight={<ArrowRight size={15} />}>
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-3 py-2 text-[0.875rem] font-medium text-ink-2 transition-colors hover:text-ink sm:block"
                >
                  Sign in
                </Link>
                <Link to="/signup" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="btn btn-ghost !min-h-0 !p-0 !rounded-[0.625rem] text-ink-2 md:hidden"
              style={{ width: 36, height: 36 }}
            >
              {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile sheet: same content, same order as the desktop bar */}
        {menuOpen ? (
          <div className="glass-bar border-t border-[var(--line)] px-4 pb-4 pt-2 md:hidden">
            <nav aria-label="Sections" className="flex flex-col">
              {MARKETING_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2.5 py-2.5 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
              <div className="my-2 h-px bg-[var(--line)]" role="separator" />
              {isAuthenticated ? (
                <Link to="/app" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" block>
                    Open dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" block>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}>
                    <Button variant="primary" block>
                      Create an account
                    </Button>
                  </Link>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-[0.8125rem] text-ink-3">Appearance</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--glass)] backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <Logo size={26} />
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-2">
                An AI-powered study tracker and revision assistant. Track what you
                learn, turn documents into notes, and revisit ideas at the right time.
              </p>
            </div>

            <div className="flex gap-12">
              <nav aria-label="Product">
                <p className="text-micro mb-2 text-ink-3">Product</p>
                <ul className="space-y-1.5">
                  {MARKETING_LINKS.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-[0.875rem] text-ink-2 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav aria-label="Account">
                <p className="text-micro mb-2 text-ink-3">Account</p>
                <ul className="space-y-1.5">
                  <li>
                    <Link
                      to="/login"
                      className="text-[0.875rem] text-ink-2 transition-colors hover:text-ink"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signup"
                      className="text-[0.875rem] text-ink-2 transition-colors hover:text-ink"
                    >
                      Create account
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin"
                      className="text-[0.875rem] text-ink-2 transition-colors hover:text-ink"
                    >
                      Admin
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <p className="mt-8 border-t border-[var(--line)] pt-6 text-[0.8125rem] text-ink-3">
            StudyBuddy · Built with React, ASP.NET Core and FastAPI.
          </p>
        </div>
      </footer>
    </div>
  )
}
