import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenCheck,
  FileText,
  ListChecks,
  Quote,
  StickyNote,
  Tag,
} from 'lucide-react'
import { knowledgeApi } from '../../services/api/knowledge'
import type {
  DetailedNotesDocument,
  KnowledgeTimeline,
  ShortNotesDocument,
} from '../../services/api/types'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { PageHeader } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui/Feedback'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { formatRelative, humanize } from '../../utils/format'

const TIMELINE_OPTIONS: Array<{ value: KnowledgeTimeline; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

type NoteKind = 'detailed' | 'short'

/**
 * Notes are generated during upload and persisted server-side.
 * GET /api/knowledge/notes returns both collections for the selected window.
 */
export default function NotesPage() {
  const { documentId } = useParams()
  return documentId ? <NoteDetail documentId={documentId} /> : <NotesList />
}

/* ------------------------------- List ---------------------------------- */

function NotesList() {
  const navigate = useNavigate()
  const [timeline, setTimeline] = useState<KnowledgeTimeline>('30days')
  const [subjectInput, setSubjectInput] = useState('')
  const subject = useDebouncedValue(subjectInput.trim(), 350)
  const [kind, setKind] = useState<NoteKind>('detailed')

  const { data, error, initialLoading, refresh } = useAsync(
    () =>
      knowledgeApi.notes({
        timeline,
        ...(subject ? { subject } : {}),
      }),
    [timeline, subject],
  )

  const detailed = data?.detailedNotes ?? []
  const short = data?.shortNotes ?? []
  const active = kind === 'detailed' ? detailed : short

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Detailed and short notes StudyBuddy wrote from the documents you uploaded."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/library')}
            iconLeft={<BookOpenCheck size={15} aria-hidden="true" />}
          >
            Open library
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label="Time range"
          options={TIMELINE_OPTIONS}
          value={timeline}
          onChange={setTimeline}
        />

        <div className="relative">
          <Tag
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            aria-hidden="true"
          />
          <input
            type="text"
            value={subjectInput}
            onChange={(event) => setSubjectInput(event.target.value)}
            placeholder="Filter by subject"
            aria-label="Filter notes by subject"
            className="input !pl-9 sm:w-56"
          />
        </div>
      </div>

      <div className="mb-4">
        <SegmentedControl
          label="Note type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'detailed', label: 'Detailed notes', count: detailed.length },
            { value: 'short', label: 'Short notes', count: short.length },
          ]}
        />
      </div>

      {initialLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-5 w-2/3" />
              <Skeleton className="mt-3 h-3" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => void refresh()}
          title="Could not load your notes"
        />
      ) : active.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={22} aria-hidden="true" />}
          title={
            subject
              ? `No ${kind} notes for “${subject}”`
              : `No ${kind} notes in this time range`
          }
          description="Notes are written when a document finishes processing. Try a wider time range, or upload something new."
          action={
            <Button variant="primary" onClick={() => navigate('/app/library?upload=1')}>
              Upload a document
            </Button>
          }
        />
      ) : kind === 'detailed' ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {detailed.map((note) => (
            <NoteCard
              key={note.id}
              title={note.title}
              fileName={note.fileName}
              createdAt={note.createdAt}
              excerpt={note.overview}
              count={note.sections?.length ?? 0}
              countLabel="sections"
              onOpen={() => navigate(`/app/notes/${note.rawDocumentId}`)}
            />
          ))}
        </ul>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {short.map((note) => (
            <NoteCard
              key={note.id}
              title={note.title}
              fileName={note.fileName}
              createdAt={note.createdAt}
              excerpt={note.summary}
              count={note.keyConcepts?.length ?? 0}
              countLabel="key concepts"
              onOpen={() => navigate(`/app/notes/${note.rawDocumentId}`)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function NoteCard({
  title,
  fileName,
  createdAt,
  excerpt,
  count,
  countLabel,
  onOpen,
}: {
  title: string
  fileName: string
  createdAt: string
  excerpt: string
  count: number
  countLabel: string
  onOpen: () => void
}) {
  return (
    <li className="card card-lift p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.625rem] bg-[var(--brand-soft)] text-[var(--brand)]">
          <FileText size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[0.9375rem] font-medium text-ink" title={title || fileName}>
            {title || fileName}
          </h2>
          <p className="mt-0.5 text-[0.75rem] text-ink-3">
            {fileName} · {formatRelative(createdAt)}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-2">
        {excerpt || 'No preview available.'}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[0.75rem] text-ink-3">
          {count} {countLabel}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand transition-colors hover:text-[var(--brand-strong)]"
        >
          Read notes
          <ArrowLeft size={13} className="rotate-180" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

/* ------------------------------- Detail -------------------------------- */

function NoteDetail({ documentId }: { documentId: string }) {
  // Fetch a wide window so a note opened from an older document still resolves.
  const { data, error, initialLoading, refresh } = useAsync(
    () => knowledgeApi.notes({ timeline: 'all' }),
    [documentId],
  )

  const detailed = useMemo(
    () =>
      data?.detailedNotes.find(
        (note) => note.rawDocumentId === documentId || note.id === documentId,
      ) ?? null,
    [data, documentId],
  )
  const short = useMemo(
    () =>
      data?.shortNotes.find(
        (note) => note.rawDocumentId === documentId || note.id === documentId,
      ) ?? null,
    [data, documentId],
  )

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-72 rounded-[var(--radius-panel)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <BackToNotes />
        <ErrorState
          error={error}
          onRetry={() => void refresh()}
          title="Could not load these notes"
        />
      </div>
    )
  }

  if (!detailed && !short) {
    return (
      <div>
        <BackToNotes />
        <EmptyState
          icon={<StickyNote size={22} aria-hidden="true" />}
          title="No notes found for this document"
          description="The document may still be processing, or it was deleted. Notes appear here as soon as generation finishes."
          action={<Button variant="secondary" onClick={() => void refresh()}>Check again</Button>}
        />
      </div>
    )
  }

  return (
    <div>
      <BackToNotes />

      <PageHeader
        title={detailed?.title || short?.title || 'Notes'}
        description={`${detailed?.fileName || short?.fileName || ''}${
          detailed?.createdAt ? ` · ${formatRelative(detailed.createdAt)}` : ''
        }`}
      />

      <div className="space-y-4">
        {detailed ? <DetailedNotes note={detailed} /> : null}
        {short ? <ShortNotes note={short} /> : null}
      </div>
    </div>
  )
}

function BackToNotes() {
  return (
    <Link to="/app/notes" className="btn btn-ghost mb-4 !min-h-8 !px-2.5 !text-[0.8125rem]">
      <ArrowLeft size={14} aria-hidden="true" />
      Back to notes
    </Link>
  )
}

/* ---------------------------- Detailed notes --------------------------- */

function DetailedNotes({ note }: { note: DetailedNotesDocument }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="detailed-notes-heading">
      <div className="flex items-center gap-2">
        <StickyNote size={16} className="text-[var(--brand)]" aria-hidden="true" />
        <h2 id="detailed-notes-heading" className="text-[1.0625rem]">
          Detailed notes
        </h2>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-2">
        {note.overview}
      </p>

      {note.sections?.length ? (
        <div className="mt-5 space-y-5">
          {note.sections.map((section, index) => (
            <div key={`${section.heading}-${index}`}>
              <h3 className="text-[0.9375rem] font-semibold text-ink">{section.heading}</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.875rem] leading-relaxed text-ink-2">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <NoteList title="Important points" values={note.importantPoints} />
        <NoteList title="Examples" values={note.examples} />
        <NoteList title="Best practices" values={note.bestPractices} />
        <NoteList title="Common mistakes" values={note.commonMistakes} />
        <NoteList title="Revision tips" values={note.revisionTips} />
      </div>
    </section>
  )
}

/* ----------------------------- Short notes ----------------------------- */

function ShortNotes({ note }: { note: ShortNotesDocument }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="short-notes-heading">
      <div className="flex items-center gap-2">
        <Quote size={16} className="text-[var(--brand)]" aria-hidden="true" />
        <h2 id="short-notes-heading" className="text-[1.0625rem]">
          Short notes
        </h2>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-2">
        {note.summary}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <NoteList title="Key concepts" values={note.keyConcepts} />
        <NoteList title="Definitions" values={note.importantDefinitions} />
        <NoteList title="Formulas" values={note.formulas} />
        <NoteList title="Syntax" values={note.syntax} mono />
        <NoteList title="Important points" values={note.importantPoints} />
        <NoteList title="Interview tips" values={note.interviewTips} />
        <NoteList title="Mnemonics" values={note.mnemonics} />
      </div>

      {note.revisionChecklist?.length ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
            <ListChecks size={13} aria-hidden="true" />
            Revision checklist
          </h3>
          <ul className="mt-2 space-y-1.5">
            {note.revisionChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink-2">
                <span
                  className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

/* ------------------------------ Shared --------------------------------- */

function NoteList({
  title,
  values,
  mono = false,
}: {
  title: string
  values?: string[]
  mono?: boolean
}) {
  if (!values?.length) return null
  return (
    <div>
      <h3 className="text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {values.map((value, index) => (
          <li
            key={`${value}-${index}`}
            className={
              mono
                ? 'overflow-x-auto rounded-md bg-[var(--surface-2)] px-2 py-1 font-mono text-[0.8125rem] text-ink-2'
                : 'flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink-2'
            }
          >
            {mono ? (
              value
            ) : (
              <>
                <span
                  className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]"
                  aria-hidden="true"
                />
                {value}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* Keeps the "kind" label readable in the tab counts. */
export function noteKindLabel(kind: NoteKind): string {
  return humanize(kind)
}
