import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usersApi } from '../../services/api/users'
import { config, toApiError } from '../../services/api/client'
import { formatDate, formatProvider, initials } from '../../utils/format'
import { PageHeader, Badge, DataRow } from '../../components/ui/Surface'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { ThemeSegmented } from '../../components/ui/ThemeToggle'
import { CopyButton } from '../../components/ui/SearchInput'
import { InlineSpinner } from '../../components/ui/Feedback'

export default function SettingsPage() {
  const { profile, profileLoading, refreshProfile, applyProfileUpdate } = useAuth()

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Your profile, the Gemini key that powers uploads, and how the app looks."
      />

      <div className="space-y-4">
        {profileLoading && !profile ? (
          <div className="card flex items-center justify-center p-8">
            <InlineSpinner label="Loading your profile" />
          </div>
        ) : (
          <ProfileCard onSaved={applyProfileUpdate} />
        )}

        <GeminiKeyCard />

        <section className="card p-5 sm:p-6">
          <h2 className="text-[1.0625rem]">Appearance</h2>
          <p className="mt-1 text-[0.8125rem] text-ink-2">
            Follow the system setting, or choose a theme for this browser.
          </p>
          <div className="mt-4">
            <ThemeSegmented />
          </div>
        </section>

        <AccountCard />

        <section className="card p-5 sm:p-6">
          <h2 className="text-[1.0625rem]">Connection</h2>
          <p className="mt-1 text-[0.8125rem] text-ink-2">
            This build talks to the hosted StudyBuddy API.
          </p>
          <dl className="mt-3">
            <DataRow label="API origin" mono>
              <span className="inline-flex items-center gap-1">
                {config.remoteOrigin}
                <CopyButton text={config.remoteOrigin} label="" className="!px-1" />
              </span>
            </DataRow>
            <DataRow label="Auth" mono>
              Bearer token · expires after 60 minutes
            </DataRow>
          </dl>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">
            Requests are signed in the browser and sent directly to the API in
            production. If sign-in fails with a network error, the API&apos;s CORS
            policy must allow this site with credentials.
          </p>
        </section>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => void refreshProfile()}
            iconLeft={<Save size={15} aria-hidden="true" />}
          >
            Refresh profile
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Profile --------------------------------- */

function ProfileCard({
  onSaved,
}: {
  onSaved: (profile: Awaited<ReturnType<typeof usersApi.getMe>>) => void
}) {
  const { profile, user } = useAuth()
  const toast = useToast()

  const [fullName, setFullName] = useState(profile?.fullName ?? user?.fullName ?? '')
  const [imageUrl, setImageUrl] = useState(profile?.profileImageUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName)
    setImageUrl(profile.profileImageUrl ?? '')
  }, [profile])

  const dirty =
    fullName.trim() !== (profile?.fullName ?? '') ||
    imageUrl.trim() !== (profile?.profileImageUrl ?? '')

  const save = async () => {
    if (!fullName.trim()) {
      setError('Enter your name.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await usersApi.updateMe({
        fullName: fullName.trim(),
        profileImageUrl: imageUrl.trim(),
      })
      onSaved(updated)
      toast.success('Profile updated')
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.message)
      toast.error('Could not update your profile', apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.fullName ?? user?.fullName ?? 'Your account'

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-[1.0625rem]">
        Profile
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-[0.9375rem] font-semibold text-[var(--brand)]">
          {profile?.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initials(displayName)
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-medium text-ink">{displayName}</p>
          <p className="truncate text-[0.8125rem] text-ink-3">
            {profile?.email ?? user?.email ?? ''}
          </p>
        </div>
        {profile ? (
          <Badge tone="neutral" className="ml-auto">
            {formatProvider(profile.authenticationProvider)}
          </Badge>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={error ?? undefined}
          autoComplete="name"
          required
        />
        <TextField
          label="Profile image URL"
          type="url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://…"
          hint="Optional. Leave empty to use your initials."
          autoComplete="url"
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[0.8125rem] text-ink-3">
          Email address and sign-in method cannot be changed here.
        </p>
        <Button
          variant="primary"
          onClick={() => void save()}
          loading={saving}
          disabled={!dirty}
          iconLeft={<Save size={15} aria-hidden="true" />}
        >
          Save profile
        </Button>
      </div>
    </section>
  )
}

/* ---------------------------- Gemini key ------------------------------- */

function GeminiKeyCard() {
  const toast = useToast()
  const [apiKey, setApiKey] = useState('')
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setError('Paste your Gemini API key first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await usersApi.saveGeminiKey(trimmed)
      setApiKey('')
      setSaved(true)
      toast.success(
        'Gemini API key saved',
        'You can upload documents now. The key is stored on the server, not in this browser.',
      )
    } catch (caught) {
      const apiError = toApiError(caught)
      setError(apiError.message)
      toast.error('Could not save the key', apiError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="gemini-key" className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby="gemini-heading">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-[var(--brand-soft)] text-[var(--brand)]">
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="gemini-heading" className="text-[1.0625rem]">
            Gemini API key
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
            Required before your first upload. StudyBuddy uses your key to
            summarise documents and write notes. It is sent to the API and stored
            on your account — never in this browser.
          </p>
        </div>
        {saved ? (
          <Badge tone="success" className="shrink-0">
            <CheckCircle2 size={12} aria-hidden="true" />
            Saved
          </Badge>
        ) : null}
      </div>

      <div className="mt-4">
        <TextField
          label="API key"
          type={visible ? 'text' : 'password'}
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value)
            setError(null)
          }}
          error={error ?? undefined}
          placeholder="AIza…"
          autoComplete="off"
          spellCheck={false}
          leading={<KeyRound size={15} aria-hidden="true" />}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Hide API key' : 'Show API key'}
              className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-[var(--surface-2)] hover:text-ink"
            >
              {visible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            </button>
          }
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-[0.8125rem] font-medium text-brand hover:underline"
        >
          Get a key from Google AI Studio →
        </Link>
        <Button
          variant="primary"
          onClick={() => void save()}
          loading={saving}
          disabled={!apiKey.trim()}
          iconLeft={<Save size={15} aria-hidden="true" />}
        >
          Save key
        </Button>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[0.75rem] leading-relaxed text-ink-3">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        Saving replaces any key already on your account. The server never returns
        the key, so this field always starts empty.
      </p>
    </section>
  )
}

/* ------------------------------ Account -------------------------------- */

function AccountCard() {
  const { profile, user, logout } = useAuth()
  const loading = false

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="account-heading">
      <div className="flex items-center gap-2">
        <UserRound size={16} className="text-ink-3" aria-hidden="true" />
        <h2 id="account-heading" className="text-[1.0625rem]">
          Account
        </h2>
      </div>

      <dl className="mt-3">
        <DataRow label="Email">{profile?.email ?? user?.email ?? '—'}</DataRow>
        <DataRow label="User ID" mono>
          {profile?.id ?? user?.id ?? '—'}
        </DataRow>
        <DataRow label="Sign-in method">{formatProvider(profile?.authenticationProvider)}</DataRow>
        <DataRow label="Email verified">
          {profile ? (profile.isEmailVerified ? 'Yes' : 'No') : '—'}
        </DataRow>
        <DataRow label="Member since">{formatDate(profile?.createdAt)}</DataRow>
      </dl>

      <div className="mt-5 flex justify-end">
        <Button
          variant="danger"
          onClick={logout}
          loading={loading}
          iconLeft={<LogOut size={15} aria-hidden="true" />}
        >
          Sign out
        </Button>
      </div>
    </section>
  )
}
