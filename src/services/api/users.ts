import { api } from './client'
import type { UpdateProfileRequest, UserProfile } from './types'

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
}
