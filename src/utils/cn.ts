/**
 * Minimal class-name joiner. Avoids pulling in clsx/tailwind-merge for a project
 * whose class usage is hand-authored rather than composed dynamically.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
