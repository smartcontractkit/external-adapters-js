import { randomUUID } from 'node:crypto'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { authUrl, DEFAULT_RETRY, withRetry } from './utils'

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000

export interface AminaAuthResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthSettings {
  apiEndpoint: string
  userId: string
  password: string
}

interface CachedToken {
  token: string
  expiresAtMs: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): AdapterError {
  return new AdapterError({ statusCode: 502, message })
}

function parseAuthResponse(data: unknown): AminaAuthResponse {
  if (!isRecord(data)) {
    throw invalid('AMINA auth response is not an object')
  }
  if (typeof data.accessToken !== 'string' || data.accessToken.length === 0) {
    throw invalid('AMINA auth response has no accessToken')
  }
  if (typeof data.refreshToken !== 'string' || data.refreshToken.length === 0) {
    throw invalid('AMINA auth response has no refreshToken')
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export class AuthManager {
  private access?: CachedToken
  private refresh?: CachedToken

  constructor(private readonly requester: Requester, private readonly settings: AuthSettings) {}

  async getAccessToken(): Promise<string> {
    return this.getToken(false)
  }

  async refreshAfter401(): Promise<string> {
    return this.getToken(true)
  }

  reset(): void {
    this.access = undefined
    this.refresh = undefined
  }

  private async getToken(forceRefresh: boolean): Promise<string> {
    if (
      !forceRefresh &&
      this.access &&
      Date.now() < this.access.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS
    ) {
      return this.access.token
    }
    if (this.refresh && Date.now() < this.refresh.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS) {
      try {
        await this.refreshTokens()
        return this.currentAccessToken()
      } catch {
        // The refresh token was rejected. Fall back to a full login.
      }
    }
    await this.login()
    return this.currentAccessToken()
  }

  private currentAccessToken(): string {
    if (!this.access) {
      throw new AdapterError({
        statusCode: 502,
        message: 'AMINA access token is unavailable',
      })
    }
    return this.access.token
  }

  private async login(): Promise<void> {
    const auth = await this.requestAuth('login', {
      username: this.settings.userId,
      password: this.settings.password,
    })
    this.store(auth)
  }

  private async refreshTokens(): Promise<void> {
    if (!this.refresh) {
      throw new AdapterError({
        statusCode: 502,
        message: 'AMINA refresh token is unavailable',
      })
    }
    const auth = await this.requestAuth('refresh', {
      refreshToken: this.refresh.token,
    })
    this.store(auth)
  }

  private async requestAuth(
    kind: 'login' | 'refresh',
    body: Record<string, string>,
  ): Promise<AminaAuthResponse> {
    const result = await withRetry(
      () =>
        this.requester.request<unknown>(`amina-auth-${kind}:${Date.now()}:${randomUUID()}`, {
          method: 'POST',
          url: authUrl(this.settings.apiEndpoint),
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': randomUUID(),
            'X-Correlation-Id': randomUUID(),
          },
          data: body,
        }),
      DEFAULT_RETRY,
    )
    return parseAuthResponse(result.response.data)
  }

  private store(auth: AminaAuthResponse): void {
    const now = Date.now()
    this.access = { token: auth.accessToken, expiresAtMs: now + ACCESS_TOKEN_TTL_MS }
    this.refresh = { token: auth.refreshToken, expiresAtMs: now + REFRESH_TOKEN_TTL_MS }
  }
}
