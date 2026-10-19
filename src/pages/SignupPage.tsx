import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, UserRound } from 'lucide-react'
import { AuthLayout } from '../layouts/AuthLayout'
import { TextField } from '../components/ui/Form'
import { Button, IconButton } from '../components/ui/Button'
import { GoogleButton, OrDivider } from '../components/GoogleButton'
import { useForm } from '../hooks/useForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { toApiError } from '../services/api/client'
import type { ApiErrorShape } from '../services/api/types'
import { validateEmail, validateFullName, validatePassword } from '../utils/validation'
import { safeRedirect } from '../routes/guards'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface SignupValues extends Record<string, unknown> {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

/** Strength is advisory; the server enforces its own rules. */
function passwordScore(value: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!value) return { score: 0, label: '' }
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1
  const labels = ['Too short', 'Basic', 'Reasonable', 'Strong']
  return { score: Math.min(3, score) as 0 | 1 | 2 | 3, label: labels[Math.min(3, score)] }
}

export default function SignupPage() {
  useDocumentTitle('Create account')

  const { register, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<ApiErrorShape | null>(null)

  const form = useForm<SignupValues>({
    initialValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    validate: (values) => ({
      fullName: validateFullName(values.fullName),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword:
        values.confirmPassword !== values.password
          ? 'Passwords do not match.'
          : undefined,
    }),
  })

  const strength = passwordScore(form.values.password)

  /**
   * POST /api/auth returns the created user without a token, so signup is
   * followed by a normal POST /api/login with the same credentials. If that
   * second call fails, the account still exists — we say so plainly rather than
   * implying the signup failed.
   */
  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    setFormError(null)

    try {
      await register(values.fullName.trim(), values.email.trim(), values.password)
    } catch (error) {
      setFormError(toApiError(error))
      setSubmitting(false)
      return
    }

    try {
      await login(values.email.trim(), values.password)
      toast.success('Account created', 'You are signed in and ready to start tracking.')
      navigate(redirect, { replace: true })
    } catch {
      toast.success(
        'Account created',
        'Your account exists. Please sign in to continue.',
      )
      navigate('/login', { replace: true })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <AuthLayout
      title="Create your StudyBuddy account"
      subtitle="Track what you study, turn documents into notes, and revise on schedule."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton disabled={submitting} />
      <OrDivider />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <div
            role="alert"
            className="rounded-[0.625rem] border border-[color-mix(in_oklab,var(--danger)_28%,transparent)] bg-[var(--danger-soft)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--danger)]"
          >
            {formError.status === 409
              ? 'An account already exists with that email. Try signing in instead.'
              : formError.message}
          </div>
        ) : null}

        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Krushna Patil"
          required
          leading={<UserRound size={16} aria-hidden="true" />}
          value={form.values.fullName}
          onChange={(event) => form.setValue('fullName', event.target.value)}
          onBlur={() => form.setFieldTouched('fullName')}
          error={form.errorFor('fullName')}
        />

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

        <div>
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
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

          {form.values.password && !form.errorFor('password') ? (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1 flex-1 rounded-full transition-colors duration-200"
                    style={{
                      background:
                        index < strength.score
                          ? strength.score === 1
                            ? 'var(--warning)'
                            : strength.score === 2
                              ? 'var(--info)'
                              : 'var(--success)'
                          : 'var(--surface-3)',
                    }}
                  />
                ))}
              </div>
              <span className="w-[4.5rem] text-right text-[0.75rem] text-ink-3">
                {strength.label}
              </span>
            </div>
          ) : null}
        </div>

        <TextField
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          value={form.values.confirmPassword}
          onChange={(event) => form.setValue('confirmPassword', event.target.value)}
          onBlur={() => form.setFieldTouched('confirmPassword')}
          error={form.errorFor('confirmPassword')}
        />

        <Button type="submit" variant="primary" block size="lg" loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-[0.75rem] leading-relaxed text-ink-3">
          By creating an account you agree to keep your own backups of anything you
          upload. StudyBuddy is a study aid, not a records system.
        </p>
      </form>
    </AuthLayout>
  )
}
