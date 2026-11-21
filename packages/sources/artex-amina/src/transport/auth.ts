import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createHmac, randomUUID } from 'crypto'

const logger = makeLogger('AminaAuth')

export const AUTH_PATH = '/api/b2c/v1/auth'

export type AminaAuthSettings = {
  API_ENDPOINT: string
  AMINA_USER_ID: string
  AMINA_PASSWORD: string
  AMINA_HMAC_SECRET: string
  AMINA_AGREEMENT_NUMBER: string
}

type AuthReply = {
  accessToken?: string
  refreshToken?: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

// Holds the AMINA token session and signs the positions requests. The provider
// issues an access token and a refresh token, and every positions GET must
// carry a fresh nonce, timestamp, and HMAC signature.
export class AminaAuth {
  private tokens?: AuthTokens

  constructor(
    private readonly requester: Requester,
    private readonly settings: AminaAuthSettings,
  ) {}

  async getAccessToken(): Promise<string> {
    if (!this.tokens) {
      this.tokens = await this.login()
    }
    return this.tokens.accessToken
  }

  // A 401 means the access token is no longer accepted. Try the refresh token
  // first and log in again when the provider rejects it.
  async renewAccessToken(): Promise<string> {
    const refreshToken = this.tokens?.refreshToken
    if (refreshToken) {
      try {
        this.tokens = await this.requestTokens({ refreshToken }, 'refresh')
        return this.tokens.accessToken
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error'
        logger.warn(`The AMINA refresh token was rejected, logging in again: ${message}`)
      }
    }
    this.tokens = await this.login()
    return this.tokens.accessToken
  }

  positionsHeaders(accessToken: string, path: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = randomUUID()
    const message = [
      'GET',
      timestamp,
      nonce,
      path,
      this.settings.AMINA_USER_ID,
      this.settings.AMINA_AGREEMENT_NUMBER,
    ].join('\n')
    const signature = createHmac('sha256', this.settings.AMINA_HMAC_SECRET)
      .update(message)
      .digest('base64')

    return {
      Authorization: `Bearer ${accessToken}`,
      'X-Request-Id': randomUUID(),
      'X-Correlation-Id': randomUUID(),
      'Amina-Nonce': nonce,
      'Amina-Timestamp': timestamp,
      'Amina-Uri': path,
      'Amina-Signature': signature,
      'Amina-Context-Agreement-Number': this.settings.AMINA_AGREEMENT_NUMBER,
    }
  }

  private async login(): Promise<AuthTokens> {
    return this.requestTokens(
      {
        username: this.settings.AMINA_USER_ID,
        password: this.settings.AMINA_PASSWORD,
      },
      'login',
    )
  }

  private async requestTokens(
    body: { username: string; password: string } | { refreshToken: string },
    step: 'login' | 'refresh',
  ): Promise<AuthTokens> {
    const response = await this.requester.request<AuthReply>(`${AUTH_PATH}#${step}`, {
      method: 'POST',
      baseURL: this.settings.API_ENDPOINT,
      url: AUTH_PATH,
      headers: {
        'X-Request-Id': randomUUID(),
        'X-Correlation-Id': randomUUID(),
      },
      data: body,
    })
    return readTokens(response.response.data)
  }
}

// Both tokens are required: the access token authenticates every positions GET
// and the refresh token is the only way to recover from an expired one.
function readTokens(reply: AuthReply | undefined): AuthTokens {
  if (typeof reply?.accessToken !== 'string' || typeof reply?.refreshToken !== 'string') {
    throw new AdapterError({
      statusCode: 502,
      message: 'The data provider returned an unusable authentication response',
    })
  }
  return { accessToken: reply.accessToken, refreshToken: reply.refreshToken }
}
