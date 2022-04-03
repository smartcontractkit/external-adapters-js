import nock from 'nock'

export const mockConvertResponse = (): nock.Scope =>
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

export const mockResponseFailure = (): nock.Scope =>
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

export const mockLatestResponse = (): nock.Scope =>
  nock('https://data.fixer.io:443', { encodedQueryParams: true })
    .get('/latest')
    .query({ access_key: 'fake-api-key', base: 'EUR', symbols: 'USD' })
    .reply(
      200,
      {
        success: true,
        timestamp: 1646446742,
        base: 'EUR',
        date: '2022-03-05',
        rates: { USD: 1.094769 },
      },
      [
        'date',
        'Sat, 05 Mar 2022 02:19:16 GMT',
        'content-type',
        'application/json; Charset=UTF-8',
        'transfer-encoding',
        'chunked',
        'x-apilayer-transaction-id',
        '342409bb-9ca8-4804-838d-bbc4363a7ee7',
        'access-control-allow-methods',
        'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        'last-modified',
        'Sat, 05 Mar 2022 02:19:02 GMT',
        'etag',
        'c5a9e58dc315a5eb3bf39751b6fee7c5',
        'access-control-allow-origin',
        '*',
        'x-request-time',
        '0.010',
        'connection',
        'close',
      ],
    )
