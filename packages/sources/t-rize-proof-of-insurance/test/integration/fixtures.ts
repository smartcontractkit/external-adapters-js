import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        daysRemaining: 42,
        hash: '0xabc123def456',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

export const mockResponseNoData = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => null, ['Content-Type', 'application/json', 'Connection', 'close'])

export const mockResponseUnauthorized = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      401,
      () => ({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockResponseServerError = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      500,
      () => ({
        error: 'Internal Server Error',
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
