import { api, ingestClient } from './client'
import type { KnowledgeDocument, UploadForm, UploadResponse } from './types'

export const knowledgeApi = {
  /** GET /api/knowledge — documents belonging to the authenticated user. */
  async list(): Promise<KnowledgeDocument[]> {
    const { data } = await api.get<KnowledgeDocument[]>('/knowledge')
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

  /**
   * POST /api/v1/ingestion/upload
   *
   * Note the versioned prefix — this is the one endpoint under /api/v1.
   * The server extracts text, runs the Gemini summary and generates both notes
   * synchronously before responding, so this can take minutes. We send
   * onUploadProgress for the transfer portion and then show an indeterminate
   * "processing" state until the response lands.
   */
  async upload(
    form: UploadForm,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> {
    const body = new FormData()
    body.append('file', form.file)
    body.append('sourceType', form.sourceType)
    if (form.title) body.append('title', form.title)
    if (form.description) body.append('description', form.description)
    if (form.learningDate) body.append('learningDate', form.learningDate)

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
