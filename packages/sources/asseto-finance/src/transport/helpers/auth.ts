import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export interface AuthResponseSchema {
  token_type: string
  expires: number
  access_token: string
}

export interface AuthSettings {
  API_ENDPOINT: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  GRANT_TYPE: string
  BACKGROUND_EXECUTE_MS: number
}

interface TokenDuration {
  token: string
  expiryTimestampMs: number
}

export class AuthManager {
  private latestToken: TokenDuration | undefined
  private requester: Requester
  private settings: AuthSettings
  private static instance: AuthManager

  constructor(requester: Requester, settings: AuthSettings) {
    this.requester = requester
    this.settings = settings
  }

  static getInstance(requester: Requester, settings: AuthSettings): AuthManager {
    if (!AuthManager.instance) {
      this.instance = new AuthManager(requester, settings)
    }

    return this.instance
  }

  async getBearerToken(): Promise<string> {
    const now = Date.now()
    const buffer = 2 * this.settings.BACKGROUND_EXECUTE_MS

    // if latestToken is missing or expired/expiring within buffer, grab a new token
    if (!this.latestToken || now > this.latestToken.expiryTimestampMs - buffer) {
      const startTimeMs = Date.now()
      const response = await this.requestAuth()
      this.latestToken = {
        token: response.access_token,
        expiryTimestampMs: startTimeMs + response.expires * 1000,
      }
    }

    if (!this.latestToken?.token) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to getToken',
      })
    }

    return this.latestToken.token
  }

  private async requestAuth(): Promise<AuthResponseSchema> {
    const baseURL = `${this.settings.API_ENDPOINT}/oauth/token`
    const formData = new FormData()
    formData.append('client_id', this.settings.CLIENT_ID)
    formData.append('client_secret', this.settings.CLIENT_SECRET)
    formData.append('grant_type', this.settings.GRANT_TYPE)

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    }

    const response = await this.requester.request<AuthResponseSchema>(baseURL, requestConfig)
    if (
      response.response?.status !== 200 ||
      !response.response.data.access_token ||
      !response.response.data.expires
    ) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to auth',
        providerStatusCode: response.response.status,
      })
    }

    return response.response.data
  }
}
