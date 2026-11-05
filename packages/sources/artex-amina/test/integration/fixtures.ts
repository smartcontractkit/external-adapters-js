import nock from 'nock'
import { buildHmacPayload, signHmac } from '../../src/transport/signing'

export const HOST = 'https://amina.test'
export const PORTFOLIO_NO = 157769305
export const ISIN = 'US0378331005'
export const AGREEMENT = '157769'
export const USER_AGENT = 'chainlink-artex-amina-adapter/1.0.0'
export const USER_ID = '25742014'
export const HMAC_SECRET = 'hmac-secret'
export const ACCESS_TOKEN = 'access-token'
export const REFRESH_TOKEN = 'refresh-token'

export function mockAuth(accessToken = ACCESS_TOKEN, refreshToken = REFRESH_TOKEN): nock.Scope {
  return nock(HOST)
    .post('/api/b2c/v1/auth')
    .matchHeader('X-Request-Id', /.+/)
    .matchHeader('X-Correlation-Id', /.+/)
    .reply(200, { accessToken, refreshToken })
}

export function mockRefresh(accessToken = ACCESS_TOKEN, refreshToken = REFRESH_TOKEN): nock.Scope {
  return nock(HOST)
    .post('/api/b2c/v1/auth', { refreshToken: REFRESH_TOKEN })
    .matchHeader('X-Request-Id', /.+/)
    .matchHeader('X-Correlation-Id', /.+/)
    .reply(200, { accessToken, refreshToken })
}

export function position(isin = ISIN, quantity = 100.5): { isin: string; quantity: number } {
  return { isin, quantity }
}

export function page(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    positions: [],
    last: true,
    ...overrides,
  }
}

export function mockPositions(
  pageNo: number,
  body: Record<string, unknown>,
  token = ACCESS_TOKEN,
): nock.Scope {
  return nock(HOST)
    .get('/api/b2c/v1/securities/portfolios/157769305/positions')
    .query({ page: pageNo, size: 20 })
    .matchHeader('Authorization', `Bearer ${token}`)
    .matchHeader('Amina-Context-Agreement-Number', AGREEMENT)
    .matchHeader('Amina-Uri', '/api/b2c/v1/securities/portfolios/157769305/positions')
    .matchHeader('User-Agent', USER_AGENT)
    .matchHeader('Amina-Nonce', /.+/)
    .matchHeader('Amina-Timestamp', /^\d+$/)
    .matchHeader('Amina-Signature', /.+/)
    .reply(function (this: nock.ReplyFnContext) {
      const headers = this.req.headers
      const expected = signHmac(
        buildHmacPayload({
          method: 'GET',
          timestamp: headers['amina-timestamp'],
          nonce: headers['amina-nonce'],
          uri: headers['amina-uri'],
          userId: USER_ID,
          agreementNumber: AGREEMENT,
        }),
        HMAC_SECRET,
      )
      if (headers['amina-signature'] !== expected) {
        return [403, { title: 'Bad signature' }]
      }
      return [200, body]
    })
}

export function mockPositionsError(
  pageNo: number,
  status: number,
  body: Record<string, unknown> = {},
  token = ACCESS_TOKEN,
): nock.Scope {
  return nock(HOST)
    .get('/api/b2c/v1/securities/portfolios/157769305/positions')
    .query({ page: pageNo, size: 20 })
    .matchHeader('Authorization', `Bearer ${token}`)
    .reply(status, body)
}
