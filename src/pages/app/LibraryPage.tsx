import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { knowledgeApi } from '../../services/api/knowledge'
import { toApiError } from '../../services/api/client'
import type {
  KnowledgeDocument,
  KnowledgeTimeline,
  UploadResponse,
} from '../../services/api/types'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useToast } from '../../context/ToastContext'
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  type SourceType,
} from '../../utils/constants'
import {
  formatBytes,
  formatDate,
  formatRelative,
  humanize,
  todayInputValue,
} from '../../utils/format'
import { cn } from '../../utils/cn'
import {
  Badge,
  DataRow,
  PageHeader,
} from '../../components/ui/Surface'
import { Button, IconButton } from '../../components/ui/Button'
import {
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
} from '../../components/ui/Feedback'
import { Field, SelectField, TextAreaField, TextField } from '../../components/ui/Form'
import { ConfirmDialog, Modal } from '../../components/ui/Overlay'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

/* ------------------------------ Helpers -------------------------------- */

const TIMELINE_OPTIONS: Array<{ value: KnowledgeTimeline; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'webp']
const CODE_EXTENSIONS = [
  'cs', 'vb', 'cpp', 'c', 'h', 'hpp', 'java', 'py', 'js', 'ts', 'tsx', 'jsx',
  'go', 'rs', 'kt', 'swift', 'php', 'rb', 'scala', 'html', 'css', 'scss', 'sql',
  'json', 'xml', 'yml', 'yaml', 'toml', 'ini', 'config', 'env', 'md',
  'dockerfile',
]

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

/** Mirrors the server contract: the client picks a type, the server validates. */
export function detectSourceType(fileName: string): SourceType {
  const extension = extensionOf(fileName)
  if (extension === 'pdf') return 'Pdf'
  if (IMAGE_EXTENSIONS.includes(extension)) return 'Image'
  if (CODE_EXTENSIONS.includes(extension)) return 'SourceCode'
  return 'Text'
}

function isAcceptedFile(file: File): boolean {
  const extension = extensionOf(file.name)
  if (!extension) return false
  return ACCEPTED_FILE_EXTENSIONS.split(',').some(
    (candidate) => candidate.trim().toLowerCase() === `.${extension}`,
  )
}

function looksLikeMissingGeminiKey(message: string): boolean {
  return /gemini\s*api\s*key/i.test(message)
}

/* ------------------------------ List page ------------------------------ */

export default function LibraryPage() {
  const { documentId } = useParams()
  return documentId ? <DocumentDetail id={documentId} /> : <KnowledgeList />
}

