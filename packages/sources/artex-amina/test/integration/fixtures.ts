import nock from 'nock'
import { API_HOST, DATE_HEADER, LOGIN_BODY } from '../fixtures'

const JSON_HEADERS = ['Content-Type', 'application/json']

export const authPath = '/api/b2c/v1/auth'

export const positionsPath = (portfolio: string): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

export const mockAuth = (host = API_HOST, body: object = LOGIN_BODY, status = 200): nock.Scope =>
  nock(host, { encodedQueryParams: true }).post(authPath).reply(status, body, JSON_HEADERS)

export const mockPositions = (
  portfolio: string,
  page: number,
  body: object,
  status = 200,
  date = DATE_HEADER,
  host = API_HOST,
  delayMs = 0,
): nock.Scope => {
  const interceptor = nock(host, { encodedQueryParams: true })
    .get(positionsPath(portfolio))
    .query({ page, size: 20 })
  if (delayMs > 0) {
    interceptor.delay(delayMs)
  }
  return interceptor.reply(status, body, ['Date', date, ...JSON_HEADERS])
}
