import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  BrainCircuit,
  LayoutDashboard,
  Library,
  NotebookPen,
  Repeat2,
  Settings,
  Timer,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Short label used when the sidebar is collapsed. */
  shortLabel: string
  description: string
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

/**
 * Navigation names describe their contents rather than vague umbrellas, so each
 * destination is predictable before it is opened.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'study',
    label: 'Study',
    items: [
      {
        to: '/app',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: LayoutDashboard,
        description: 'Your week at a glance',
      },
      {
        to: '/app/tracker',
        label: 'Study Tracker',
        shortLabel: 'Tracker',
        icon: Timer,
        description: 'Log and review study sessions',
      },
      {
        to: '/app/planner',
        label: 'AI Study Planner',
        shortLabel: 'Planner',
        icon: BrainCircuit,
        description: 'Generate a learning roadmap',
      },
      {
        to: '/app/revision',
        label: 'Revision Center',
        shortLabel: 'Revise',
        icon: Repeat2,
        description: 'Due reviews and flashcards',
      },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    items: [
      {
        to: '/app/library',
        label: 'Library',
        shortLabel: 'Library',
        icon: Library,
        description: 'Documents and extracted text',
      },
      {
        to: '/app/notes',
        label: 'Notes & Revision',
        shortLabel: 'Notes',
        icon: NotebookPen,
        description: 'AI notes, flashcards and summaries',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        to: '/app/settings',
        label: 'Profile & Settings',
        shortLabel: 'Settings',
        icon: Settings,
        description: 'Profile, appearance and connections',
      },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)

/** Landing page anchors, shared by the header and footer. */
export const MARKETING_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#ai', label: 'AI planning' },
] as const

export const APP_ICON = BookOpen
