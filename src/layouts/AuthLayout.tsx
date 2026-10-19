import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'

/**
 * Shared frame for login / signup / the OAuth landing.
 *
 * Two columns on desktop: the form, and a quiet context panel that states what
 * the product does without duplicating the marketing page. Collapses to the form
 * alone on mobile — the panel is supporting material, never required to proceed.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="StudyBuddy home" className="rounded-lg">
          <Logo size={26} />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/"
            className="btn btn-ghost !min-h-8 !px-2.5 !text-[0.8125rem]"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Home
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-center lg:gap-16">
          <div className="mx-auto w-full max-w-[26rem]">
            <h1 className="text-[1.625rem] leading-tight tracking-[-0.018em]">{title}</h1>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{subtitle}</p>

            <div className="mt-7">{children}</div>

            <div className="mt-6 text-[0.875rem] text-ink-2">{footer}</div>
          </div>

          <aside className="hidden lg:block">
            <div className="panel glass-sheen relative overflow-hidden p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_70%)]"
              />
              <div className="relative">
                <p className="text-micro text-brand">What you get</p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-[1.5rem] leading-snug tracking-[-0.02em] text-ink">
                  A record of what you studied, and notes you can actually revise from.
                </p>

                <ul className="mt-6 space-y-4">
                  {[
                    {
                      title: 'Track sessions by subject and topic',
                      body: 'Duration, activity type and what you covered — searchable later.',
                    },
                    {
                      title: 'Turn documents into notes',
                      body: 'Extracted text becomes a summary, detailed notes and short revision notes.',
                    },
                    {
                      title: 'Know what to revise next',
                      body: 'A due queue built from the topics you have logged.',
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <span
                        className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-[0.875rem] font-medium text-ink">{item.title}</p>
                        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-2">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="px-4 py-5 text-center text-[0.75rem] text-ink-3 sm:px-6">
        StudyBuddy · an AI study tracker and revision assistant
      </footer>
    </div>
  )
}
