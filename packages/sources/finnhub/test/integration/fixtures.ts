import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://finnhub.io/api/v1', {
    encodedQueryParams: true,
  })
    .get('/quote')
    .query({ token: 'fake-api-key', symbol: 'OANDA:EUR_USD' })
    .reply(
      200,
      (_, request) => ({
        c: 1.15894,
        d: 0.00226,
        dp: 0.1954,
        h: 1.15943,
        l: 1.15497,
        o: 1.1554,
        pc: 1.15668,
        t: 1636322400,
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

export const mockResponseFailure = (): nock =>
  nock('https://finnhub.io/api/v1', {
    encodedQueryParams: true,
  })
    .get('/quote')
    .query({ token: 'fake-api-key', symbol: 'NON-EXISTING' })
    .reply(200, (_, request) => ({ c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
