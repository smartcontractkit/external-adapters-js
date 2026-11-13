import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'

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
  refreshAtMs: number
  expiresAtMs: number
}

export class AuthManager {
  private static readonly REFRESH_MARGIN_MS = 5 * 60 * 1000
  private static readonly TOKEN_REQUEST_KEY = 'sp-ssa-token'
  private static readonly TOKEN_REQUEST_COST = 0

  private readonly requester: Requester
  private readonly settings: AuthSettings
  private cached?: CachedToken
  private pending?: Promise<string>
  private refreshRetryAtMs = 0

  constructor(requester: Requester, settings: AuthSettings) {
    this.requester = requester
    this.settings = settings
  }

  async getToken(): Promise<string> {
    const now = Date.now()
    if (this.cached && now < this.cached.refreshAtMs) {
      AuthManager.ensureCensored(this.cached.token)
      return this.cached.token
    }
    if (this.cached && now < this.refreshRetryAtMs && now < this.cached.expiresAtMs) {
      AuthManager.ensureCensored(this.cached.token)
      return this.cached.token
    }
    if (this.pending) {
      return this.pending
    }
    this.pending = this.requestToken()
      .catch((e) => {
        if (this.cached && Date.now() < this.cached.expiresAtMs) {
          this.refreshRetryAtMs = Date.now() + 30_000
          this.ensureCachedTokenCensored()
          return this.cached.token
        }
        throw e
      })
      .finally(() => {
        this.pending = undefined
      })
    return this.pending
  }

  invalidate(): void {
    this.cached = undefined
    this.refreshRetryAtMs = 0
  }

  ensureCachedTokenCensored(): void {
    if (this.cached) {
      AuthManager.ensureCensored(this.cached.token)
    }
  }

  private static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private static registerCensoredToken(token: string): void {
    const boundary = `(?<![A-Za-z0-9._-])${AuthManager.escapeRegExp(token)}(?![A-Za-z0-9._-])`
    const all = CensorList.getAll()
    const others = all.filter((entry) => entry.key !== 'ACCESS_TOKEN')
    const recent = all.filter((entry) => entry.key === 'ACCESS_TOKEN').slice(-3)
    CensorList.set([
      ...others,
      ...recent,
      { key: 'ACCESS_TOKEN', value: new RegExp(boundary, 'g') },
    ])
  }

  private static ensureCensored(token: string): void {
    const escaped = AuthManager.escapeRegExp(token)
    const present = CensorList.getAll().some(
      (entry) => entry.key === 'ACCESS_TOKEN' && entry.value.source.includes(escaped),
    )
    if (!present) {
      AuthManager.registerCensoredToken(token)
    }
  }

  private async requestToken(): Promise<string> {
    let response
    try {
      response = await this.requester.request<TokenResponse>(
        AuthManager.TOKEN_REQUEST_KEY,
        {
          method: 'POST',
          baseURL: this.settings.TOKEN_ENDPOINT,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${this.settings.CLIENT_ID}`,
          },
          data: 'grant_type=client_credentials&scope=rtg_ssa',
        },
        AuthManager.TOKEN_REQUEST_COST,
      )
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

    if (response.response.status !== 200) {
      throw new AdapterError({
        statusCode: 502,
        message: `The token endpoint returned status ${response.response.status}`,
      })
    }

    const body = response.response.data as TokenResponse | undefined
    const accessToken = body?.access_token
    if (typeof accessToken !== 'string' || accessToken.length === 0 || /\s/.test(accessToken)) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The token response did not include a usable access_token',
      })
    }

    const rawExpiresIn = body?.expires_in
    const expiresInSeconds =
      typeof rawExpiresIn === 'number'
        ? rawExpiresIn
        : typeof rawExpiresIn === 'string' && rawExpiresIn.trim() !== ''
        ? Number(rawExpiresIn)
        : Number.NaN
    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The token response did not include a numeric expires_in',
      })
    }

    AuthManager.registerCensoredToken(accessToken)
    const expiresInMs = expiresInSeconds * 1000
    const refreshMarginMs = Math.min(AuthManager.REFRESH_MARGIN_MS, expiresInMs / 2)
    this.refreshRetryAtMs = 0
    this.cached = {
      token: accessToken,
      refreshAtMs: Date.now() + expiresInMs - refreshMarginMs,
      expiresAtMs: Date.now() + expiresInMs,
    }
    return this.cached.token
  }
}
