import nock from 'nock'

export const AMINA_HOST = 'https://integration-test.aminagroup.io'
export const AUTH_PATH = '/api/b2c/v1/auth'
export const PORTFOLIO = '157769305'
export const POSITIONS_PATH = `/api/b2c/v1/securities/portfolios/${PORTFOLIO}/positions`
export const ISIN = 'US0378331005'

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export type WireHeaders = Record<string, string>
export type Reply = { statusCode: number; body: unknown }

export type CapturedAuthRequest = {
  body: Record<string, unknown> | undefined
  headers: WireHeaders
  at: number
}

export type CapturedPositionsRequest = {
  page: number
  size: string | null
  path: string
  headers: WireHeaders
  at: number
}

// Body of recording/02-positions-page-0.body.json: the wire reply of the
// provider for the configured portfolio. Position and page fields are kept so
// every fixture below is a recorded reply with a single field overridden.
export const recordedPositionsPage0 = {
  positions: [
    {
      isin: ISIN,
      marketValueChf: 28642.7911,
      quantity: 100.0,
      buyingRate: 300.0,
      costPrice: 24741.0,
      performance: 15.770547269714253,
      rate: 341.27,
      instrument: {
        isin: ISIN,
        symbol: 'AAPL',
        type: 2,
        name: 'Registered Shs Apple Inc ',
        shortName: 'Apple Rg',
        exchange: 'NASDAQ',
        price: 341.27,
        currency: 'USD',
      },
      currency: 'USD',
    },
  ],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

// Body of recording/05-bad-signature.body.json (RFC 7807 shape, status 400 per
// owner decision D-1).
export const recordedBadSignatureBody = {
  title: 'HMAC signature mismatch.',
  instance: 'cda9c2c2-4334',
  status: 400,
}

// Recording/01-login.body.json and 04-refresh.body.json carry these two fields.
// The recorded values are scrubbed, so every reply mints distinguishable
// tokens instead.
export const authBody = (suffix = '1'): { accessToken: string; refreshToken: string } => ({
  accessToken: `access-token-${suffix}`,
  refreshToken: `refresh-token-${suffix}`,
})

export const position = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...recordedPositionsPage0.positions[0],
  ...overrides,
})

export const page = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...recordedPositionsPage0,
  ...overrides,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * A fake of the two AMINA endpoints the adapter calls. `install` registers one
 * single-use interceptor per reply, so a provider call the scenario does not
 * account for fails as an unmatched request instead of silently reusing a
 * reply. Calls are recorded so a test can assert how many times the adapter
 * went to the provider, in which order, and with which headers.
 */
export class AminaFake {
  loginReplies: Reply[] = [{ statusCode: 200, body: authBody() }]
  refreshReplies: Reply[] = [{ statusCode: 200, body: authBody('2') }]
  loginRequests: CapturedAuthRequest[] = []
  refreshRequests: CapturedAuthRequest[] = []
  positionsRequests: CapturedPositionsRequest[] = []
  positionsDelayMs = 0

  private pages = new Map<number, Reply[]>()
  private installedHost?: string

  page(pageNumber: number, ...replies: Reply[]): this {
    this.pages.set(pageNumber, replies)
    if (this.installedHost) {
      this.registerPage(this.installedHost, pageNumber, replies)
    }
    return this
  }

  reset(): void {
    this.loginReplies = [{ statusCode: 200, body: authBody() }]
    this.refreshReplies = [{ statusCode: 200, body: authBody('2') }]
    this.loginRequests = []
    this.refreshRequests = []
    this.positionsRequests = []
    this.positionsDelayMs = 0
    this.pages = new Map()
    this.installedHost = undefined
  }

  install(host = AMINA_HOST): void {
    this.installedHost = host

    nock(host)
      .post(AUTH_PATH, (body) => isRecord(body) && 'refreshToken' in body)
      .times(1)
      .reply(createReply((headers, _uri, body) => this.recordAuth('refresh', headers, body)))

    nock(host)
      .post(AUTH_PATH, (body) => isRecord(body) && 'username' in body)
      .times(1)
      .reply(createReply((headers, _uri, body) => this.recordAuth('login', headers, body)))

    for (const [pageNumber, replies] of this.pages) {
      this.registerPage(host, pageNumber, replies)
    }
  }

  private registerPage(host: string, pageNumber: number, replies: Reply[]): void {
    for (const reply of replies) {
      const interceptor = nock(host, { encodedQueryParams: true })
        .get(POSITIONS_PATH)
        .query((query) => String(query.page) === String(pageNumber))
        .times(1)
      if (this.positionsDelayMs > 0) {
        interceptor.delayConnection(this.positionsDelayMs)
      }
      interceptor.reply(createReply((headers, uri) => this.recordPositions(headers, uri, reply)))
    }
  }

  private recordAuth(
    kind: 'login' | 'refresh',
    headers: WireHeaders,
    body: unknown,
  ): nock.ReplyFnResult {
    const parsed = typeof body === 'string' ? (JSON.parse(body) as Record<string, unknown>) : body
    const request: CapturedAuthRequest = {
      body: isRecord(parsed) ? parsed : undefined,
      headers,
      at: Date.now(),
    }

    if (kind === 'refresh') {
      this.refreshRequests.push(request)
      return toReply(nextReply(this.refreshReplies))
    }
    this.loginRequests.push(request)
    return toReply(nextReply(this.loginReplies))
  }

  private recordPositions(headers: WireHeaders, uri: string, reply: Reply): nock.ReplyFnResult {
    const query = new URLSearchParams(uri.split('?')[1] ?? '')
    this.positionsRequests.push({
      page: Number(query.get('page')),
      size: query.get('size'),
      path: uri,
      headers,
      at: Date.now(),
    })
    return toReply(reply)
  }
}

// nock's reply callback needs its own `this` for the request headers; this
// adapter keeps the fake in the closure instead of aliasing `this`.
const createReply = (
  handler: (headers: WireHeaders, uri: string, body: unknown) => nock.ReplyFnResult,
) =>
  function (this: nock.ReplyFnContext, uri: string, body: nock.Body): nock.ReplyFnResult {
    return handler(this.req.headers, uri, body)
  }

const nextReply = (queue: Reply[]): Reply => {
  if (queue.length === 0) {
    return { statusCode: 500, body: { title: 'no fixture reply for this provider request' } }
  }
  return queue.length === 1 ? queue[0] : (queue.shift() as Reply)
}

const toReply = (reply: Reply): nock.ReplyFnResult => [
  reply.statusCode,
  reply.body as nock.ReplyBody,
]
