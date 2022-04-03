import nock from 'nock'

export function mockCoinpaprikaAdapterResponseSuccess() {
  nock('http://localhost:8081')
    .post('/', { id: '1', data: { base: ['AVAX'], quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        statusCode: 200,
        data: {
          results: [
            [
              {
                id: '1',
                data: {
                  endpoint: 'crypto',
                  resultPath: 'price',
                  base: 'AVAX',
                  quote: 'USD',
                },
                rateLimitMaxAge: 57603,
              },
              78.9965141378473,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Mon, 08 Nov 2021 12:31:31 GMT',
        'X-RateLimit-Reset',
        '1636374693',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '92',
        'ETag',
        'W/"5c-z1n244ezdMwpLTzNvSBGxzBiHkA"',
        'Connection',
        'close',
      ],
    )
}

export function mockCoinpaprikaAdapterResponseZeroValue() {
  nock('http://localhost:8081')
    .post('/', { id: '1', data: { base: ['AVAX'], quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        statusCode: 200,
        data: {
          results: [
            [
              {
                id: '1',
                data: {
                  endpoint: 'crypto',
                  resultPath: 'price',
                  base: 'AVAX',
                  quote: 'USD',
                },
                rateLimitMaxAge: 57603,
              },
              0,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Mon, 08 Nov 2021 12:31:31 GMT',
        'X-RateLimit-Reset',
        '1636374693',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '92',
        'ETag',
        'W/"5c-z1n244ezdMwpLTzNvSBGxzBiHkA"',
        'Connection',
        'close',
      ],
    )
}
