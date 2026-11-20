import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { randomUUID } from 'crypto'
import { BaseEndpointTypes } from '../endpoint/reserve'

const AUTH_PATH = '/api/b2c/v1/auth'

interface AuthReply {
  accessToken: string
  refreshToken: string
}

/**
 * Holds the access token and the refresh token of one report. The first read
 * logs in; every later read reuses the held access token. A request that the
 * provider rejects with 401 calls renew(), which refreshes with the refresh
 * token and falls back to a login when the provider refuses the refresh.
 */
export class TokenManager {
  private accessToken?: string
  private refreshToken = ''
  private readonly requester: Requester
  private readonly settings: BaseEndpointTypes['Settings']
  private readonly endpointName: string
  private readonly transportName: string

  constructor(
    requester: Requester,
    settings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ) {
    this.requester = requester
    this.settings = settings
    this.endpointName = endpointName
    this.transportName = transportName
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken ?? this.login()
  }

  async renew(): Promise<string> {
    try {
      return await this.requestAuth({ refreshToken: this.refreshToken }, 'refresh')
    } catch (error) {
      if ((error as AdapterDataProviderError).providerStatusCode !== 401) {
        throw error
      }
      return this.login()
    }
  }

  private async login(): Promise<string> {
    return this.requestAuth(
      { username: this.settings.AMINA_USER_ID, password: this.settings.AMINA_PASSWORD },
      'login',
    )
  }

  private async requestAuth(
    data: Record<string, string>,
    auth: 'login' | 'refresh',
  ): Promise<string> {
    const response = await this.requester.request<AuthReply>(this.authKey(auth), {
      baseURL: this.settings.API_ENDPOINT,
      url: AUTH_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': randomUUID(),
        'X-Correlation-Id': randomUUID(),
      },
      data,
    })

    const reply = response.response?.data
    if (!reply?.accessToken || !reply?.refreshToken) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The auth reply did not contain an access token and a refresh token',
      })
    }

    this.accessToken = reply.accessToken
    this.refreshToken = reply.refreshToken
    return reply.accessToken
  }

  // The requester coalesces the calls with the same key, so concurrent readers
  // share one login and one refresh. The key names the call; it holds no
  // secret, time or nonce.
  private authKey(auth: 'login' | 'refresh'): string {
    return [this.endpointName, this.transportName, 'auth', auth].join('-')
  }
}
