import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  StickyNote,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { adminOpsApi } from '../../services/api/admin'
import { toApiError, verifyAdminKey } from '../../services/api/client'
import type { AdminUser } from '../../services/api/types'
import { useAuth } from '../../context/AuthContext'
import { useAdminKey } from '../../context/AdminKeyContext'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatDate, formatProvider, formatRelative, initials } from '../../utils/format'
import { PageHeader, Badge, DataRow } from '../../components/ui/Surface'
import { Button, IconButton } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { ConfirmDialog, Drawer } from '../../components/ui/Overlay'
import { SearchInput } from '../../components/ui/SearchInput'
import {
  EmptyState,
  ErrorState,
  InlineSpinner,
  Skeleton,
} from '../../components/ui/Feedback'

/**
 * Admin area.
 *
 * Access is proven by calling a protected endpoint: either the current JWT is
 * privileged, or the operator supplies the X-Admin-Api-Key. The key is kept in
 * memory by AdminKeyContext. Hiding this page is not a security control — the
 * backend rejects every unauthorized request.
 */
export default function AdminPage() {
  const { key, setKey, clear } = useAdminKey()
  const { token } = useAuth()
  const [sessionUnlocked, setSessionUnlocked] = useState(false)

  const locked = !key && !sessionUnlocked

  if (locked) {
    return (
      <UnlockGate
        hasSession={Boolean(token)}
        onKeyUnlocked={(candidate) => setKey(candidate)}
        onSessionUnlocked={() => setSessionUnlocked(true)}
      />
    )
  }

  return (
    <AdminUsers
      usingKey={Boolean(key)}
      onLock={() => {
        clear()
        setSessionUnlocked(false)
      }}
    />
  )
}

/* ------------------------------- Gate ---------------------------------- */

