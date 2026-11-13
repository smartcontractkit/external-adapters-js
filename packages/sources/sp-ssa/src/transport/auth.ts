import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'

export interface AuthSettings {
  TOKEN_ENDPOINT: string
  CLIENT_ID: string
}

interface TokenResponse {
  access_token?: unknown
  expires_in?: unknown
}

interface CachedToken {
  token: string
  expiresAtMs: number
}

export class AuthManager {
  private static readonly REFRESH_MARGIN_MS = 5 * 60 * 1000
  private static readonly TOKEN_REQUEST_KEY = 'sp-ssa-token'

  private readonly requester: Requester
  private readonly settings: AuthSettings
  private cached?: CachedToken
  private pending?: Promise<string>

  constructor(requester: Requester, settings: AuthSettings) {
    this.requester = requester
    this.settings = settings
  }

  async getToken(): Promise<string> {
    const now = Date.now()
    if (this.cached && now < this.cached.expiresAtMs - AuthManager.REFRESH_MARGIN_MS) {
      return this.cached.token
    }
    if (this.pending) {
      return this.pending
    }
    this.pending = this.requestToken().finally(() => {
      this.pending = undefined
    })
    return this.pending
  }

  invalidate(): void {
    this.cached = undefined
  }

  private async requestToken(): Promise<string> {
    let response
    try {
      response = await this.requester.request<TokenResponse>(AuthManager.TOKEN_REQUEST_KEY, {
        method: 'POST',
        baseURL: this.settings.TOKEN_ENDPOINT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${this.settings.CLIENT_ID}`,
        },
        data: 'grant_type=client_credentials&scope=rtg_ssa',
      })
    } catch (e) {
      if (e instanceof AdapterDataProviderError) {
        throw new AdapterError({
          statusCode: 502,
          message: `Unable to obtain an access token: ${e.message}`,
          providerStatusCode: e.providerStatusCode,
          cause: e,
        })
      }
      throw e
    }

    const body = response.response.data as TokenResponse | undefined
    const accessToken = body?.access_token
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The token response did not include an access_token',
      })
    }

    const expiresInSeconds = Number(body?.expires_in)
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The token response did not include a numeric expires_in',
      })
    }

    this.cached = {
      token: accessToken,
      expiresAtMs: Date.now() + expiresInSeconds * 1000,
    }
    return this.cached.token
  }
}
