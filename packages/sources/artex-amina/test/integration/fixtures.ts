import nock from 'nock'

export const HOST = 'https://sandbox.amina.example'

const PORTFOLIO = '900000001'
const ISIN = 'DE0000000001'

export const USER_ID = '31415926'
export const PASSWORD = 'test-password'
export const HMAC_SECRET = 'test-hmac-secret'
export const AGREEMENT = '654321-7'

export const ACCESS_TOKEN = 'test-access-token'
export const REFRESH_TOKEN = 'test-refresh-token'
export const RELOGIN_ACCESS_TOKEN = 'relogin-access-token'

export const AUTH_PATH = '/api/b2c/v1/auth'
const positionsPath = (portfolio = PORTFOLIO): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

// The field names, nesting and value types follow the recorded positions reply.
export const position = (isin = ISIN, quantity = 7654.3219): Record<string, unknown> => ({
  isin,
  marketValueChf: 4321.9876,
  quantity,
  buyingRate: 250.5,
  costPrice: 2100.75,
  performance: 2.3456789,
  rate: 250.5,
  instrument: {
    isin,
    symbol: 'TEST',
    type: 1,
    name: 'Test Instrument',
    shortName: 'Test',
    exchange: 'TESTEX',
    price: 250.5,
    currency: 'CHF',
  },
  currency: 'CHF',
})

// The field names and value types follow the recorded positions page.
export const page = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  positions: [],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  ...overrides,
})

// The fixture factory keeps the recorded field names and value types and lets a
// test use a host different from the sandbox host.
export const makeFixtures = (host: string) => {
  const mockLogin = (
    accessToken: string | (() => string) = ACCESS_TOKEN,
    refreshToken = REFRESH_TOKEN,
    onRequest?: () => void,
  ): nock.Scope =>
    nock(host)
      .post(AUTH_PATH, { username: USER_ID, password: PASSWORD })
      .matchHeader('Content-Type', /application\/json/)
      .matchHeader('X-Request-Id', UUID)
      .matchHeader('X-Correlation-Id', UUID)
      .reply(200, () => {
        onRequest?.()
        return {
          accessToken: typeof accessToken === 'function' ? accessToken() : accessToken,
          refreshToken,
        }
      })

  const mockRefreshError = (status: number, body: Record<string, unknown> | string): nock.Scope =>
    nock(host)
      .post(AUTH_PATH, { refreshToken: REFRESH_TOKEN })
      .matchHeader('Content-Type', /application\/json/)
      .matchHeader('X-Request-Id', UUID)
      .matchHeader('X-Correlation-Id', UUID)
      .reply(status, body)

  const mockPositionsPage = (
    pageNo: number,
    body: Record<string, unknown>,
    token = ACCESS_TOKEN,
    portfolio = PORTFOLIO,
    onRequest?: () => void,
  ): nock.Scope =>
    nock(host, { encodedQueryParams: true })
      .get(positionsPath(portfolio))
      .query({ page: String(pageNo), size: '20' })
      .matchHeader('Authorization', `Bearer ${token}`)
      .matchHeader('X-Request-Id', UUID)
      .matchHeader('X-Correlation-Id', UUID)
      .matchHeader('Amina-Nonce', UUID)
      .matchHeader('Amina-Timestamp', /^\d+$/)
      .matchHeader('Amina-Uri', positionsPath(portfolio))
      .matchHeader('Amina-Signature', BASE64)
      .matchHeader('Amina-Context-Agreement-Number', AGREEMENT)
      .reply(200, () => {
        onRequest?.()
        return body
      })

  const mockPositionsError = (
    pageNo: number,
    status: number,
    body: Record<string, unknown> | string = '',
    token = ACCESS_TOKEN,
    portfolio = PORTFOLIO,
    headers: Record<string, string> = {},
    onRequest?: () => void,
  ): nock.Scope =>
    nock(host, { encodedQueryParams: true })
      .get(positionsPath(portfolio))
      .query({ page: String(pageNo), size: '20' })
      .matchHeader('Authorization', `Bearer ${token}`)
      .reply(
        status,
        () => {
          onRequest?.()
          return body
        },
        headers,
      )

  return {
    mockLogin,
    mockRefreshError,
    mockPositionsPage,
    mockPositionsError,
  }
}
