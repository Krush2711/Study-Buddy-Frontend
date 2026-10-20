/**
 * Single source of truth for what the backend can actually do.
 *
 * Every entry was verified by reading the source in this repo — see the file
 * cited next to each endpoint. Anything the UI needs but that is NOT in here
 * must be rendered as an integration placeholder, never faked.
 *
 * This is imported by the UI so the "not yet available" messaging stays tied to
 * reality: when a backend endpoint ships, flip its status here and the badges
 * across tracker / planner / revision follow automatically.
 */

export type EndpointStatus = 'live' | 'partial' | 'absent'

export interface EndpointRecord {
  /** HTTP method + path, exactly as implemented. */
  route: string
  /** Which service serves it. */
  service: 'dotnet' | 'fastapi'
  status: EndpointStatus
  /** Where this was verified. */
  source: string
  /** What the frontend can or cannot do. */
  note?: string
}

/* ----------------------------- .NET API -------------------------------- */

export const DOTNET_ENDPOINTS = {
  register: {
    route: 'POST /api/auth',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AuthController.cs',
    note: 'Returns the created user (id, fullName, email). No token — call /api/login after signing up.',
  },
  login: {
    route: 'POST /api/login',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AuthController.cs',
    note: 'Returns a JWT plus id/fullName/email.',
  },
  googleStart: {
    route: 'GET /api/login-google',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AuthController.cs',
    note: 'Opened in a popup; redirects to Google. The popup lands on /api/auth/google-response.',
  },
  googleResponse: {
    route: 'GET /api/auth/google-response',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AuthController.cs',
    note: 'Returns LoginResponse as JSON. The SPA polls it with credentials: "include" to exchange the auth cookie for the token. Requires CORS with Access-Control-Allow-Credentials for the app origin.',
  },
  profile: {
    route: 'GET /api/users/me',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/UserController.cs',
    note: 'Returns UserProfileDto for the authenticated user.',
  },
  updateProfile: {
    route: 'PUT /api/users/me',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/UserController.cs',
    note: 'Accepts { fullName, profileImageUrl }. Email is not editable.',
  },
  profilePing: {
    route: 'GET /api/profile',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AuthController.cs',
    note: 'Auth smoke-test only — returns the string "Authenticated".',
  },
  knowledgeList: {
    route: 'GET /api/knowledge',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/KnowledgeController.cs',
  },
  knowledgeDetail: {
    route: 'GET /api/knowledge/{id}',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/KnowledgeController.cs',
    note: 'Returns the full document including extractedText.',
  },
  knowledgeDelete: {
    route: 'DELETE /api/knowledge/{id}',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/KnowledgeController.cs',
  },
  knowledgeNotes: {
    route: 'GET /api/knowledge/notes?timeline=&subject=',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/KnowledgeController.cs',
    note: 'Returns { userId, timeline, subject, detailedNotes[], shortNotes[] } for the signed-in user. Defaults to timeline=30days.',
  },
  ingest: {
    route: 'POST /api/v1/ingestion/upload',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/IngestionController.cs',
    note: 'multipart/form-data: File, SourceType, Title?, Description?, Subject?, LearningDate?. Processing (text extraction → summary → notes) happens synchronously and can take minutes: the client uses a 10-minute timeout. Requires a Gemini key saved via POST /api/users/me/gemini-key.',
  },
  adminUsers: {
    route: 'GET /api/admin/users',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AdminController.cs',
    note: 'Authenticated by the X-Admin-Api-Key header, not JWT.',
  },
  adminDeleteUser: {
    route: 'DELETE /api/admin/users/{id}',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AdminController.cs',
  },
  adminUserKnowledge: {
    route: 'GET /api/admin/users/{id}/knowledge',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AdminController.cs',
  },
  adminUserNotes: {
    route: 'GET /api/admin/users/{id}/notes',
    service: 'dotnet',
    status: 'live',
    source: 'StudyBuddy.API/Controllers/AdminController.cs',
  },
} as const satisfies Record<string, EndpointRecord>

/* ------------------------------ FastAPI -------------------------------- */

