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
    }

    if (!this.latestToken?.token) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to authenticate with the S&P token endpoint',
      })
    }

    return this.latestToken.token
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
    if (!response.response?.data?.access_token || !response.response?.data?.expires_in) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to authenticate with the S&P token endpoint',
        providerStatusCode: response.response?.status,
      })
    }

    return response.response.data
  }
}
