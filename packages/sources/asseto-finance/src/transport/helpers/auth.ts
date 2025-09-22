import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AxiosResponse } from 'axios'

const logger = makeLogger('AuthUtil')

export interface AuthResponseSchema {
  token_type: string
  expires_in: number
  ext_expires_in: number
  access_token: string
}

export interface AuthSettings {
  AUTH_API_ENDPOINT: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  SCOPE: string
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

  constructor(requester: Requester, settings: AuthSettings) {
    this.requester = requester
    this.settings = settings
  }

  async getBearerToken(): Promise<string> {
    const now = Date.now()
    const buffer = 2 * this.settings.BACKGROUND_EXECUTE_MS

    // if latestToken is missing or expired/expiring within buffer, grab a new token
    if (!this.latestToken || now > this.latestToken.expiryTimestampMs - buffer) {
      await this.requestAuth()
    }

    if (!this.latestToken) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to getToken',
      })
    }

    return this.latestToken.token
  }

  private async requestAuth(): Promise<AxiosResponse<AuthResponseSchema>> {
    const startTimeMs = Date.now()

    const baseURL = this.settings.AUTH_API_ENDPOINT
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

    if (response.response?.status !== 200) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to auth',
        providerStatusCode: response.response.status,
      })
    }

    this.latestToken = {
      token: response.response.data.access_token,
      expiryTimestampMs: startTimeMs + response.response.data.expires_in * 1000,
    }

    logger.debug('Successfully fetched token')
    return response.response
  }
}
