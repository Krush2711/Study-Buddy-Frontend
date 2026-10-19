import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { IconButton } from './Button'

/** Windowed page numbers with ellipses, keeping a stable width. */
function pageWindow(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result: Array<number | 'gap'> = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap')
    result.push(page)
  })
  return result
}

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  /** Noun for the summary line, e.g. "users". */
  itemLabel?: string
  className?: string
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = 'items',
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const first = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const last = Math.min(totalItems, safePage * pageSize)

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col gap-3 border-t border-[var(--line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-[0.8125rem] text-ink-2">
        <span className="numeric">
          {first}–{last} of {totalItems} {itemLabel}
        </span>
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-[var(--line-strong)] bg-surface px-1.5 py-1 text-[0.8125rem] text-ink"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          label="Previous page"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          size={32}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </IconButton>

        <ul className="flex items-center gap-1">
          {pageWindow(safePage, totalPages).map((entry, index) =>
            entry === 'gap' ? (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 text-[0.8125rem] text-ink-3"
              >
                …
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-label={`Page ${entry}`}
                  aria-current={entry === safePage ? 'page' : undefined}
                  className={cn(
                    'numeric h-8 min-w-8 rounded-[0.5rem] px-2 text-[0.8125rem] font-medium transition-colors',
                    entry === safePage
                      ? 'bg-brand text-[var(--brand-ink)]'
                      : 'text-ink-2 hover:bg-[var(--surface-2)] hover:text-ink',
                  )}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ul>

        <IconButton
          label="Next page"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          size={32}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  )
}
