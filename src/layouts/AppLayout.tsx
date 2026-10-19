import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { NAV_SECTIONS } from '../config/navigation'
import { Logo } from '../components/ui/Logo'
import { Avatar } from '../components/ui/Avatar'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useBreakpoint } from '../hooks/useMediaQuery'

const COLLAPSE_KEY = 'studybuddy.sidebar-collapsed'

/* ------------------------------ Nav links ------------------------------ */

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: (typeof NAV_SECTIONS)[number]['items'][number]
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/app'}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-[0.625rem] px-3 py-2 text-[0.875rem] font-medium',
            'transition-[background-color,color] duration-150',
            collapsed && 'justify-center px-0',
            isActive
              ? 'bg-[var(--sidebar-sel)] text-[var(--sidebar-ink)]'
              : 'text-[var(--sidebar-ink-2)] hover:bg-[color-mix(in_oklab,var(--sidebar-sel)_65%,transparent)] hover:text-[var(--sidebar-ink)]',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active marker: a clay bar, not a color-only cue */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand)] transition-opacity duration-150',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            />
            <Icon
              size={18}
              aria-hidden="true"
              className={cn(
                'shrink-0 transition-transform duration-200 ease-[var(--ease-decelerate)]',
                !isActive && 'group-hover:scale-[1.06]',
              )}
            />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
            {collapsed ? <span className="sr-only">{item.label}</span> : null}
          </>
        )}
      </NavLink>
    </li>
  )
}

/* ------------------------------- Sidebar ------------------------------- */

