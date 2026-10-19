/** Document types the .NET processor pipeline can actually handle. */
export const SOURCE_TYPES = [
  'Pdf',
  'Text',
  'Image',
  'SourceCode',
] as const

export type SourceType = (typeof SOURCE_TYPES)[number]

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  Pdf: 'PDF',
  Text: 'Text file',
  Image: 'Image (OCR)',
  SourceCode: 'Source code',
}

/** Mirrors StudyBuddy.Processor's registered processors. */
export const ACCEPTED_FILE_EXTENSIONS =
  '.pdf,.txt,.md,.png,.jpg,.jpeg,.cs,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.json,.html,.css'

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

/** Activity types requested for the tracker (UI-only — no backend enum exists). */
export const ACTIVITY_TYPES = [
  'Coding',
  'Video learning',
  'Handwritten notes',
  'AI-assisted learning',
  'Research paper',
  'Downloads',
  'Question solving',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_ICON_KEYS: Record<ActivityType, string> = {
  Coding: 'code',
  'Video learning': 'video',
  'Handwritten notes': 'pen',
  'AI-assisted learning': 'sparkles',
  'Research paper': 'file-text',
  Downloads: 'download',
  'Question solving': 'list-checks',
}

/** Difficulty values the AI summary can return (free-form on the server). */
export const DIFFICULTY_TONES: Record<string, 'info' | 'warning' | 'danger' | 'success'> = {
  beginner: 'success',
  easy: 'success',
  intermediate: 'info',
  medium: 'info',
  advanced: 'warning',
  hard: 'warning',
  expert: 'danger',
}
