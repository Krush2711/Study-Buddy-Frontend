import { adminApi } from './client'
import type { AdminUser, AdminUserNotes, KnowledgeDocument } from './types'

/**
 * Admin operations.
 *
 * The key travels in X-Admin-Api-Key and is held only in memory by
 * AdminKeyContext. Nothing here reads from localStorage or an env var, and the
 * key never touches the bundle. Real authorization is performed by
 * AdminApiKeyAuthenticationHandler on the server; the route being "hidden" in
 * the UI provides no protection.
 */
export const adminOpsApi = {
  /** GET /api/admin/users */
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await adminApi.get<AdminUser[]>('/admin/users')
    return Array.isArray(data) ? data : []
  },

  /** DELETE /api/admin/users/{id} — 204 on success. */
  async deleteUser(id: string): Promise<void> {
    await adminApi.delete(`/admin/users/${id}`)
  },

  /** GET /api/admin/users/{id}/knowledge */
  async getUserKnowledge(id: string): Promise<KnowledgeDocument[]> {
    const { data } = await adminApi.get<KnowledgeDocument[]>(
      `/admin/users/${id}/knowledge`,
    )
    return Array.isArray(data) ? data : []
  },

  /**
   * GET /api/admin/users/{id}/notes
   * This is currently the only way to read notes that .NET persisted to Mongo —
   * there is no user-facing notes listing endpoint.
   */
  async getUserNotes(id: string): Promise<AdminUserNotes> {
    const { data } = await adminApi.get<AdminUserNotes>(
      `/admin/users/${id}/notes`,
    )
    return {
      userId: data?.userId ?? id,
      detailedNotes: Array.isArray(data?.detailedNotes) ? data.detailedNotes : [],
      shortNotes: Array.isArray(data?.shortNotes) ? data.shortNotes : [],
    }
  },
}
