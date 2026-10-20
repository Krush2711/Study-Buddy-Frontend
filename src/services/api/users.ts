import { api } from './client'
import type { GeminiKeyResponse, UpdateProfileRequest, UserProfile } from './types'

export const usersApi = {
  /** GET /api/users/me */
  async getMe(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/users/me')
    return data
  },

  /**
   * PUT /api/users/me
   * The server DTO only carries fullName and profileImageUrl — email and the
   * auth provider are read-only from the client's perspective.
   */
  async updateMe(payload: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await api.put<UserProfile>('/users/me', payload)
    return data
  },

  /**
   * POST /api/users/me/gemini-key
   * Required before the first upload: ingestion fails with
   * "Gemini API key missing" until the user has stored a key.
   */
  async saveGeminiKey(apiKey: string): Promise<GeminiKeyResponse> {
    const { data } = await api.post<GeminiKeyResponse>('/users/me/gemini-key', {
      apiKey,
    })
    return data
  },
}
