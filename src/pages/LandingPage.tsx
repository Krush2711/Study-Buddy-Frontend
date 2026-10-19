import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  FileSearch,
  Flame,
  LineChart,
  NotebookPen,
  Repeat2,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'

/**
 * Typewriter for the hero's rotating phrase.
 *
 * Kept from the original demo (it was the one piece of personality on that page)
 * but rebuilt: the loop is cancelled on unmount, the full phrase is exposed to
 * assistive tech once, and reduced-motion users see a single static phrase
 * instead of a 100ms-per-character loop.
 */
const PHRASES = [
  'revision plan.',
  'research library.',
  'learning memory.',
  'study operating system.',
]

export function HeroTypewriter() {
  const reducedMotion = usePrefersReducedMotion()
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState(PHRASES[0])

  useEffect(() => {
    if (reducedMotion) {
      setText(PHRASES[0])
      return
    }

    let cancelled = false
    let timer = 0
    let letter = 0
    let current = 0
    let deleting = false

    const tick = () => {
      if (cancelled) return
      const phrase = PHRASES[current]

      if (!deleting) {
        letter += 1
        setText(phrase.slice(0, letter))
        setPhraseIndex(current)
        if (letter === phrase.length) {
          deleting = true
          // Hold the finished phrase long enough to read it.
          timer = window.setTimeout(tick, 2100)
          return
        }
        timer = window.setTimeout(tick, 52)
        return
      }

      letter -= 1
      setText(phrase.slice(0, Math.max(0, letter)))
      if (letter <= 0) {
        deleting = false
        current = (current + 1) % PHRASES.length
        timer = window.setTimeout(tick, 240)
        return
      }
      timer = window.setTimeout(tick, 26)
    }

    timer = window.setTimeout(tick, 900)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [reducedMotion])

  return (
    <span className="inline-flex items-baseline">
      <span
        className="brand-gradient-text"
        // The visible text changes constantly; announce the current phrase once.
        aria-hidden="true"
      >
        {text}
      </span>
      <span className="sr-only">{PHRASES[phraseIndex]}</span>
      {!reducedMotion ? (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[0.08em] bg-brand motion-safe:animate-[sb-caret_1s_steps(2,end)_infinite]"
        />
      ) : null}
    </span>
  )
}

/* ---------------------------- Product preview -------------------------- */

const WEEK = [
  { day: 'Mon', value: 62 },
  { day: 'Tue', value: 88 },
  { day: 'Wed', value: 41 },
  { day: 'Thu', value: 74 },
  { day: 'Fri', value: 96 },
  { day: 'Sat', value: 55 },
  { day: 'Sun', value: 30 },
]

/**
 * A composed still-life of the real product surfaces. It is explicitly labelled a
 * preview — the numbers are illustrative and the app never implies otherwise.
 */
function ProductPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(58%_58%_at_50%_30%,color-mix(in_oklab,var(--brand)_20%,transparent),transparent_72%)] blur-2xl"
      />

      <div className="panel glass-sheen relative overflow-hidden p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-micro text-ink-3">This week</p>
            <p className="mt-1 text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-ink">
              6h 12m
            </p>
          </div>
          <span className="rounded-full border border-[color-mix(in_oklab,var(--success)_22%,transparent)] bg-[var(--success-soft)] px-2 py-0.5 text-[0.75rem] font-medium text-[var(--success)]">
            +18% vs last week
          </span>
        </div>

        <div className="flex h-24 items-end gap-2" aria-hidden="true">
          {WEEK.map((entry) => (
            <div key={entry.day} className="flex h-full flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-[3px] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--brand)_88%,white),var(--brand))] shadow-[0_3px_8px_-3px_color-mix(in_oklab,var(--brand)_50%,transparent)]"
                  style={{ height: `${entry.value}%` }}
                />
              </div>
              <span className="text-[0.625rem] text-ink-3">{entry.day}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
          {[
            { icon: NotebookPen, label: 'Detailed notes ready', meta: 'Operating Systems.pdf' },
            { icon: Repeat2, label: 'Revision due today', meta: 'Binary search · React hooks' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className="icon-tile flex h-7 w-7 items-center justify-center rounded-lg">
                <row.icon size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink">{row.label}</p>
                <p className="truncate text-[0.75rem] text-ink-3">{row.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating glass chips: the layering is what sells the material. */}
      <div className="glass-float animate-enter absolute -left-5 top-[36%] z-10 hidden items-center gap-2.5 rounded-[1rem] px-3.5 py-2.5 sm:flex [--enter-delay:340ms]">
        <span className="icon-tile h-8 w-8 rounded-[0.625rem]">
          <Flame size={15} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.75rem] font-semibold leading-tight text-ink">12-day streak</p>
          <p className="text-[0.6875rem] text-ink-3">Personal best</p>
        </div>
      </div>

      <div className="glass-float animate-enter absolute -top-5 -right-3 z-10 hidden items-center gap-2.5 rounded-[1rem] px-3.5 py-2.5 sm:flex [--enter-delay:460ms]">
        <span className="icon-tile h-8 w-8 rounded-[0.625rem]">
          <NotebookPen size={15} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.75rem] font-semibold leading-tight text-ink">Short notes ready</p>
          <p className="text-[0.6875rem] text-ink-3">9 concepts · 3 mnemonics</p>
        </div>
      </div>

      <p className="mt-2 text-center text-[0.6875rem] text-ink-3">
        Representative preview — not your data
      </p>
    </div>
  )
}

/* ------------------------------- Content ------------------------------- */

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: 'Track every learning activity',
    body: 'Log coding sessions, lectures, handwritten notes, research papers and problem sets against the subject and topic they belong to.',
  },
  {
    icon: Sparkles,
    title: 'Documents become notes',
    body: 'Upload a paper, PDF or screenshot. StudyBuddy extracts the text, summarises it, and writes detailed and short notes you can revise from.',
  },
  {
    icon: BrainCircuit,
    title: 'AI study planning',
    body: 'Turn a goal and a deadline into a week-by-week roadmap with daily tasks and realistic time estimates.',
  },
  {
    icon: Repeat2,
    title: 'Revision at the right time',
    body: 'Review queues surface what is due and what is slipping, so revision follows your forgetting curve rather than your mood.',
  },
  {
    icon: LineChart,
    title: 'Learning analytics',
    body: 'See hours, consistency and topic coverage across the week and month — and where the gaps are.',
  },
  {
    icon: FileSearch,
    title: 'A searchable knowledge library',
    body: 'Every document you upload stays retrievable, with its extracted text, concepts and keywords attached.',
  },
]

