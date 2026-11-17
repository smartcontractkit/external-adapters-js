import nock from 'nock'

export const AMINA_HOST = 'https://integration-test.aminagroup.io'
export const AUTH_PATH = '/api/b2c/v1/auth'
export const PORTFOLIO = '157769305'
export const POSITIONS_PATH = `/api/b2c/v1/securities/portfolios/${PORTFOLIO}/positions`
export const ISIN = 'US0378331005'

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export type WireHeaders = Record<string, string>
export type Reply = {
  statusCode: number
  body?: unknown
  // Answer with a connection failure instead of HTTP.
  error?: Error
  // Delay the connection: with a short API_TIMEOUT this produces a timeout.
  delayMs?: number
}

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

// A positions page as AMINA returns it for the configured portfolio: one
// position of 100 shares, `totalPages: 1` and `last: true`. Every fixture below
// is this body with a single field overridden.
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

// AMINA answers a request whose HMAC does not match with HTTP 400 and this
// RFC 7807 body: `title` names the signature mismatch and `status` repeats 400.
export const recordedBadSignatureBody = {
  title: 'HMAC signature mismatch.',
  instance: 'cda9c2c2-4334',
  status: 400,
}

// The AMINA auth endpoint answers both login and refresh with these two fields.
// The provider values are credentials, so every fixture reply mints
// distinguishable tokens instead.
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

// Page metadata that agrees with itself: `size` 20, `totalPages` derived from
// `totalElements`, `first` only on page 0 and `last` only on page totalPages-1
// (an empty portfolio is both first and last).
export const pageMetadata = (
  pageNumber: number,
  totalPages: number,
  totalElements: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  totalPages,
  totalElements,
  size: 20,
  number: pageNumber,
  first: pageNumber === 0,
  last: totalPages === 0 ? true : pageNumber + 1 === totalPages,
  ...overrides,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * A fake of the two AMINA endpoints the adapter calls. Each endpoint has one
 * persistent interceptor whose reply comes from a per-scenario queue: the
 * scenario's request consumes the queued replies in order, and a later
 * background pass that the scenario did not account for is answered with a
 * fast 400 instead of a connection error, so it is neither retried nor
 * recorded as a scenario request. Calls are recorded so a test can assert how
 * many times the adapter went to the provider and with which headers.
 */
export class AminaFake {
  loginReplies: Reply[] = [{ statusCode: 200, body: authBody() }]
  refreshReplies: Reply[] = [{ statusCode: 200, body: authBody('2') }]
  loginRequests: CapturedAuthRequest[] = []
  refreshRequests: CapturedAuthRequest[] = []
  positionsRequests: CapturedPositionsRequest[] = []
  strayRequests: CapturedPositionsRequest[] = []
  positionsDelayMs = 0

  private pages = new Map<number, Reply[]>()
  private installed = false

  page(pageNumber: number, ...replies: Reply[]): this {
    this.pages.set(pageNumber, replies)
    return this
  }

  reset(): void {
    this.loginReplies = [{ statusCode: 200, body: authBody() }]
    this.refreshReplies = [{ statusCode: 200, body: authBody('2') }]
    this.loginRequests = []
    this.refreshRequests = []
    this.positionsRequests = []
    this.strayRequests = []
    this.positionsDelayMs = 0
    this.pages = new Map()
  }

  install(host = AMINA_HOST): void {
    if (this.installed) {
      return
    }
    this.installed = true

    nock(host)
      .persist()
      .post(AUTH_PATH, (body) => isRecord(body) && 'refreshToken' in body)
      .reply(createReply((headers, _uri, body) => this.authOutcome('refresh', headers, body)))

    nock(host)
      .persist()
      .post(AUTH_PATH, (body) => isRecord(body) && 'username' in body)
      .reply(createReply((headers, _uri, body) => this.authOutcome('login', headers, body)))

    nock(host, { encodedQueryParams: true })
      .persist()
      .get(POSITIONS_PATH)
      .query(true)
      .reply(createReply((headers, uri) => this.positionsOutcome(headers, uri)))
  }

  private authOutcome(kind: 'login' | 'refresh', headers: WireHeaders, body: unknown): Outcome {
    const parsed = typeof body === 'string' ? (JSON.parse(body) as Record<string, unknown>) : body
    const request: CapturedAuthRequest = {
      body: isRecord(parsed) ? parsed : undefined,
      headers,
      at: Date.now(),
    }
    const queue = kind === 'refresh' ? this.refreshReplies : this.loginReplies
    if (kind === 'refresh') {
      this.refreshRequests.push(request)
    } else {
      this.loginRequests.push(request)
    }

    const reply = queue.shift()
    if (!reply) {
      return { reply: { statusCode: 400, body: { title: 'unexpected authentication request' } } }
    }
    return outcomeFor(reply, this.positionsDelayMs)
  }

  private positionsOutcome(headers: WireHeaders, uri: string): Outcome {
    const query = new URLSearchParams(uri.split('?')[1] ?? '')
    const request: CapturedPositionsRequest = {
      page: Number(query.get('page')),
      size: query.get('size'),
      path: uri,
      headers,
      at: Date.now(),
    }
    const reply = this.pages.get(request.page)?.shift()
    if (!reply) {
      this.strayRequests.push(request)
      return { reply: { statusCode: 400, body: { title: 'unexpected positions request' } } }
    }
    this.positionsRequests.push(request)
    return outcomeFor(reply, this.positionsDelayMs)
  }
}

type Outcome = { reply?: Reply; error?: Error; delayMs?: number }

const outcomeFor = (reply: Reply, defaultDelayMs: number): Outcome =>
  reply.error ? { error: reply.error } : { reply, delayMs: reply.delayMs ?? defaultDelayMs }

// nock's reply callback needs its own `this` for the request headers; this
// adapter keeps the fake in the closure instead of aliasing `this`. The
// callback form lets a queued reply be a connection error or a delayed answer.
const createReply = (handler: (headers: WireHeaders, uri: string, body: unknown) => Outcome) =>
  function (
    this: nock.ReplyFnContext,
    uri: string,
    body: nock.Body,
    callback: (err: NodeJS.ErrnoException | null, result: nock.ReplyFnResult) => void,
  ): void {
    const outcome = handler(this.req.headers, uri, body)
    const send = () => {
      if (outcome.error) {
        callback(outcome.error as NodeJS.ErrnoException, [502])
        return
      }
      const reply = outcome.reply as Reply
      callback(null, [reply.statusCode, reply.body as nock.ReplyBody])
    }
    if (outcome.delayMs && outcome.delayMs > 0) {
      setTimeout(send, outcome.delayMs)
      return
    }
    send()
  }
