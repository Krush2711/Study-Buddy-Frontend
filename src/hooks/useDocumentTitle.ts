import { useEffect } from 'react'

const BASE_TITLE = 'StudyBuddy'

/** Keeps the tab title in sync with the current page. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE
  }, [title])
}
