import CensorList, {
  type CensorKeyValue,
} from '@chainlink/external-adapter-framework/util/censor/censor-list'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { randomUUID } from 'node:crypto'
import { authUrl } from './paths'
import { DEFAULT_RETRY, withRetry } from './retry'

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000

export interface AminaAuthResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthSettings {
  apiEndpoint: string
  userId: string
  password: string
}

interface CachedToken {
  token: string
  expiresAtMs: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): AdapterError {
  return new AdapterError({ statusCode: 502, message })
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function parseAuthResponse(data: unknown): AminaAuthResponse {
  if (
    !isRecord(data) ||
    !isNonEmptyString(data.accessToken) ||
    !isNonEmptyString(data.refreshToken)
  ) {
    throw invalid('AMINA auth response must contain accessToken and refreshToken')
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

// The framework has no token manager: HttpTransport only issues requests and
// prepareRequests is synchronous. AMINA's login/refresh/401 flow lives here.
const TOKEN_CENSOR_KEY = 'AMINA_TOKEN'

// CensorList stores RegExp values; escape the runtime token's metacharacters.
function escapeRegExp(value: string): string {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export class AuthManager {
  private access?: CachedToken
  private refresh?: CachedToken
  private inFlight?: Promise<string>
  private censorBase?: CensorKeyValue[]
  private readonly censoredTokens = new Map<string, number>()

  constructor(private readonly requester: Requester, private readonly settings: AuthSettings) {}

  async getAccessToken(): Promise<string> {
    return this.getToken(false)
  }

  async refreshAfter401(): Promise<string> {
    return this.getToken(true)
  }

  reset(): void {
    this.access = undefined
    this.refresh = undefined
    this.inFlight = undefined
    this.censoredTokens.clear()
    this.refreshCensorList()
  }

  private async getToken(forceRefresh: boolean): Promise<string> {
    if (
      !forceRefresh &&
      this.access &&
      Date.now() < this.access.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS
    ) {
      return this.access.token
    }
    if (this.inFlight) {
      return this.inFlight
    }
    const pending = this.acquireToken()
    this.inFlight = pending
    try {
      return await pending
    } finally {
      if (this.inFlight === pending) {
        this.inFlight = undefined
      }
    }
  }

  private async acquireToken(): Promise<string> {
    if (this.refresh && Date.now() < this.refresh.expiresAtMs - TOKEN_EXPIRY_BUFFER_MS) {
      try {
        return await this.refreshTokens(this.refresh.token)
      } catch {
        // The refresh token was rejected. Fall back to a full login.
      }
    }
    return this.login()
  }

  private async login(): Promise<string> {
    const auth = await this.requestAuth('login', {
      username: this.settings.userId,
      password: this.settings.password,
    })
    return this.store(auth)
  }

  private async refreshTokens(refreshToken: string): Promise<string> {
    const auth = await this.requestAuth('refresh', { refreshToken })
    return this.store(auth)
  }

  private async requestAuth(
    kind: 'login' | 'refresh',
    body: Record<string, string>,
  ): Promise<AminaAuthResponse> {
    const result = await withRetry(
      () =>
        this.requester.request<unknown>(`amina-auth-${kind}`, {
          method: 'POST',
          url: authUrl(this.settings.apiEndpoint),
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': randomUUID(),
            'X-Correlation-Id': randomUUID(),
          },
          data: body,
        }),
      DEFAULT_RETRY,
    )
    return parseAuthResponse(result.response.data)
  }

  private store(auth: AminaAuthResponse): string {
    const now = Date.now()
    this.access = { token: auth.accessToken, expiresAtMs: now + ACCESS_TOKEN_TTL_MS }
    this.refresh = { token: auth.refreshToken, expiresAtMs: now + REFRESH_TOKEN_TTL_MS }
    this.censorToken(auth.accessToken, this.access.expiresAtMs)
    this.censorToken(auth.refreshToken, this.refresh.expiresAtMs)
    return auth.accessToken
  }

  // The framework Requester logs the full Axios config at trace level. The
  // config censor list only covers static settings, so runtime tokens have to
  // be added here and removed once they expire.
  private censorToken(token: string, expiresAtMs: number): void {
    this.censoredTokens.set(token, expiresAtMs)
    this.refreshCensorList()
  }

  private refreshCensorList(): void {
    const now = Date.now()
    for (const [token, expiresAtMs] of this.censoredTokens) {
      if (expiresAtMs <= now) {
        this.censoredTokens.delete(token)
      }
    }
    this.censorBase ??= CensorList.getAll().filter((entry) => entry.key !== TOKEN_CENSOR_KEY)
    CensorList.set([
      ...this.censorBase,
      ...[...this.censoredTokens.keys()].map((token) => ({
        key: TOKEN_CENSOR_KEY,
        value: new RegExp(escapeRegExp(token), 'gi'),
      })),
    ])
  }
}