function KnowledgeList() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [timeline, setTimeline] = useState<KnowledgeTimeline>('all')
  const [subjectInput, setSubjectInput] = useState('')
  const subject = useDebouncedValue(subjectInput.trim(), 350)
  const [query, setQuery] = useState('')

  const [uploadOpen, setUploadOpen] = useState(searchParams.get('upload') === '1')
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Deep link from the dashboard: /app/library?upload=1 opens the upload sheet.
  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      setUploadOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('upload')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data, error, initialLoading, loading, refresh } = useAsync(
    () =>
      knowledgeApi.list({
        timeline,
        ...(subject ? { subject } : {}),
      }),
    [timeline, subject],
  )

  const documents = useMemo(() => data ?? [], [data])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return documents
    return documents.filter((doc) => {
      const haystack = [
        doc.fileName,
        doc.summary,
        doc.subject,
        doc.category,
        doc.subCategory,
        ...(doc.topics ?? []),
        ...(doc.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [documents, query])

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(documents.map((doc) => doc.subject).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [documents],
  )

  const subjectChips = useMemo(() => {
    const counts = new Map<string, number>()
    documents.forEach((doc) => {
      if (!doc.subject) return
      counts.set(doc.subject, (counts.get(doc.subject) ?? 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [documents])

  const remove = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await knowledgeApi.remove(pendingDelete.id)
      toast.success('Document deleted', pendingDelete.fileName)
      setPendingDelete(null)
      await refresh()
    } catch (caught) {
      toast.error('Could not delete document', toApiError(caught).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge library"
        description="Everything you have uploaded, processed into summaries, topics and notes by StudyBuddy."
        actions={
          <Button
            variant="primary"
            onClick={() => setUploadOpen(true)}
            iconLeft={<Plus size={16} aria-hidden="true" />}
          >
            Upload document
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            label="Time range"
            options={TIMELINE_OPTIONS}
            value={timeline}
            onChange={setTimeline}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                aria-label="Filter by subject"
                list="library-subjects"
                className="input !pl-9 sm:w-48"
              />
              <datalist id="library-subjects">
                {subjects.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search within results"
                aria-label="Search within results"
                className="input !pl-9 sm:w-56 [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>
        </div>

        {subjectChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[0.75rem] uppercase tracking-[0.06em] text-ink-3">
              Subjects
            </span>
            {subjectChips.map(([name, count]) => {
              const selected = subject.toLowerCase() === name.toLowerCase()
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSubjectInput(selected ? '' : name)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[0.75rem] font-medium transition-colors duration-150',
                    selected
                      ? 'border-transparent bg-[var(--brand-soft)] text-[var(--brand)]'
                      : 'border-[var(--line)] text-ink-2 hover:border-[var(--line-strong)] hover:text-ink',
                  )}
                >
                  {name}
                  <span className="numeric ml-1 text-ink-3">{count}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {initialLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-5 w-3/4" />
              <Skeleton className="mt-3 h-3" />
              <Skeleton className="mt-1.5 h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => void refresh()}
          title="Could not load your library"
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} aria-hidden="true" />}
          title={subject ? `Nothing filed under “${subject}”` : 'Your library is empty'}
          description={
            subject
              ? 'Try a different subject, or clear the filter to see everything.'
              : 'Upload a PDF, image, note or source file. StudyBuddy extracts the text, summarises it and writes detailed and short notes.'
          }
          action={
            subject ? (
              <Button variant="secondary" onClick={() => setSubjectInput('')}>
                Clear filter
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setUploadOpen(true)}
                iconLeft={<Upload size={16} aria-hidden="true" />}
              >
                Upload your first document
              </Button>
            )
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Search size={22} aria-hidden="true" />}
          title="No documents match that search"
          description="The search only looks at the documents currently loaded."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
          compact
        />
      ) : (
        <>
          <p className="mb-3 text-[0.8125rem] text-ink-3" aria-live="polite">
            {visible.length} document{visible.length === 1 ? '' : 's'}
            {loading ? ' · refreshing…' : ''}
          </p>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onOpen={() => navigate(`/app/library/${doc.id}`)}
                onDelete={() => setPendingDelete(doc)}
              />
            ))}
          </ul>
        </>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={async () => {
          await refresh()
          setUploadOpen(false)
          toast.success('Document processed', 'Summary and notes are ready.')
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this document?"
        description={
          pendingDelete
            ? `“${pendingDelete.fileName}” and the notes generated from it will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete document"
      />
    </div>
  )
}

/* ------------------------------- Card ---------------------------------- */

function DocumentCard({
  doc,
  onOpen,
  onDelete,
}: {
  doc: KnowledgeDocument
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <li className="card card-lift group relative flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.625rem] bg-[var(--brand-soft)] text-[var(--brand)]">
            <FileText size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-medium text-ink" title={doc.fileName}>
              {doc.fileName}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-ink-3">
              {doc.learningDate
                ? `Learned on ${formatDate(doc.learningDate)} · `
                : ''}
              {formatRelative(doc.createdAt)}
              {doc.estimatedReadingTime
                ? ` · ${doc.estimatedReadingTime} min read`
                : ''}
            </p>
          </div>
        </div>

        <IconButton
          label={`Delete ${doc.fileName}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={15} aria-hidden="true" />
        </IconButton>
      </div>

      {doc.subject || doc.difficulty ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.subject ? <Badge tone="brand">{doc.subject}</Badge> : null}
          {doc.difficulty ? (
            <Badge tone="neutral">{humanize(doc.difficulty)}</Badge>
          ) : null}
        </div>
      ) : null}

      <p className="mt-2.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-2">
        {doc.summary || 'No summary was generated for this document.'}
      </p>

      {doc.topics?.length ? (
        <p className="mt-3 line-clamp-1 text-[0.75rem] text-ink-3">
          {doc.topics.slice(0, 4).join(' · ')}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex w-fit items-center gap-1 text-[0.8125rem] font-medium text-brand transition-colors hover:text-[var(--brand-strong)]"
        aria-label={`Open ${doc.fileName}`}
      >
        Open document
        <ArrowLeft size={13} className="rotate-180" aria-hidden="true" />
      </button>
    </li>
  )
}

/* ------------------------------ Detail --------------------------------- */

function DocumentDetail({ id }: { id: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: doc, error, initialLoading, refresh } = useAsync(
    () => knowledgeApi.getById(id),
    [id],
  )
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    if (!doc) return
    setDeleting(true)
    try {
      await knowledgeApi.remove(doc.id)
      toast.success('Document deleted', doc.fileName)
      navigate('/app/library', { replace: true })
    } catch (caught) {
      toast.error('Could not delete document', toApiError(caught).message)
      setDeleting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[var(--radius-panel)] lg:col-span-2" />
          <Skeleton className="h-64 rounded-[var(--radius-panel)]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Link to="/app/library" className="btn btn-ghost mb-4 !min-h-8 !px-2.5 !text-[0.8125rem]">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to library
        </Link>
        <ErrorState
          error={error}
          onRetry={() => void refresh()}
          title={
            error.status === 404
              ? 'That document no longer exists'
              : error.status === 403
                ? 'This document belongs to another account'
                : 'Could not load the document'
          }
        />
      </div>
    )
  }

  if (!doc) return null

  const listBlocks: Array<{ title: string; values: string[] }> = [
    { title: 'Topics', values: doc.topics ?? [] },
    { title: 'Keywords', values: doc.keywords ?? [] },
    { title: 'Concepts', values: doc.concepts ?? [] },
    { title: 'Technologies', values: doc.technologies ?? [] },
    { title: 'Learning objectives', values: doc.learningObjectives ?? [] },
    { title: 'Prerequisites', values: doc.prerequisites ?? [] },
  ].filter((block) => block.values.length > 0)

  return (
    <div>
      <Link to="/app/library" className="btn btn-ghost mb-4 !min-h-8 !px-2.5 !text-[0.8125rem]">
        <ArrowLeft size={14} aria-hidden="true" />
        Back to library
      </Link>

      <PageHeader
        title={doc.fileName}
        description={doc.summary || undefined}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/notes/${doc.rawDocumentId}`)}
              iconLeft={<Sparkles size={15} aria-hidden="true" />}
            >
              View notes
            </Button>
            <Button
              variant="danger"
              onClick={() => setPendingDelete(true)}
              iconLeft={<Trash2 size={15} aria-hidden="true" />}
            >
              Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-5 sm:p-6">
            <h2 className="text-[1.0625rem]">Summary</h2>
            <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-2">
              {doc.summary || 'No summary was returned for this document.'}
            </p>
          </section>

          {listBlocks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {listBlocks.map((block) => (
                <section key={block.title} className="card p-5">
                  <h2 className="text-[0.9375rem] font-semibold text-ink">{block.title}</h2>
                  <ul className="mt-3 space-y-1.5">
                    {block.values.map((value) => (
                      <li
                        key={value}
                        className="flex items-start gap-2 text-[0.875rem] leading-relaxed text-ink-2"
                      >
                        <span
                          className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[var(--brand)]"
                          aria-hidden="true"
                        />
                        {value}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}

          <section className="card p-5 sm:p-6">
            <h2 className="text-[1.0625rem]">Extracted text</h2>
            <p className="mt-1 text-[0.8125rem] text-ink-3">
              The raw text the server pulled from the file before analysis.
            </p>
            <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-[0.625rem] bg-[var(--surface-2)] p-4 font-mono text-[0.8125rem] leading-relaxed text-ink-2">
              {doc.extractedText || 'No text was extracted.'}
            </pre>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="text-[0.9375rem] font-semibold text-ink">Document details</h2>
            <dl className="mt-2">
              <DataRow label="Subject">{doc.subject || '—'}</DataRow>
              <DataRow label="Category">{doc.category || '—'}</DataRow>
              <DataRow label="Sub-category">{doc.subCategory || '—'}</DataRow>
              <DataRow label="Type">{doc.documentType || '—'}</DataRow>
              <DataRow label="Language">{doc.language || '—'}</DataRow>
              <DataRow label="Difficulty">{humanize(doc.difficulty)}</DataRow>
              <DataRow label="Reading time">
                {doc.estimatedReadingTime ? `${doc.estimatedReadingTime} min` : '—'}
              </DataRow>
              <DataRow label="Revision priority">
                {humanize(doc.revisionPriority)}
              </DataRow>
              <DataRow label="Learned on">{formatDate(doc.learningDate)}</DataRow>
              <DataRow label="Uploaded">{formatRelative(doc.createdAt)}</DataRow>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-[0.9375rem] font-semibold text-ink">Content signals</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.hasCodeExamples ? <Badge tone="info">Code examples</Badge> : null}
              {doc.containsAlgorithm ? <Badge tone="info">Algorithm</Badge> : null}
              {doc.containsFormula ? <Badge tone="info">Formula</Badge> : null}
              {doc.containsDiagram ? <Badge tone="info">Diagram</Badge> : null}
              {!doc.hasCodeExamples &&
              !doc.containsAlgorithm &&
              !doc.containsFormula &&
              !doc.containsDiagram ? (
                <span className="text-[0.8125rem] text-ink-3">None detected</span>
              ) : null}
            </div>
            {typeof doc.confidence === 'number' ? (
              <p className="mt-4 text-[0.8125rem] text-ink-2">
                Analysis confidence{' '}
                <span className="numeric font-medium text-ink">
                  {Math.round(doc.confidence * (doc.confidence <= 1 ? 100 : 1))}%
                </span>
              </p>
            ) : null}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this document?"
        description={`“${doc.fileName}” and the notes generated from it will be removed. This cannot be undone.`}
        confirmLabel="Delete document"
      />
    </div>
  )
}

/* ------------------------------ Upload --------------------------------- */

type UploadPhase = 'idle' | 'uploading' | 'processing'

function UploadModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean
  onClose: () => void
  onUploaded: (response: UploadResponse) => Promise<void> | void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [sourceType, setSourceType] = useState<SourceType>('Text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [learningDate, setLearningDate] = useState(todayInputValue())

  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [missingKey, setMissingKey] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [dragging, setDragging] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const busy = phase !== 'idle'

  // Processing is synchronous on the server and can run for minutes; show the
  // elapsed time so the wait reads as progress rather than a hang.
  useEffect(() => {
    if (phase !== 'processing') return
    const startedAt = Date.now()
    setElapsed(0)
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (!open) return
    setError(null)
    setMissingKey(false)
  }, [open])

  const chooseFile = useCallback((next: File | null) => {
    if (!next) return
    setError(null)
    if (!isAcceptedFile(next)) {
      setError(
        `That file type is not supported. Upload ${ACCEPTED_FILE_EXTENSIONS.replaceAll(',', ', ')}.`,
      )
      return
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setError(
        `“${next.name}” is ${formatBytes(next.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      )
      return
    }
    setFile(next)
    setSourceType(detectSourceType(next.name))
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, ''))
  }, [title])

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (busy) return
    chooseFile(event.dataTransfer.files?.[0] ?? null)
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setSubject('')
    setLearningDate(todayInputValue())
    setSourceType('Text')
    setProgress(0)
    setPhase('idle')
    setError(null)
    setMissingKey(false)
  }

  const submit = async () => {
    if (!file || busy) return
    setError(null)
    setMissingKey(false)
    setPhase('uploading')
    setProgress(0)

    try {
      const response = await knowledgeApi.upload(
        {
          file,
          sourceType,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          subject: subject.trim() || undefined,
          learningDate: learningDate || undefined,
        },
        (percent) => {
          setProgress(percent)
          if (percent >= 100) setPhase('processing')
        },
      )
      setPhase('processing')
      await onUploaded(response)
      reset()
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.message)
      setMissingKey(looksLikeMissingGeminiKey(apiError.message))
      setPhase('idle')
      setProgress(0)
    }
  }

  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Upload a document"
      description="StudyBuddy extracts the text, then summarises it and writes notes. This can take a few minutes for long files."
      size="lg"
      dismissOnBackdrop={!busy}
      footer={
        busy ? (
          <Button variant="secondary" disabled block>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {phase === 'uploading' ? 'Uploading…' : 'Processing…'}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void submit()}
              disabled={!file}
              iconLeft={<Upload size={16} aria-hidden="true" />}
            >
              Upload and process
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {!file ? (
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed px-6 py-10 text-center transition-colors duration-150',
              dragging
                ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                : 'border-[var(--line-strong)] bg-surface/40',
            )}
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-ink-3">
              <Upload size={20} aria-hidden="true" />
            </span>
            <p className="text-[0.9375rem] font-medium text-ink">
              Drop a file here, or choose one
            </p>
            <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-2">
              PDFs, images, text, Markdown and source code — up to{' '}
              {formatBytes(MAX_UPLOAD_BYTES)}.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_EXTENSIONS}
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[0.625rem] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-surface text-ink-2">
              {sourceType === 'Image' ? (
                <ImageIcon size={16} aria-hidden="true" />
              ) : (
                <FileText size={16} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.875rem] font-medium text-ink">{file.name}</p>
              <p className="text-[0.75rem] text-ink-3">
                {formatBytes(file.size)} · {SOURCE_TYPE_LABELS[sourceType]}
              </p>
            </div>
            {!busy ? (
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Choose a different file"
                className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface hover:text-ink"
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional — defaults to the file name"
            disabled={busy}
          />
          <SelectField
            label="Source type"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as SourceType)}
            options={SOURCE_TYPES.map((type) => ({
              value: type,
              label: SOURCE_TYPE_LABELS[type],
            }))}
            hint="Detected from the file name — change it if that is wrong."
            disabled={busy}
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Operating Systems"
            disabled={busy}
          />
          <div>
            <Field label="Learning date">
              {(aria) => (
                <input
                  {...aria}
                  type="date"
                  value={learningDate}
                  onChange={(event) => setLearningDate(event.target.value)}
                  disabled={busy}
                  className="input"
                />
              )}
            </Field>
          </div>
        </div>

        <TextAreaField
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional context for the AI analysis"
          rows={3}
          disabled={busy}
        />

        {phase !== 'idle' ? (
          <div className="rounded-[0.625rem] border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
            <ProgressBar
              value={progress}
              indeterminate={phase === 'processing'}
              label={phase === 'uploading' ? 'Uploading file' : 'Analyzing document'}
            />
            <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-ink-2" aria-live="polite">
              <Clock3 size={13} aria-hidden="true" />
              {phase === 'processing'
                ? `Extracting text and generating notes… ${elapsed}s`
                : 'Sending the file to StudyBuddy…'}
            </p>
            {phase === 'processing' ? (
              <p className="mt-1 text-[0.75rem] text-ink-3">
                Keep this tab open. Long documents can take several minutes.
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-[0.625rem] border border-[color-mix(in_oklab,var(--danger)_26%,transparent)] bg-[var(--danger-soft)] px-3.5 py-3"
          >
            <p className="text-[0.875rem] font-medium text-ink">Upload failed</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">{error}</p>
            {missingKey ? (
              <Link
                to="/app/settings#gemini-key"
                className="mt-2 inline-block text-[0.8125rem] font-medium text-brand hover:underline"
              >
                Add your Gemini API key →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
