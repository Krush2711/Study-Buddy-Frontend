import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { AuthLayout } from '../layouts/AuthLayout'
import { TextField } from '../components/ui/Form'
import { Button, IconButton } from '../components/ui/Button'
import { GoogleButton, OrDivider } from '../components/GoogleButton'
import { useForm } from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { toApiError } from '../services/api/client'
import type { ApiErrorShape } from '../services/api/types'
import { validateEmail } from '../utils/validation'
import { safeRedirect } from '../routes/guards'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface LoginValues extends Record<string, unknown> {
  email: string
  password: string
}

export default function LoginPage() {
  useDocumentTitle('Sign in')

  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<ApiErrorShape | null>(null)

  const form = useForm<LoginValues>({
    initialValues: { email: '', password: '' },
    validate: (values) => ({
      email: validateEmail(values.email),
      password: values.password ? undefined : 'Password is required.',
    }),
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await login(values.email.trim(), values.password)
      toast.success('Signed in', 'Welcome back to StudyBuddy.')
      navigate(redirect, { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      setFormError(apiError)

      // Field-level mapping when the server returns validation details.
      if (apiError.fieldErrors) {
        const entries = Object.entries(apiError.fieldErrors)
        if (entries.length > 0) {
          toast.error('Check the form', entries[0][1]?.[0] ?? apiError.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthLayout
      title="Sign in to StudyBuddy"
      subtitle="Pick up where you left off — your sessions, documents and notes are waiting."
      footer={
        <p>
          New here?{' '}
          <Link
            to={`/signup${redirect !== '/app' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-medium text-brand hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <GoogleButton disabled={submitting} />
      <OrDivider />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && !formError.fieldErrors ? (
          <div
            role="alert"
            className="rounded-[0.625rem] border border-[color-mix(in_oklab,var(--danger)_28%,transparent)] bg-[var(--danger-soft)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--danger)]"
          >
            {formError.status === 401
              ? 'That email and password combination did not match an account.'
              : formError.message}
          </div>
        ) : null}

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          leading={<Mail size={16} aria-hidden="true" />}
          value={form.values.email}
          onChange={(event) => form.setValue('email', event.target.value)}
          onBlur={() => form.setFieldTouched('email')}
          error={form.errorFor('email')}
        />

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
          value={form.values.password}
          onChange={(event) => form.setValue('password', event.target.value)}
          onBlur={() => form.setFieldTouched('password')}
          error={form.errorFor('password')}
          trailing={
            <IconButton
              label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
              size={32}
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </IconButton>
          }
        />

        <div className="flex items-center justify-between">
          <p className="text-[0.8125rem] text-ink-3">
            Sessions last 60 minutes, then you will be asked to sign in again.
          </p>
        </div>

        <Button type="submit" variant="primary" block size="lg" loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
