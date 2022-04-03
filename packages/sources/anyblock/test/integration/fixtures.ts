import nock from 'nock'

export const mockVwapSuccess = (): nock =>
  nock('https://api.anyblock.tools:443', {
    encodedQueryParams: true,
    reqheaders: {
      authorization: 'Bearer test_api_token',
    },
  })
    .get('/market/AMPL_USD/daily-volume/')
    .query({ roundDay: 'true' })
    .reply(
      200,
      {
        start: 1646179200000,
        end: 1646265600000,
        vwap: 1.075280551563453,
        volume: 101016.30241259992,
      },
      [
        'Date',
        'Thu, 03 Mar 2022 14:32:08 GMT',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '96',
        'Connection',
        'close',
        'access-control-allow-credentials',
        'true',
        'etag',
        'W/"60-yMN5RPuD5657bCx+zQMF8JUgcLI"',
        'ratelimit-limit',
        '120',
        'ratelimit-remaining',
        '98',
        'ratelimit-reset',
        '2305',
        'strict-transport-security',
        'max-age=15552000; includeSubDomains',
        'vary',
        'Origin, Accept-Encoding',
        'x-content-type-options',
        'nosniff',
        'x-dns-prefetch-control',
        'off',
        'x-download-options',
        'noopen',
        'x-frame-options',
        'SAMEORIGIN',
        'x-xss-protection',
        '1; mode=block',
        'CF-Cache-Status',
        'DYNAMIC',
      ],
    )
