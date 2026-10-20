/**
 * Types mirroring the actual server contracts.
 *
 * Sources (read from the repo, not invented):
 *  - StudyBuddy.BLL/DTOs/**\/*.cs — auth, user, document, admin shapes
 *  - StudyBuddy.Knowledge/Models/*.cs — Mongo knowledge + notes documents
 *  - Ai/App/schemas/*.py — FastAPI request/response models
 *
 * JSON casing: ASP.NET Core's default System.Text.Json policy is camelCase,
 * and every FastAPI model already uses camelCase field names, so properties
 * below stay camelCase to match the wire format exactly.
 */
/* ------------------------------- Auth ---------------------------------- */

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

/** POST /api/auth -> RegisterResponseDto */
export interface RegisterResponse {
  id: string
  fullName: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** POST /api/login -> LoginResponceDto (note: server's own spelling) */
export interface LoginResponse {
  id: string
  fullName: string
  email: string
  token: string
  /** Long-lived token exchanged at POST /api/refresh. */
  refreshToken?: string
  /** Access-token lifetime in seconds. */
  expiresIn?: number
}

/* ------------------------------- User ---------------------------------- */

/** GET /api/users/me -> UserProfileDto */
export interface UserProfile {
  id: string
  fullName: string
  email: string
  profileImageUrl: string | null
  authenticationProvider: string
  isEmailVerified: boolean
  createdAt: string
}

/** PUT /api/users/me -> UpdateProfileRequestDto (both fields camelCase on the server) */
export interface UpdateProfileRequest {
  fullName: string
  profileImageUrl: string
}

/** POST /api/users/me/gemini-key -> { message } */
export interface GeminiKeyResponse {
  message: string
}

/* ----------------------------- Knowledge ------------------------------- */

/**
 * GET /api/knowledge -> KnowledgeDocument[]
 * GET /api/knowledge/{id} -> KnowledgeDocument (includes extractedText)
 */
export interface KnowledgeDocument {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  fileType: string
  extractedText: string
  metadata: Record<string, string>
  createdAt: string
  /** Calendar day the user picked at upload; null for older documents. */
  learningDate?: string | null
  summary: string
  subject: string
  category: string
  subCategory: string
  documentType: string
  language: string
  difficulty: string
  estimatedReadingTime: number
  topics: string[]
  keywords: string[]
  concepts: string[]
  technologies: string[]
  learningObjectives: string[]
  prerequisites: string[]
  revisionPriority: string
  complexityScore: number
  confidence: number
  hasCodeExamples: boolean
  containsAlgorithm: boolean
  containsFormula: boolean
  containsDiagram: boolean
}

/** POST /api/v1/ingestion/upload (multipart) -> RawDocumentResponseDto */
export interface UploadResponse {
  id: string
  title: string
  sourceType: string
  processingStatus: string
  uploadedAt: string
  learningDate: string
}

/** Form fields accepted by the ingestion endpoint (UploadRawDocumentRequest.cs) */
export interface UploadForm {
  file: File
  sourceType: string
  title?: string
  description?: string
  subject?: string
  learningDate?: string
}

/* ----------------------------- Knowledge filters ----------------------- */

export type KnowledgeTimeline = 'today' | '30days' | 'all'

export interface KnowledgeListParams {
  timeline?: KnowledgeTimeline
  /** Filter by subject. `tag` is an alias accepted by the API. */
  subject?: string
  tag?: string
}

/**
 * GET /api/knowledge/notes — the authenticated user's persisted notes.
 * Defaults to timeline=30days on the server.
 */
export interface KnowledgeNotesResponse {
  userId: string
  timeline: string
  subject: string | null
  detailedNotes: DetailedNotesDocument[]
  shortNotes: ShortNotesDocument[]
}

/* ------------------------------- Admin --------------------------------- */

/** GET /api/admin/users -> AdminUserDto[] */
export interface AdminUser {
  id: string
  fullName: string
  email: string
  authenticationProvider: string
  isActive: boolean
  isEmailVerified: boolean
  profileImageUrl: string | null
  createdAt: string
  updatedAt: string | null
}

/** GET /api/admin/users/{id}/notes -> AdminUserNotesDto */
export interface AdminUserNotes {
  userId: string
  detailedNotes: DetailedNotesDocument[]
  shortNotes: ShortNotesDocument[]
}

/* ------------------------- Notes (Mongo models) ------------------------ */

export interface NoteSection {
  heading: string
  content: string
}

/** StudyBuddy.Knowledge/Models/DetailedNotesDocument.cs */
export interface DetailedNotesDocument {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  title: string
  overview: string
  sections: NoteSection[]
  importantPoints: string[]
  examples: string[]
  bestPractices: string[]
  commonMistakes: string[]
  revisionTips: string[]
  createdAt: string
}

/** StudyBuddy.Knowledge/Models/ShortNotesDocument.cs */
export interface ShortNotesDocument {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  title: string
  summary: string
  keyConcepts: string[]
  importantDefinitions: string[]
  formulas: string[]
  syntax: string[]
  importantPoints: string[]
  interviewTips: string[]
  revisionChecklist: string[]
  mnemonics: string[]
  sections: NoteSection[]
  createdAt: string
}

/* ---------------------------- AI (FastAPI) ----------------------------- */

/**
 * Body for /summary, /notes and /shortnotes — identical field set in
 * Ai/App/models/request.py and Ai/App/schemas/summary.py.
 */
export interface DocumentAnalysisRequest {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  fileType: string
  extractedText: string
}

/** POST /summary -> SummaryResponse */
export interface SummaryResponse {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  summary: string
  subject: string
  category: string
  subCategory: string
  documentType: string
  language: string
  difficulty: string
  estimatedReadingTime: number
  learningObjectives: string[]
  prerequisites: string[]
  topics: string[]
  keywords: string[]
  concepts: string[]
  technologies: string[]
  revisionPriority: string
  complexityScore: number
  confidence: number
  hasCodeExamples: boolean
  containsAlgorithm: boolean
  containsFormula: boolean
  containsDiagram: boolean
}

/** POST /notes -> DetailedNotesResponse */
export interface DetailedNotesResponse {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  title: string
  overview: string
  sections: NoteSection[]
  importantPoints: string[]
  examples: string[]
  bestPractices: string[]
  commonMistakes: string[]
  revisionTips: string[]
}

/** POST /shortnotes -> ShortNotesResponse */
export interface ShortNotesResponse {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  title: string
  summary: string
  keyConcepts: string[]
  importantDefinitions: string[]
  formulas: string[]
  syntax: string[]
  importantPoints: string[]
  interviewTips: string[]
  revisionChecklist: string[]
  mnemonics: string[]
  sections: NoteSection[]
}

/** POST /mindmap — Ai/App/schemas/mind_map_schemas.py */
export interface MindMapRequest {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  title: string
  overview: string
  sections: NoteSection[]
  importantPoints?: string[]
  examples?: string[]
  bestPractices?: string[]
  commonMistakes?: string[]
  revisionTips?: string[]
}

export interface MindMapResponse {
  id: string
  userId: string
  rawDocumentId: string
  fileName: string
  imagePath: string
  imageUrl: string
  imageBase64: string
  mimeType: string
  model: string
}

/* ------------------------- Client-held session ------------------------- */

/** What we persist locally after POST /api/login. Never contains a secret. */
export interface SessionUser {
  id: string
  fullName: string
  email: string
}

/** Normalized shape for anything the UI can render as a failure. */
export interface ApiErrorShape {
  status: number
  message: string
  /** ASP.NET ValidationProblemDetails `errors`, keyed by property name. */
  fieldErrors?: Record<string, string[]>
  /** True when the endpoint simply does not exist on the backend yet. */
  unavailable?: boolean
}