export const FASTAPI_ENDPOINTS = {
  health: {
    route: 'GET /system/health',
    service: 'fastapi',
    status: 'live',
    source: 'Ai/App/api/routers/health.py',
  },
  summary: {
    route: 'POST /summary',
    service: 'fastapi',
    status: 'live',
    source: 'Ai/App/api/routers/summary.py',
  },
  detailedNotes: {
    route: 'POST /notes',
    service: 'fastapi',
    status: 'live',
    source: 'Ai/App/api/routers/detailed_notes.py',
    note: 'Stateless: returns notes as JSON. .NET is what persists them to Mongo during ingestion.',
  },
  shortNotes: {
    route: 'POST /shortnotes',
    service: 'fastapi',
    status: 'live',
    source: 'Ai/App/api/routers/short_notes.py',
  },
  mindMap: {
    route: 'POST /mindmap',
    service: 'fastapi',
    status: 'live',
    source: 'Ai/App/api/routers/mindmap.py',
    note: 'Returns a PNG as base64 plus a /static/mindmaps/ URL.',
  },
} as const satisfies Record<string, EndpointRecord>

/* --------------------------- Capabilities ------------------------------ */

/**
 * Capabilities the brief asks for that NO controller or router implements.
 * The UI renders these as explicit integration placeholders.
 */
export const MISSING_CAPABILITIES = {
  studySessions: {
    needed: 'POST /api/sessions · GET /api/sessions · PUT /api/sessions/{id} · DELETE /api/sessions/{id}',
    affects: 'Study Tracker, Dashboard stats and charts',
    detail:
      'No study-session controller, entity or migration exists in StudyBuddy.API or StudyBuddy.DAL. Session creation, history, filters and summaries are UI-only.',
  },
  studyPlan: {
    needed: 'POST /api/plan (or POST /plan on FastAPI) · GET /api/plan/{id} · PATCH /api/plan/tasks/{id}',
    affects: 'AI Study Planner',
    detail:
      'FastAPI exposes only /summary, /notes, /shortnotes and /mindmap — all deterministic document-analysis calls. No goal-driven roadmap generator exists.',
  },
  revision: {
    needed: 'GET /api/revision/due · POST /api/revision/{id}/complete · flashcard and quiz endpoints',
    affects: 'Revision Center, Dashboard revision widgets',
    detail:
      'No revision scheduling, spaced-repetition, flashcard or quiz endpoint exists. Knowledge documents do carry revisionPriority/complexityScore, which the UI surfaces as metadata only.',
  },
  userNotesListing: {
    needed: 'GET /api/knowledge/notes — shipped',
    affects: 'AI Notes page',
    detail:
      'The user-facing notes listing is now live and the Notes page reads it directly. Notes are written during upload; there is still no endpoint for generating notes on demand from the browser.',
  },
  notePersistenceFromUi: {
    needed: 'POST /api/notes (persisting)',
    affects: 'AI Notes page — saving generated notes',
    detail:
      'Calling FastAPI /notes directly returns JSON without persisting. Saving from the browser would require a .NET endpoint that stores the result.',
  },
  documentProcessingStatus: {
    needed: 'GET /api/v1/ingestion/{id}/status or polling support',
    affects: 'Knowledge Library status column',
    detail:
      'Upload returns a single RawDocumentResponseDto with processingStatus, but there is no endpoint to re-poll a document afterwards, so status is shown as of upload time.',
  },
  feedback: {
    needed: 'POST /api/feedback',
    affects: 'Feedback page from the demo',
    detail: 'The demo collected developer feedback; no backend endpoint exists.',
  },
} as const

/* ------------------------------ Grouping ------------------------------- */

/** Convenience: is this capability available right now? */
export function isLive(record: EndpointRecord): boolean {
  return record.status === 'live'
}

/** Every endpoint in one list, for the "Connection" panel in Settings. */
export const ALL_ENDPOINTS: EndpointRecord[] = [
  ...Object.values(DOTNET_ENDPOINTS),
  ...Object.values(FASTAPI_ENDPOINTS),
]
