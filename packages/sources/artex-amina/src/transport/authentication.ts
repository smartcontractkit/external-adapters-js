import { createHmac, randomUUID } from 'crypto'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('AminaAuthentication')

// AMINA issues an access token valid for one hour and a refresh token valid for
// 24 hours. The auth response carries no expiry, so the adapter keeps these
// documented lifetimes and renews slightly ahead of expiry.
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000

export interface AuthResponseSchema {
  accessToken: string
  refreshToken: string
}

export type AminaAuthSettings = {
  API_ENDPOINT: string
  AMINA_USER_ID: string
  AMINA_PASSWORD: string
  AMINA_HMAC_SECRET: string
  AMINA_AGREEMENT_NUMBER: string
}

export const requestIds = (): Record<string, string> => ({
  'X-Request-Id': randomUUID(),
  'X-Correlation-Id': randomUUID(),
})

export const signRequest = ({
  userId,
  hmacSecret,
  agreementNumber,
  uri,
}: {
  userId: string
  hmacSecret: string
  agreementNumber: string
  uri: string
}): Record<string, string> => {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomUUID()
  const message = ['GET', timestamp, nonce, uri, userId, agreementNumber].join('\n')
  const signature = createHmac('sha256', hmacSecret).update(message).digest('base64')

  return {
    'Amina-Nonce': nonce,
    'Amina-Timestamp': timestamp,
    'Amina-Uri': uri,
    'Amina-Signature': signature,
    'Amina-Context-Agreement-Number': agreementNumber,
  }
}

// Keep the provider status and body in the reported error: operations need to
// tell a rejected signature from a rejected credential or an expired token.
export const toProviderError = (step: string, error: unknown): AdapterError => {
  if (error instanceof AdapterError) {
    if (!error.providerStatusCode) {
      return error
    }
    const body = error.errorResponse === undefined ? '' : `: ${JSON.stringify(error.errorResponse)}`
    return new AdapterError({
      statusCode: 502,
      message: `AMINA ${step} failed with provider status ${error.providerStatusCode}${body}`,
      cause: error,
      providerStatusCode: error.providerStatusCode,
      errorResponse: error.errorResponse,
    })
  }

  return new AdapterError({
    statusCode: 502,
    message: `AMINA ${step} failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    cause: error,
  })
}

const parseAuthResponse = (data: AuthResponseSchema): AuthResponseSchema => {
  if (typeof data?.accessToken !== 'string' || typeof data?.refreshToken !== 'string') {
    throw new AdapterError({
      statusCode: 502,
      message: 'AMINA authentication response did not contain accessToken and refreshToken',
    })
  }
  return data
}

const requestAuth = async (
  requester: Requester,
  key: string,
  step: string,
  baseURL: string,
  body: Record<string, string>,
): Promise<AuthResponseSchema> => {
  let data: AuthResponseSchema
  try {
    const { response } = await requester.request<AuthResponseSchema>(key, {
      baseURL,
      url: '/api/b2c/v1/auth',
      method: 'POST',
      headers: {
        ...requestIds(),
        'Content-Type': 'application/json',
      },
      data: body,
    })
    data = response.data
  } catch (error) {
    throw toProviderError(step, error)
  }
  return parseAuthResponse(data)
}

export const login = (
  requester: Requester,
  baseURL: string,
  username: string,
  password: string,
): Promise<AuthResponseSchema> =>
  requestAuth(requester, 'amina-auth-login', 'login', baseURL, { username, password })

export const refreshAccessToken = (
  requester: Requester,
  baseURL: string,
  refreshToken: string,
): Promise<AuthResponseSchema> =>
  requestAuth(requester, 'amina-auth-refresh', 'token refresh', baseURL, { refreshToken })

export class AminaAuth {
  private accessToken?: string
  private refreshToken?: string
  private accessTokenExpiresAtMs = 0
  private refreshTokenExpiresAtMs = 0

  constructor(private requester: Requester, private settings: AminaAuthSettings) {}

  // Reuse the access token for every positions page and retry of a run. Refresh
  // when it is near expiry, and log in again once the refresh token is near
  // expiry or the refresh is rejected.
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAtMs) {
      return this.accessToken
    }

    const refreshToken = this.refreshToken
    if (refreshToken && Date.now() < this.refreshTokenExpiresAtMs) {
      try {
        return await this.requestRefresh(refreshToken)
      } catch (error) {
        logger.info(
          `AMINA token refresh failed, logging in again: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        )
      }
    }

    return this.requestLogin()
  }

  // A positions GET answered 401: discard the access token and obtain a new one
  // through the refresh token, or through a fresh login when refresh is not
  // possible.
  async renewAfterUnauthorized(): Promise<string> {
    this.accessToken = undefined
    this.accessTokenExpiresAtMs = 0
    return this.getAccessToken()
  }

  private async requestLogin(): Promise<string> {
    const { accessToken, refreshToken } = await login(
      this.requester,
      this.settings.API_ENDPOINT,
      this.settings.AMINA_USER_ID,
      this.settings.AMINA_PASSWORD,
    )
    this.store(accessToken, refreshToken)
    return accessToken
  }

  private async requestRefresh(token: string): Promise<string> {
    const { accessToken, refreshToken } = await refreshAccessToken(
      this.requester,
      this.settings.API_ENDPOINT,
      token,
    )
    this.store(accessToken, refreshToken)
    return accessToken
  }

  private store(accessToken: string, refreshToken: string): void {
    const now = Date.now()
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.accessTokenExpiresAtMs = now + ACCESS_TOKEN_TTL_MS - TOKEN_EXPIRY_MARGIN_MS
    this.refreshTokenExpiresAtMs = now + REFRESH_TOKEN_TTL_MS - TOKEN_EXPIRY_MARGIN_MS
  }
}
