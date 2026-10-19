import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time failures so a single broken page cannot blank the whole app.
 * The stack is logged for development, never rendered to the user.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]"
          aria-hidden="true"
        >
          <AlertTriangle size={22} />
        </span>
        <h1 className="text-[1.25rem]">Something broke on this screen</h1>
        <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-ink-2">
          The rest of the app is still running. You can try this page again or head
          back to the dashboard.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={this.reset}>
            Try again
          </Button>
          <Button variant="primary" onClick={() => window.location.assign('/app')}>
            Go to dashboard
          </Button>
        </div>
        {import.meta.env.DEV ? (
          <pre className="mt-6 max-w-xl overflow-x-auto rounded-lg bg-[var(--surface-2)] p-3 text-left font-mono text-[0.75rem] text-ink-2">
            {error.message}
          </pre>
        ) : null}
      </div>
    )
  }
}