function SidebarContent({
  collapsed,
  onNavigate,
  onToggleCollapse,
  showCollapseButton,
}: {
  collapsed: boolean
  onNavigate?: () => void
  onToggleCollapse?: () => void
  showCollapseButton: boolean
}) {
  const { profile, user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex h-16 items-center border-b border-[var(--sidebar-line)] px-4',
          collapsed ? 'justify-center px-0' : 'justify-between',
        )}
      >
        <Link
          to="/app"
          onClick={onNavigate}
          className="rounded-lg focus-visible:outline-offset-4"
          aria-label="StudyBuddy dashboard"
        >
          <Logo size={26} showWordmark={!collapsed} />
        </Link>
        {!collapsed && showCollapseButton ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-[var(--sidebar-ink-2)] transition-colors hover:bg-[var(--sidebar-sel)] hover:text-[var(--sidebar-ink)]"
          >
            <PanelLeftClose size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Main"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-4 [scrollbar-width:thin]"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-4 last:mb-0">
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-[color-mix(in_oklab,var(--sidebar-ink-2)_75%,transparent)]">
                {section.label}
              </p>
            ) : (
              <div
                aria-hidden="true"
                className="mx-auto mb-2 h-px w-6 bg-[var(--sidebar-line)]"
              />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemLink
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--sidebar-line)] p-2">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-[0.625rem] p-2',
            collapsed && 'justify-center p-0 py-2',
          )}
        >
          <Avatar
            name={profile?.fullName ?? user?.fullName}
            src={profile?.profileImageUrl}
            size={collapsed ? 28 : 32}
          />
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-[var(--sidebar-ink)]">
                  {profile?.fullName ?? user?.fullName ?? 'Signed in'}
                </p>
                <p className="truncate text-[0.75rem] text-[var(--sidebar-ink-2)]">
                  {profile?.email ?? user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-md p-1.5 text-[var(--sidebar-ink-2)] transition-colors hover:bg-[var(--sidebar-sel)] hover:text-[var(--sidebar-ink)]"
              >
                <LogOut size={15} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        {showCollapseButton && collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="mt-1 flex w-full items-center justify-center rounded-md py-2 text-[var(--sidebar-ink-2)] transition-colors hover:bg-[var(--sidebar-sel)] hover:text-[var(--sidebar-ink)]"
          >
            <PanelLeftOpen size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------ User menu ------------------------------ */

function UserMenu() {
  const { profile, user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center rounded-full transition-transform duration-150 active:scale-95"
      >
        <Avatar
          name={profile?.fullName ?? user?.fullName}
          src={profile?.profileImageUrl}
          size={32}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          // Anchored to the trigger, not the viewport centre
          className="glass-float absolute right-0 top-[calc(100%+0.5rem)] w-60 origin-top-right rounded-[0.875rem] p-1.5 transition-[opacity,translate,scale] duration-150 ease-[var(--ease-decelerate)] motion-reduce:transition-none starting:opacity-0 starting:-translate-y-1 starting:scale-[0.97]"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-[0.875rem] font-medium text-ink">
              {profile?.fullName ?? user?.fullName ?? 'Signed in'}
            </p>
            <p className="truncate text-[0.8125rem] text-ink-2">
              {profile?.email ?? user?.email}
            </p>
          </div>
          <div className="my-1 h-px bg-[var(--line)]" role="separator" />
          <Link
            to="/app/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[0.5rem] px-2.5 py-2 text-[0.875rem] text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
          >
            <UserRound size={15} aria-hidden="true" />
            Profile & settings
          </Link>
          <Link
            to="/app/settings#connections"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[0.5rem] px-2.5 py-2 text-[0.875rem] text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
          >
            <Settings size={15} aria-hidden="true" />
            Connections
          </Link>
          <Link
            to="/admin"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-[0.5rem] px-2.5 py-2 text-[0.875rem] text-ink-2 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
          >
            <Shield size={15} aria-hidden="true" />
            Admin panel
          </Link>
          <div className="my-1 h-px bg-[var(--line)]" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-[0.5rem] px-2.5 py-2 text-[0.875rem] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------ App shell ------------------------------ */

/**
 * Layout for every authenticated page.
 *
 * Desktop: a persistent translucent rail that content scrolls beneath. The rail
 * collapses to icons and remembers that choice.
 * Mobile: the same nav in an edge drawer that enters and exits from the left.
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpoint()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next))
      } catch {
        /* no-op */
      }
      return next
    })
  }

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Escape closes the drawer; body scroll is locked while it is open.
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  // Scroll to top on navigation, and fade the top edge once content has moved
  // under the floating header. The document is the scroll container here — not
  // <main>, which grows with its content.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    setScrolled(window.scrollY > 4)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const railWidth = collapsed ? '4.75rem' : '16.5rem'

  return (
    <div className="min-h-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-[0.875rem] focus:font-medium focus:text-ink focus:shadow-[var(--shadow-float)]"
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      {isDesktop ? (
        <aside
          className="glass-sidebar fixed inset-y-0 left-0 z-30 border-r border-[var(--sidebar-line)] transition-[width] duration-300 ease-[var(--ease-decelerate)] motion-reduce:transition-none"
          style={{ width: railWidth }}
        >
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
            showCollapseButton
          />
        </aside>
      ) : null}

      {/* Mobile drawer */}
      {!isDesktop ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'fixed inset-0 z-40 bg-[var(--scrim)] transition-opacity duration-200',
              mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
          <aside
            id="mobile-navigation"
            aria-hidden={!mobileOpen}
            className={cn(
              'glass-sidebar fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-[var(--sidebar-line)]',
              'transition-[translate] duration-200 ease-[var(--ease-decelerate)] motion-reduce:transition-none',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-1.5 text-[var(--sidebar-ink-2)] transition-colors hover:bg-[var(--sidebar-sel)] hover:text-[var(--sidebar-ink)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              showCollapseButton={false}
            />
          </aside>
        </>
      ) : null}

      {/* Content column */}
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-[var(--ease-decelerate)] motion-reduce:transition-none"
        style={{ paddingLeft: isDesktop ? railWidth : 0 }}
      >
        <header
          className={cn(
            'glass-bar sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--line)] px-4 sm:px-6',
            scrolled && 'edge-fade',
          )}
        >
          {!isDesktop ? (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-controls="mobile-navigation"
              aria-expanded={mobileOpen}
              className="btn btn-ghost !min-h-0 !p-0 !rounded-[0.625rem] text-ink-2"
              style={{ width: 36, height: 36 }}
            >
              <Menu size={19} aria-hidden="true" />
            </button>
          ) : (
            <Link
              to="/app"
              className="hidden text-[0.8125rem] text-ink-3 transition-colors hover:text-ink sm:block"
            >
              StudyBuddy
            </Link>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <div className="mx-1 h-5 w-px bg-[var(--line)]" aria-hidden="true" />
            <UserMenu />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[86rem] flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          {/* Route change: a short fade-rise bridges the swap so screens don't
              teleport. Keyed on pathname so it replays on every navigation. */}
          <div
            key={location.pathname}
            className="animate-enter [animation-duration:280ms] motion-reduce:animate-none"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Small breadcrumb used by detail pages. */
export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:text-ink"
    >
      <ChevronLeft size={14} aria-hidden="true" />
      {children}
    </Link>
  )
}
