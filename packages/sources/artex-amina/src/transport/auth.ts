import { randomUUID } from 'node:crypto'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import {
  ACCESS_TOKEN_TTL_MS,
  authUrl,
  REFRESH_TOKEN_TTL_MS,
  TOKEN_EXPIRY_BUFFER_MS,
} from './constants'
import { type RetryOptions, withRetry } from './retry'
import { type AminaAuthResponse, parseAuthResponse, parseJwtPayload } from './types'

export interface AuthSettings {
  apiEndpoint: string
  userId: string
  password: string
  retry: RetryOptions
}

interface CachedToken {
  token: string
  expiresAtMs: number
}

export class AuthManager {
  private access?: CachedToken
  private refresh?: CachedToken

  constructor(private readonly requester: Requester, private readonly settings: AuthSettings) {}

  async getAccessToken(): Promise<string> {
    if (this.access && Date.now() < this.access.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS) {
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

  async refreshAfter401(): Promise<string> {
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

  reset(): void {
    this.access = undefined
    this.refresh = undefined
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
    try {
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
        this.settings.retry,
      )
      return parseAuthResponse(result.response.data)
    } catch (error) {
      if (error instanceof AdapterDataProviderError) {
        throw new AdapterError({
          statusCode: 502,
          providerStatusCode: error.providerStatusCode,
          message: `AMINA auth failed with status ${error.providerStatusCode ?? 'unknown'}`,
        })
      }
      if (error instanceof AdapterConnectionError) {
        throw new AdapterError({
          statusCode: 502,
          message: 'AMINA auth connection failed',
        })
      }
      if (error instanceof AdapterError) {
        throw error
      }
      throw new AdapterError({
        statusCode: 502,
        message: 'AMINA auth failed',
      })
    }
  }

  private store(auth: AminaAuthResponse): void {
    const accessPayload = parseJwtPayload(auth.accessToken)
    if (
      accessPayload?.amina_user_id !== undefined &&
      String(accessPayload.amina_user_id) !== this.settings.userId
    ) {
      throw new AdapterError({
        statusCode: 502,
        message: 'AMINA access token amina_user_id does not match AMINA_USER_ID',
      })
    }

    const now = Date.now()
    const accessExpiry =
      accessPayload && typeof accessPayload.exp === 'number' && Number.isFinite(accessPayload.exp)
        ? accessPayload.exp * 1000
        : now + ACCESS_TOKEN_TTL_MS
    const refreshPayload = parseJwtPayload(auth.refreshToken)
    const refreshExpiry =
      refreshPayload &&
      typeof refreshPayload.exp === 'number' &&
      Number.isFinite(refreshPayload.exp)
        ? refreshPayload.exp * 1000
        : now + REFRESH_TOKEN_TTL_MS

    this.access = { token: auth.accessToken, expiresAtMs: accessExpiry }
    this.refresh = { token: auth.refreshToken, expiresAtMs: refreshExpiry }
  }
}
