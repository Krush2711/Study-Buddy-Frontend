import { ai } from './client'
import type {
  DetailedNotesResponse,
  DocumentAnalysisRequest,
  KnowledgeDocument,
  MindMapRequest,
  MindMapResponse,
  ShortNotesResponse,
  SummaryResponse,
} from './types'

/**
 * The four FastAPI endpoints that actually exist. All are document-in, JSON-out
 * and stateless — persistence to Mongo happens inside .NET during ingestion, not
 * here. Every caller must have the document's extractedText in hand, which means
 * fetching GET /api/knowledge/{id} first.
 */
export const aiApi = {
  /** POST /summary */
  async summarize(request: DocumentAnalysisRequest): Promise<SummaryResponse> {
    const { data } = await ai.post<SummaryResponse>('/summary', request)
    return data
  },

  /** POST /notes */
  async detailedNotes(
    request: DocumentAnalysisRequest,
  ): Promise<DetailedNotesResponse> {
    const { data } = await ai.post<DetailedNotesResponse>('/notes', request)
    return data
  },

  /** POST /shortnotes */
  async shortNotes(request: DocumentAnalysisRequest): Promise<ShortNotesResponse> {
    const { data } = await ai.post<ShortNotesResponse>('/shortnotes', request)
    return data
  },

  /** POST /mindmap — returns a base64 PNG plus a static URL. */
  async mindMap(request: MindMapRequest): Promise<MindMapResponse> {
    const { data } = await ai.post<MindMapResponse>('/mindmap', request)
    return data
  },

  /** GET /system/health — used by the connection panel in Settings. */
  async health(): Promise<{ status: string }> {
    const { data } = await ai.get<{ status: string }>('/system/health')
    return data
  },
}

/**
 * Builds the request body FastAPI expects from a knowledge document.
 * Field-for-field from Ai/App/models/request.py.
 */
export function toAnalysisRequest(doc: KnowledgeDocument): DocumentAnalysisRequest {
  return {
    id: doc.id,
    userId: doc.userId,
    rawDocumentId: doc.rawDocumentId,
    fileName: doc.fileName,
    fileType: doc.fileType,
    extractedText: doc.extractedText,
  }
}

/**
 * The mind map endpoint takes a different shape: it needs the notes, not the raw
 * document. This is why the UI generates detailed notes first.
 */
export function toMindMapRequest(
  notes: DetailedNotesResponse,
): MindMapRequest {
  return {
    id: notes.id,
    userId: notes.userId,
    rawDocumentId: notes.rawDocumentId,
    fileName: notes.fileName,
    title: notes.title,
    overview: notes.overview,
    sections: notes.sections,
    importantPoints: notes.importantPoints,
    examples: notes.examples,
    bestPractices: notes.bestPractices,
    commonMistakes: notes.commonMistakes,
    revisionTips: notes.revisionTips,
  }
}
