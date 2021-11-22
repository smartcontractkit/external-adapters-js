import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://data.fixer.io', {
    encodedQueryParams: true,
  })
    .get('/api/convert')
    .query({ access_key: 'fake-api-key', from: 'EUR', to: 'USD', amount: 1 })
    .reply(
      200,
      (_, request) => ({
        success: true,
        query: { from: 'USD', to: 'EUR', amount: 1 },
        info: { timestamp: 1636390923, rate: 0.862805 },
        date: '2021-11-08',
        result: 0.862805,
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
  nock('https://data.fixer.io', {
    encodedQueryParams: true,
  })
    .get('/api/convert')
    .query({ access_key: 'fake-api-key', from: 'NON-EXISTING', to: 'USD', amount: 1 })
    .reply(
      200,
      (_, request) => ({
        success: false,
        error: {
          code: 402,
          type: 'invalid_from_currency',
          info: 'You have entered an invalid "from" property. [Example: from=EUR]',
        },
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
