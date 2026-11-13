import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
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
  refreshAtMs: number
  expiresAtMs: number
}

const TOKEN_CENSOR_KEY = 'ACCESS_TOKEN'
const MAX_CENSORED_TOKENS = 4
const REFRESH_RETRY_MS = 30_000
const REFRESH_MARGIN_MS = 5 * 60 * 1000
const TOKEN_REQUEST_KEY = 'sp-ssa-token'
const TOKEN_REQUEST_COST = 0

// CensorList accepts only RegExp values, so a literal token has to be escaped
// before it can be registered. This mirrors the framework's buildCensorList.
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isUsableAccessToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.trim() === value

const toExpiresInSeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

const readTokenBody = (data: unknown): { accessToken: string; expiresInSeconds: number } => {
  const body = data as TokenResponse | undefined
  if (!isUsableAccessToken(body?.access_token)) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The token response did not include a usable access_token',
    })
  }
  const expiresInSeconds = toExpiresInSeconds(body?.expires_in)
  if (expiresInSeconds === undefined) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The token response did not include a numeric expires_in',
    })
  }
  return { accessToken: body.access_token, expiresInSeconds }
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
    if (this.pending) {
      return this.pending
    }
    this.pending = this.mintToken().finally(() => {
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
      AuthManager.rememberToken(this.cached.token)
    }
  }

  private reusableToken(now: number): string | undefined {
    if (!this.cached) {
      return undefined
    }
    const isFresh = now < this.cached.refreshAtMs
    const isValidWhileBackingOff = now < this.refreshRetryAtMs && now < this.cached.expiresAtMs
    if (!isFresh && !isValidWhileBackingOff) {
      return undefined
    }
    AuthManager.rememberToken(this.cached.token)
    return this.cached.token
  }

  private async mintToken(): Promise<string> {
    try {
      return await this.requestToken()
    } catch (error) {
      if (!this.cached || Date.now() >= this.cached.expiresAtMs) {
        throw error
      }
      this.refreshRetryAtMs = Date.now() + REFRESH_RETRY_MS
      AuthManager.rememberToken(this.cached.token)
      return this.cached.token
    }
  }

  private static rememberToken(token: string): void {
    const pattern = escapeRegExp(token)
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
      value: new RegExp(escapeRegExp(recent), 'g'),
    }))
    CensorList.set([...otherEntries, ...tokenEntries])
  }

  private async requestToken(): Promise<string> {
    const response = await this.requestTokenResponse()

    if (response.response.status !== 200) {
      throw new AdapterError({
        statusCode: 502,
        message: `The token endpoint returned status ${response.response.status}`,
      })
    }

    const { accessToken, expiresInSeconds } = readTokenBody(response.response.data)
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
          },
          data: 'grant_type=client_credentials&scope=rtg_ssa',
        },
        TOKEN_REQUEST_COST,
      )
    } catch (error) {
      if (!(error instanceof AdapterDataProviderError)) {
        throw error
      }
      throw new AdapterError({
        statusCode: 502,
        message: `Unable to obtain an access token: ${error.message}`,
        providerStatusCode: error.providerStatusCode,
        cause: error,
      })
    }
  }
}
