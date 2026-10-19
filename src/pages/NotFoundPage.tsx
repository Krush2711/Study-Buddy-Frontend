import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-ink-3"
        aria-hidden="true"
      >
        <Compass size={22} />
      </span>
      <p className="text-micro text-ink-3">Error 404</p>
      <h1 className="mt-2">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
        The link may be out of date, or the page may have moved. Your study data is
        untouched.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/app">
          <Button variant="primary" iconLeft={<Home size={15} />}>
            Go to dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    </div>
  )
}
