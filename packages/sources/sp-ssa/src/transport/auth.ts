import { ResponseTimestamps } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import escapeStringRegexp from 'escape-string-regexp'

export interface AuthSettings {
  TOKEN_ENDPOINT: string
  CLIENT_ID: string
  ORIGIN?: string
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

class TokenRequestError extends AdapterError {
  timestamps: ResponseTimestamps

  constructor(
    message: string,
    providerStatusCode: number | undefined,
    timestamps: ResponseTimestamps,
  ) {
    super({ statusCode: 502, message, providerStatusCode })
    this.timestamps = timestamps
  }
}

const TOKEN_CENSOR_KEY = 'ACCESS_TOKEN'
const MAX_CENSORED_TOKENS = 4
const REFRESH_RETRY_MS = 30_000
const REFRESH_MARGIN_MS = 5 * 60 * 1000
const TOKEN_REQUEST_KEY = 'sp-ssa-token'
const TOKEN_REQUEST_COST = 0

const isUsableAccessToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.trim() === value

const isPositiveNumber = (value: unknown): boolean =>
  (typeof value === 'number' || typeof value === 'string') &&
  Number.isFinite(Number(value)) &&
  Number(value) > 0

const parseTokenResponse = (data: unknown): { accessToken: string; expiresInSeconds: number } => {
  const body = data as TokenResponse | undefined
  const accessToken = body?.access_token
  const expiresIn = body?.expires_in
  if (!isUsableAccessToken(accessToken) || !isPositiveNumber(expiresIn)) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The token response did not include a usable access_token and expires_in',
    })
  }
  return { accessToken, expiresInSeconds: Number(expiresIn) }
}

export class AuthManager {
  private static recentTokens: string[] = []

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
    const reusable = this.reusableToken(Date.now())
    if (reusable) {
      return reusable
    }
    return this.pending ?? this.startMint()
  }

  invalidate(): void {
    this.cached = undefined
    this.refreshRetryAtMs = 0
  }

  ensureCachedTokenCensored(): void {
    const token = this.cached?.token
    if (token) {
      AuthManager.rememberToken(token)
    }
  }

  private startMint(): Promise<string> {
    const mint = this.mintToken().finally(() => {
      this.pending = undefined
    })
    this.pending = mint
    return mint
  }

  private reusableToken(now: number): string | undefined {
    const cached = this.cached
    if (!cached) {
      return undefined
    }
    const reusable =
      now < cached.refreshAtMs || (now < this.refreshRetryAtMs && now < cached.expiresAtMs)
    return reusable ? AuthManager.useToken(cached.token) : undefined
  }

  private async mintToken(): Promise<string> {
    try {
      return await this.requestToken()
    } catch (error) {
      if (!this.cached || Date.now() >= this.cached.expiresAtMs) {
        throw error
      }
      this.refreshRetryAtMs = Date.now() + REFRESH_RETRY_MS
      return AuthManager.useToken(this.cached.token)
    }
  }

  private static useToken(token: string): string {
    AuthManager.rememberToken(token)
    return token
  }

  private static rememberToken(token: string): void {
    const pattern = escapeStringRegexp(token)
    const alreadyCensored = CensorList.getAll().some(
      ({ key, value }) => key === TOKEN_CENSOR_KEY && value.source === pattern,
    )
    AuthManager.recentTokens = [
      ...AuthManager.recentTokens.filter((recent) => recent !== token),
      token,
    ].slice(-MAX_CENSORED_TOKENS)
    if (alreadyCensored) {
      return
    }
    const otherEntries = CensorList.getAll().filter(({ key }) => key !== TOKEN_CENSOR_KEY)
    const tokenEntries = AuthManager.recentTokens.map((recent) => ({
      key: TOKEN_CENSOR_KEY,
      value: new RegExp(escapeStringRegexp(recent), 'g'),
    }))
    CensorList.set([...otherEntries, ...tokenEntries])
  }

  private async requestToken(): Promise<string> {
    const response = await this.requestTokenResponse()

    if (response.response.status !== 200) {
      throw new TokenRequestError(
        `The token endpoint returned status ${response.response.status}`,
        response.response.status,
        {
          ...response.timestamps,
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }

    let parsed: { accessToken: string; expiresInSeconds: number }
    try {
      parsed = parseTokenResponse(response.response.data)
    } catch (error) {
      throw new TokenRequestError(
        error instanceof Error ? error.message : 'The token response was invalid',
        undefined,
        {
          ...response.timestamps,
          providerIndicatedTimeUnixMs: undefined,
        },
      )
    }
    const { accessToken, expiresInSeconds } = parsed
    AuthManager.rememberToken(accessToken)

    const expiresInMs = expiresInSeconds * 1000
    const refreshMarginMs = Math.min(REFRESH_MARGIN_MS, expiresInMs / 2)
    this.refreshRetryAtMs = 0
    this.cached = {
      token: accessToken,
      refreshAtMs: Date.now() + expiresInMs - refreshMarginMs,
      expiresAtMs: Date.now() + expiresInMs,
    }
    return this.cached.token
  }

  private async requestTokenResponse() {
    try {
      return await this.requester.request<TokenResponse>(
        TOKEN_REQUEST_KEY,
        {
          method: 'POST',
          baseURL: this.settings.TOKEN_ENDPOINT,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${this.settings.CLIENT_ID}`,
            ...(this.settings.ORIGIN ? { Origin: this.settings.ORIGIN } : {}),
          },
          data: 'grant_type=client_credentials&scope=rtg_ssa',
        },
        TOKEN_REQUEST_COST,
      )
    } catch (error) {
      if (error instanceof AdapterRateLimitError) {
        throw error
      }
      if (error instanceof AdapterDataProviderError || error instanceof AdapterConnectionError) {
        throw new TokenRequestError(
          `Unable to obtain an access token: ${error.message}`,
          error.providerStatusCode,
          error.timestamps,
        )
      }
      throw error
    }
  }
}