function UnlockGate({
  hasSession,
  onKeyUnlocked,
  onSessionUnlocked,
}: {
  hasSession: boolean
  onKeyUnlocked: (key: string) => void
  onSessionUnlocked: () => void
}) {
  const [key, setKeyInput] = useState('')
  const [checking, setChecking] = useState<'key' | 'session' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tryKey = async () => {
    const candidate = key.trim()
    if (!candidate) {
      setError('Enter the admin API key.')
      return
    }
    setChecking('key')
    setError(null)
    try {
      await verifyAdminKey(candidate)
      onKeyUnlocked(candidate)
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setChecking(null)
    }
  }

  const trySession = async () => {
    setChecking('session')
    setError(null)
    try {
      await verifyAdminKey(null)
      onSessionUnlocked()
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(
        apiError.status === 401 || apiError.status === 403
          ? 'Your signed-in account does not have admin access. Use the admin API key instead.'
          : apiError.message,
      )
    } finally {
      setChecking(null)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Administration"
        description="Manage StudyBuddy accounts. Sign in with an admin API key, or use an account the API already treats as an administrator."
      />

      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-[var(--brand)]" aria-hidden="true" />
          <h2 className="text-[1.0625rem]">Admin API key</h2>
        </div>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
          Sent as the <code className="font-mono text-[0.75rem]">X-Admin-Api-Key</code>{' '}
          header. It is held in memory for this tab only — refreshing the page
          clears it.
        </p>

        <div className="mt-4 space-y-3">
          <TextField
            label="API key"
            type="password"
            value={key}
            onChange={(event) => {
              setKeyInput(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void tryKey()
            }}
            error={error ?? undefined}
            placeholder="Paste the admin key"
            autoComplete="off"
            spellCheck={false}
          />

          <Button
            variant="primary"
            block
            loading={checking === 'key'}
            onClick={() => void tryKey()}
            iconLeft={<ShieldCheck size={16} aria-hidden="true" />}
          >
            Unlock with key
          </Button>
        </div>

        {hasSession ? (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[0.75rem] uppercase tracking-[0.08em] text-ink-3">
                or
              </span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>
            <Button
              variant="secondary"
              block
              loading={checking === 'session'}
              onClick={() => void trySession()}
              iconLeft={<UserRound size={16} aria-hidden="true" />}
            >
              Use my signed-in account
            </Button>
          </>
        ) : (
          <p className="mt-4 text-[0.8125rem] text-ink-3">
            Not signed in.{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Sign in
            </Link>{' '}
            to try an admin account.
          </p>
        )}

        {import.meta.env.DEV ? (
          <p className="mt-5 rounded-[0.5rem] bg-[var(--surface-2)] px-3 py-2 font-mono text-[0.75rem] text-ink-3">
            Development key: StudyBuddy-Admin-Dev-2026
          </p>
        ) : null}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[0.75rem] leading-relaxed text-ink-3">
        <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        The backend authorizes every request. This page only decides what to show.
      </p>
    </div>
  )
}

/* ------------------------------- Users --------------------------------- */

function AdminUsers({
  usingKey,
  onLock,
}: {
  usingKey: boolean
  onLock: () => void
}) {
  const users = useAsync(() => adminOpsApi.listUsers(), [])
  const [query, setQuery] = useState('')
  const needle = useDebouncedValue(query.trim().toLowerCase(), 200)

  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const list = users.data ?? []

  const visible = useMemo(() => {
    if (!needle) return list
    return list.filter((user) =>
      [user.fullName, user.email, user.authenticationProvider]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [list, needle])

  const remove = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setActionError(null)
    try {
      await adminOpsApi.deleteUser(pendingDelete.id)
      if (selected?.id === pendingDelete.id) setSelected(null)
      setPendingDelete(null)
      await users.refresh()
    } catch (caught) {
      setActionError(toApiError(caught).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Administration"
        description={`${list.length} account${list.length === 1 ? '' : 's'} registered with StudyBuddy.`}
        actions={
          <>
            <Badge tone={usingKey ? 'warning' : 'info'} dot>
              {usingKey ? 'API key session' : 'Admin JWT'}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void users.refresh()}
              loading={users.loading}
              iconLeft={<RefreshCw size={14} aria-hidden="true" />}
            >
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onLock}>
              Lock
            </Button>
          </>
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput
          label="Search users"
          value={query}
          onChange={setQuery}
          placeholder="Search by name or email"
        />
      </div>

      {actionError ? (
        <div
          role="alert"
          className="mb-4 rounded-[0.625rem] border border-[color-mix(in_oklab,var(--danger)_26%,transparent)] bg-[var(--danger-soft)] px-3.5 py-3 text-[0.875rem] text-ink-2"
        >
          {actionError}
        </div>
      ) : null}

      {users.initialLoading ? (
        <div className="card p-5">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        </div>
      ) : users.error ? (
        <ErrorState
          error={users.error}
          onRetry={() => void users.refresh()}
          title="Could not load users"
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users size={22} aria-hidden="true" />}
          title="No accounts yet"
          description="Registered users will appear here."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Users size={22} aria-hidden="true" />}
          title="No user matches that search"
          action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}
          compact
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                  <th className="px-4 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
                    User
                  </th>
                  <th className="px-4 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-[0.75rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--line)] transition-colors duration-150 last:border-0 hover:bg-[var(--surface-2)]/60"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(user)}
                        className="flex items-center gap-2.5 text-left"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-[0.75rem] font-semibold text-[var(--brand)]">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            initials(user.fullName)
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.875rem] font-medium text-ink">
                            {user.fullName}
                          </span>
                          <span className="block truncate text-[0.75rem] text-ink-3">
                            {user.email}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem] text-ink-2">
                      {formatProvider(user.authenticationProvider)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.isActive ? 'success' : 'neutral'} dot>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem] text-ink-2">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label={`View ${user.fullName}`}
                          onClick={() => setSelected(user)}
                        >
                          <ArrowRight size={15} aria-hidden="true" />
                        </IconButton>
                        <IconButton
                          label={`Delete ${user.fullName}`}
                          onClick={() => setPendingDelete(user)}
                          className="text-[var(--danger)]"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? 'User'}
        description={selected?.email}
        width="lg"
      >
        {selected ? <UserDetail user={selected} /> : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this account?"
        description={
          pendingDelete
            ? `${pendingDelete.fullName} (${pendingDelete.email}) and all of their documents and notes will be removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete account"
      />
    </div>
  )
}

/* ----------------------------- User detail ----------------------------- */

function UserDetail({ user }: { user: AdminUser }) {
  const { data, error, initialLoading, refresh } = useAsync(
    () =>
      Promise.all([
        adminOpsApi.getUserKnowledge(user.id),
        adminOpsApi.getUserNotes(user.id),
      ]).then(([knowledge, notes]) => ({ knowledge, notes })),
    [user.id],
  )

  return (
    <div className="space-y-5">
      <section>
        <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
          <UserRound size={13} aria-hidden="true" />
          Account
        </h3>
        <dl className="mt-1">
          <DataRow label="Email">{user.email}</DataRow>
          <DataRow label="User ID" mono>
            {user.id}
          </DataRow>
          <DataRow label="Provider">{formatProvider(user.authenticationProvider)}</DataRow>
          <DataRow label="Active">{user.isActive ? 'Yes' : 'No'}</DataRow>
          <DataRow label="Email verified">{user.isEmailVerified ? 'Yes' : 'No'}</DataRow>
          <DataRow label="Joined">{formatDate(user.createdAt)}</DataRow>
          <DataRow label="Updated">{user.updatedAt ? formatRelative(user.updatedAt) : '—'}</DataRow>
        </dl>
      </section>

      {initialLoading ? (
        <InlineSpinner label="Loading this user's content" />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => void refresh()}
          title="Could not load this user's content"
          compact
        />
      ) : (
        <>
          <section>
            <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
              <BookOpen size={13} aria-hidden="true" />
              Knowledge ({data?.knowledge.length ?? 0})
            </h3>
            {data?.knowledge.length ? (
              <ul className="mt-2 space-y-2">
                {data.knowledge.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-[0.625rem] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5"
                  >
                    <p className="truncate text-[0.875rem] font-medium text-ink">
                      {doc.fileName}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-3">
                      {[doc.subject, formatRelative(doc.createdAt)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.875rem] text-ink-2">No documents.</p>
            )}
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.055em] text-ink-3">
              <StickyNote size={13} aria-hidden="true" />
              Notes (
              {(data?.notes.detailedNotes.length ?? 0) +
                (data?.notes.shortNotes.length ?? 0)}
              )
            </h3>
            {data?.notes.detailedNotes.length || data?.notes.shortNotes.length ? (
              <ul className="mt-2 space-y-2">
                {data.notes.detailedNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-[0.625rem] border border-[var(--line)] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.875rem] font-medium text-ink">
                        {note.title || note.fileName}
                      </p>
                      <Badge tone="brand">Detailed</Badge>
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-ink-3">
                      {formatRelative(note.createdAt)}
                    </p>
                  </li>
                ))}
                {data.notes.shortNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-[0.625rem] border border-[var(--line)] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.875rem] font-medium text-ink">
                        {note.title || note.fileName}
                      </p>
                      <Badge tone="neutral">Short</Badge>
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-ink-3">
                      {formatRelative(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.875rem] text-ink-2">No notes.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
