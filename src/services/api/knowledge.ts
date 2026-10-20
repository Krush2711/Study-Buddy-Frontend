import { api, ingestClient } from './client'
import type {
  KnowledgeDocument,
  KnowledgeListParams,
  KnowledgeNotesResponse,
  UploadForm,
  UploadResponse,
} from './types'

export const knowledgeApi = {
  /**
   * GET /api/knowledge?timeline=today|30days|all&subject=…
   * No pagination — the endpoint returns the full array.
   */
  async list(params: KnowledgeListParams = {}): Promise<KnowledgeDocument[]> {
    const { data } = await api.get<KnowledgeDocument[]>('/knowledge', {
      params: {
        ...(params.timeline ? { timeline: params.timeline } : {}),
        ...(params.subject ? { subject: params.subject } : {}),
        ...(params.tag ? { tag: params.tag } : {}),
      },
    })
    return Array.isArray(data) ? data : []
  },

  /** GET /api/knowledge/{id} — full document, including extractedText. */
  async getById(id: string): Promise<KnowledgeDocument> {
    const { data } = await api.get<KnowledgeDocument>(`/knowledge/${id}`)
    return data
  },

  /** DELETE /api/knowledge/{id} — 204 on success. */
  async remove(id: string): Promise<void> {
    await api.delete(`/knowledge/${id}`)
  },

  /** GET /api/knowledge/notes — detailed and short notes for the signed-in user. */
  async notes(
    params: Pick<KnowledgeListParams, 'timeline' | 'subject'> = {},
  ): Promise<KnowledgeNotesResponse> {
    const { data } = await api.get<KnowledgeNotesResponse>('/knowledge/notes', {
      params: {
        ...(params.timeline ? { timeline: params.timeline } : {}),
        ...(params.subject ? { subject: params.subject } : {}),
      },
    })
    return {
      userId: data?.userId ?? '',
      timeline: data?.timeline ?? params.timeline ?? '30days',
      subject: data?.subject ?? null,
      detailedNotes: Array.isArray(data?.detailedNotes) ? data.detailedNotes : [],
      shortNotes: Array.isArray(data?.shortNotes) ? data.shortNotes : [],
    }
  },

  /**
   * POST /api/v1/ingestion/upload
   *
   * Note the versioned prefix — this is the one endpoint under /api/v1.
   * The server extracts text, runs the Gemini summary and generates both notes
   * synchronously before responding, so this can take minutes. We send
   * onUploadProgress for the transfer portion and then show an indeterminate
   * "processing" state until the response lands.
   *
   * Requires the user to have saved a Gemini key first via
   * POST /api/users/me/gemini-key.
   */
  async upload(
    form: UploadForm,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> {
    const body = new FormData()
    body.append('File', form.file)
    body.append('SourceType', form.sourceType)
    if (form.title) body.append('Title', form.title)
    if (form.description) body.append('Description', form.description)
    if (form.subject) body.append('Subject', form.subject)
    if (form.learningDate) body.append('LearningDate', form.learningDate)

    const { data } = await ingestClient.post<UploadResponse>(
      '/v1/ingestion/upload',
      body,
      {
        // Let the browser set the multipart boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return
          onProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)))
        },
      },
    )
    return data
  },
}
