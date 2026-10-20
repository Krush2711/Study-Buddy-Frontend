import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Plus,
  Sparkles,
  StickyNote,
  Tag,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { knowledgeApi } from '../../services/api/knowledge'
import { useAsync } from '../../hooks/useAsync'
import { formatRelative, humanize } from '../../utils/format'
import { PageHeader } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/StatCard'
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui/Feedback'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const documents = useAsync(() => knowledgeApi.list({ timeline: 'all' }), [])
  const notes = useAsync(() => knowledgeApi.notes({ timeline: '30days' }), [])

  const docs = documents.data ?? []
  const noteCount =
    (notes.data?.detailedNotes.length ?? 0) + (notes.data?.shortNotes.length ?? 0)

  const subjects = useMemo(() => {
    const counts = new Map<string, number>()
    docs.forEach((doc) => {
      if (!doc.subject) return
      counts.set(doc.subject, (counts.get(doc.subject) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [docs])

  const recent = useMemo(
    () =>
      [...docs]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [docs],
  )

  const firstName = (profile?.fullName ?? user?.fullName ?? '').split(' ')[0]
  const totalSubjects = subjects.length
  const topSubject = subjects[0]
  const latestUpload = recent[0]

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Your uploaded documents, the subjects you are collecting, and the notes StudyBuddy wrote for you."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/app/library?upload=1')}
            iconLeft={<Plus size={16} aria-hidden="true" />}
          >
            Upload document
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {documents.initialLoading || notes.initialLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[7.5rem] rounded-[var(--radius-card)]" />
          ))
        ) : (
          <>
            <StatCard
              label="Documents"
              value={docs.length}
              icon={BookOpen}
              footNote={
                latestUpload
                  ? `Latest: ${formatRelative(latestUpload.createdAt)}`
                  : 'Nothing uploaded yet'
              }
            />
            <StatCard
              label="Subjects"
              value={totalSubjects}
              icon={Tag}
              footNote={topSubject ? `Most active: ${topSubject[0]}` : 'Add a subject on upload'}
            />
            <StatCard
              label="Notes (30 days)"
              value={noteCount}
              icon={StickyNote}
              footNote={`${notes.data?.detailedNotes.length ?? 0} detailed · ${
                notes.data?.shortNotes.length ?? 0
              } short`}
            />
            <StatCard
              label="Reading time"
              value={docs.reduce(
                (total, doc) => total + (doc.estimatedReadingTime || 0),
                0,
              )}
              suffix=" min"
              icon={CalendarDays}
              footNote="Across everything in your library"
            />
          </>
        )}
      </div>

      {documents.error ? (
        <div className="mt-4">
          <ErrorState
            error={documents.error}
            onRetry={() => void documents.refresh()}
            title="Could not load your library"
          />
        </div>
      ) : documents.initialLoading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[var(--radius-panel)] lg:col-span-2" />
          <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Sparkles size={22} aria-hidden="true" />}
            title="Start with one document"
            description="Upload a PDF, an image of your notes, or a source file. StudyBuddy extracts the text, summarises it and writes detailed and short notes you can revise from."
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/app/library?upload=1')}
                iconLeft={<Plus size={16} aria-hidden="true" />}
              >
                Upload your first document
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="card p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[1.0625rem]">Recent documents</h2>
              <Link
                to="/app/library"
                className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand hover:underline"
              >
                View all
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <ul className="mt-4 divide-y divide-[var(--line)]">
              {recent.map((doc) => (
                <li key={doc.id}>
                  <Link
                    to={`/app/library/${doc.id}`}
                    className="group flex items-center gap-3 rounded-[0.625rem] px-2 py-3 transition-colors duration-150 hover:bg-[var(--surface-2)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-[var(--brand-soft)] text-[var(--brand)]">
                      <FileText size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.875rem] font-medium text-ink">
                        {doc.fileName}
                      </p>
                      <p className="truncate text-[0.75rem] text-ink-3">
                        {[doc.subject, formatRelative(doc.createdAt)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {doc.difficulty ? (
                      <span className="hidden shrink-0 text-[0.75rem] text-ink-3 sm:block">
                        {humanize(doc.difficulty)}
                      </span>
                    ) : null}
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-[1.0625rem]">Subjects</h2>
            {subjects.length === 0 ? (
              <p className="mt-3 text-[0.875rem] text-ink-2">
                No subjects yet. Add one when you upload a document.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {subjects.slice(0, 6).map(([name, count]) => {
                  const share = Math.round((count / docs.length) * 100)
                  return (
                    <li key={name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[0.8125rem] text-ink-2">{name}</span>
                        <span className="numeric text-[0.75rem] text-ink-3">
                          {count}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand)]"
                          style={{ width: `${Math.max(6, share)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-5 border-t border-[var(--line)] pt-4">
              <Link
                to="/app/notes"
                className="flex items-center gap-2 text-[0.8125rem] font-medium text-brand hover:underline"
              >
                <StickyNote size={14} aria-hidden="true" />
                Read this month&apos;s notes
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