const STEPS = [
  {
    title: 'Capture',
    body: 'Log a session or upload the paper, notes or screenshot you just worked through.',
  },
  {
    title: 'Understand',
    body: 'StudyBuddy extracts the text and generates a summary, detailed notes and short revision notes.',
  },
  {
    title: 'Plan',
    body: 'Generate a roadmap from your goal, available hours and target date.',
  },
  {
    title: 'Revise',
    body: 'Work the queue. Regenerate notes or mind maps whenever a topic needs another pass.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* --------------------------------- Hero -------------------------------- */}
      <section className="relative overflow-hidden pt-28 sm:pt-32">
        {/* Soft light from the top — static, never a full-viewport moving background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(62%_48%_at_50%_-6%,color-mix(in_oklab,var(--brand)_17%,transparent),transparent_74%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--brand)_12%,transparent),transparent_68%)] blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:pb-24">
          <div className="animate-enter">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-1 text-[0.75rem] font-medium text-ink-2 shadow-[inset_0_1px_0_var(--glass-edge)] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
              AI study tracking · research revision
            </p>

            <h1 className="display mt-5">
              Your personal <br className="hidden sm:block" />
              <HeroTypewriter />
            </h1>

            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
              StudyBuddy records what you actually study, turns your documents into
              notes you can revise from, and tells you what to revisit next. Built for
              people learning seriously on their own.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button variant="primary" size="lg" iconRight={<ArrowRight size={17} />}>
                  Start tracking free
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See how it works
                </Button>
              </a>
            </div>

            <p className="mt-4 text-[0.8125rem] text-ink-3">
              No credit card. Your documents stay in your own account.
            </p>
          </div>

          <div className="animate-enter [--enter-delay:120ms]">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* ------------------------------- Features ------------------------------ */}
      <section id="features" className="scroll-mt-24 border-t border-[var(--line)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-micro text-brand">Everything in one place</p>
            <h2 className="display-sm mt-3">Built for the way studying actually goes</h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
              Not another timer. StudyBuddy keeps the record of what you learned and
              closes the loop from reading to revising.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                className="card card-lift animate-enter p-5"
                style={{ '--enter-delay': `${index * 45}ms` } as React.CSSProperties}
              >
                <span className="icon-tile flex h-9 w-9 items-center justify-center rounded-[0.625rem]">
                  <feature.icon size={17} aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-[1rem] font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-2">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------- How it works ---------------------------- */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-2)_42%,transparent)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-micro text-brand">How it works</p>
            <h2 className="display-sm mt-3">Four steps, repeated until it sticks</h2>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="card card-lift animate-enter relative p-5"
                style={{ '--enter-delay': `${index * 55}ms` } as React.CSSProperties}
              >
                <span
                  className="numeric flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-[0.8125rem] font-semibold text-[var(--brand-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_14px_-8px_color-mix(in_oklab,var(--brand)_60%,transparent)]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3.5 text-[1rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-2">{step.body}</p>
                {index < STEPS.length - 1 ? (
                  <ArrowRight
                    aria-hidden="true"
                    size={16}
                    className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-ink-3 lg:block"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------- AI ----------------------------------- */}
      <section id="ai" className="scroll-mt-24 border-t border-[var(--line)] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-micro text-brand">AI-powered</p>
            <h2 className="display-sm mt-3">
              Summaries, notes and revision material from your own documents
            </h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
              Upload a research paper or your own notes. StudyBuddy extracts the text,
              then produces a structured summary, detailed notes with sections and
              examples, short revision notes, and an optional mind map — all grounded
              in the document you supplied.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Structured summaries with topics, concepts and difficulty',
                'Detailed notes: sections, examples, best practices, common mistakes',
                'Short notes: key concepts, formulas, mnemonics and a revision checklist',
                'Mind maps rendered from the notes you generated',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.9375rem] text-ink-2">
                  <span
                    className="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-[0.75rem] border border-[var(--line)] bg-[var(--surface-2)]/60 p-3 text-[0.8125rem] leading-relaxed text-ink-2">
              Generation runs on the study material you upload. Always check AI output
              against the source before you rely on it.
            </p>
          </div>

          <div className="panel glass-sheen overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand-soft)] text-[var(--brand)]">
                <NotebookPen size={13} aria-hidden="true" />
              </span>
              <p className="text-[0.8125rem] font-medium text-ink">Detailed notes</p>
              <span className="ml-auto rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[0.6875rem] text-ink-3">
                from Operating Systems.pdf
              </span>
            </div>
            <div className="space-y-3 p-4">
              {[
                { heading: 'Overview', lines: [92, 78] },
                { heading: 'Key sections', lines: [86, 94, 62] },
                { heading: 'Common mistakes', lines: [74, 58] },
              ].map((block) => (
                <div key={block.heading}>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-ink-3">
                    {block.heading}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {block.lines.map((width, index) => (
                      <div
                        key={index}
                        aria-hidden="true"
                        className="h-2 rounded-full bg-[var(--surface-2)]"
                        style={{ width: `${width}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[0.6875rem] text-ink-3">
                Structure of a generated note. Length and content depend on your document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA ---------------------------------- */}
      <section className="border-t border-[var(--line)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="panel glass-sheen relative overflow-hidden px-6 py-12 text-center sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklab,var(--brand)_16%,transparent),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="display-sm mx-auto max-w-2xl">
                Start with one session. Build a record you can revise from.
              </h2>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/signup">
                  <Button variant="primary" size="lg" iconRight={<ArrowRight size={17} />}>
                    Create your account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    I already have one
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
