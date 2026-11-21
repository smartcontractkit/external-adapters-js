import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createHmac, randomUUID } from 'crypto'
import { getUnixTime } from 'date-fns'

const AUTH_PATH = '/api/b2c/v1/auth'

export type AminaSettings = {
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

type Tokens = {
  accessToken: string
  refreshToken: string
}

export const getSignedHeaders = (
  settings: AminaSettings,
  path: string,
  accessToken: string,
): Record<string, string> => {
  const timestamp = String(getUnixTime(Date.now()))
  const nonce = randomUUID()
  const message = [
    'GET',
    timestamp,
    nonce,
    path,
    settings.AMINA_USER_ID,
    settings.AMINA_AGREEMENT_NUMBER,
  ].join('\n')
  const signature = createHmac('sha256', settings.AMINA_HMAC_SECRET)
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
    'Amina-Context-Agreement-Number': settings.AMINA_AGREEMENT_NUMBER,
  }
}

// The access token lives for one hour and the refresh token for one day. A
// session holds one pair for all the pages of one report.
export class AminaSession {
  private accessToken = ''
  private refreshToken = ''

  constructor(
    private readonly settings: AminaSettings,
    private readonly requester: Requester,
    private readonly requestKey: (data: Record<string, string>) => string,
  ) {}

  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.login()
    }
    return this.accessToken
  }

  // AMINA answers 401 when the access token has expired.
  async renew(): Promise<string> {
    try {
      await this.refresh()
    } catch {
      await this.login()
    }
    return this.accessToken
  }

  private async login(): Promise<void> {
    const tokens = await this.postTokens(
      { username: this.settings.AMINA_USER_ID, password: this.settings.AMINA_PASSWORD },
      'login',
    )
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
  }

  private async refresh(): Promise<void> {
    const tokens = await this.postTokens({ refreshToken: this.refreshToken }, 'refresh')
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
  }

  private async postTokens(data: Record<string, string>, action: string): Promise<Tokens> {
    try {
      const { response } = await this.requester.request<AuthReply>(this.requestKey({ action }), {
        method: 'POST',
        baseURL: this.settings.API_ENDPOINT,
        url: AUTH_PATH,
        headers: {
          'X-Request-Id': randomUUID(),
          'X-Correlation-Id': randomUUID(),
        },
        data,
      })
      const accessToken = response.data?.accessToken
      const refreshToken = response.data?.refreshToken
      if (!accessToken || !refreshToken) {
        throw new Error('the reply does not carry a token pair')
      }
      return { accessToken, refreshToken }
    } catch (e) {
      throw new AdapterError({
        statusCode: 502,
        message: `The AMINA ${action} request failed`,
        cause: e,
      })
    }
  }
}
