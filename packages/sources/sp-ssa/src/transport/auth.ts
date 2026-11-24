import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

// The token endpoint gives the token and the lifetime of the token in seconds.
export interface AuthResponseSchema {
  access_token: string
  expires_in: number
}

export interface AuthSettings {
  AUTH_API_ENDPOINT: string
  SPGI_CLIENT_ID: string
  BACKGROUND_EXECUTE_MS_HTTP: number
}

interface TokenDuration {
  token: string
  expiryTimestampMs: number
}

// S&P issues a token for 30 minutes at most, even when the reply gives a longer lifetime.
const MAX_TOKEN_LIFETIME_S = 1800

// An issued token must not appear in a log, so it is added to the redaction
// list as soon as the login reply is read.
const ACCESS_TOKEN_CENSOR_KEY = 'SPGI_ACCESS_TOKEN'
const REGEX_SPECIAL_CHARACTERS = /[-[\]{}()*+?.,\\^$|#\s]/g

export class AuthManager {
  private latestToken: TokenDuration | undefined
  private requester: Requester
  private settings: AuthSettings

  constructor(requester: Requester, settings: AuthSettings) {
    this.requester = requester
    this.settings = settings
  }

  async getBearerToken(): Promise<string> {
    const now = Date.now()
    const buffer = 2 * this.settings.BACKGROUND_EXECUTE_MS_HTTP

    // if latestToken is missing or expired/expiring within buffer, grab a new token
    if (!this.latestToken || now > this.latestToken.expiryTimestampMs - buffer) {
      const startTimeMs = Date.now()
      const response = await this.requestAuth()
      const lifetimeS = Math.min(response.expires_in, MAX_TOKEN_LIFETIME_S)
      this.latestToken = {
        token: response.access_token,
        expiryTimestampMs: startTimeMs + lifetimeS * 1000,
      }
      this.registerIssuedToken(response.access_token)
    }

    return this.latestToken.token
  }

  private registerIssuedToken(token: string): void {
    const entry = {
      key: ACCESS_TOKEN_CENSOR_KEY,
      value: new RegExp(token.replace(REGEX_SPECIAL_CHARACTERS, '\\$&'), 'gi'),
    }
    const otherEntries = CensorList.getAll().filter((item) => item.key !== entry.key)
    CensorList.set([...otherEntries, entry])
  }

  private async requestAuth(): Promise<AuthResponseSchema> {
    const baseURL = this.settings.AUTH_API_ENDPOINT
    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        Authorization: `Basic ${this.settings.SPGI_CLIENT_ID}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'rtg_ssa',
      }).toString(),
    }

    const response = await this.requester.request<AuthResponseSchema>(baseURL, requestConfig)
    const data = response.response?.data
    const accessToken = data?.access_token
    const expiresIn = data?.expires_in

    // The lifetime must be a usable number of seconds: a non-number, zero or a
    // negative value would make the expiry unusable and keep the token forever.
    const hasToken = typeof accessToken === 'string' && accessToken.length > 0
    const hasLifetime = typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0
    if (!hasToken || !hasLifetime) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to authenticate with the S&P token endpoint',
        providerStatusCode: response.response?.status,
      })
    }

    return { access_token: accessToken, expires_in: expiresIn }
  }
}
