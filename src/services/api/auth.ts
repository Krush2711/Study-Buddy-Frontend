import { api } from './client'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types'

/**
 * Registration and login live at unusual paths on the server: the controller is
 * decorated with absolute templates (`/api/auth`, `/api/login`) rather than the
 * conventional `[controller]` routes. The client base URL is already `/api`, so
 * these pass the remaining segment and axios joins them correctly.
 */
export const authApi = {
  /** POST /api/auth — creates the account. Does not return a token. */
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth', payload)
    return data
  },

  /** POST /api/login — returns the JWT used for every authenticated call. */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/login', payload)
    return data
  },

  /**
   * GET /api/profile — backend smoke test for the bearer token.
   * Returns the literal string "Authenticated".
   */
  async ping(): Promise<string> {
    const { data } = await api.get<string>('/profile')
    return data
  },
}
