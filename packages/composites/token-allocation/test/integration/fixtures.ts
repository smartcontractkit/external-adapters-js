import nock from 'nock'

export const dataProviderConfig = {
  amberdata: {
    providerUrlEnvVar: 'AMBERDATA_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3000',
  },
  coinapi: {
    providerUrlEnvVar: 'COINAPI_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3001',
  },
  coingecko: {
    providerUrlEnvVar: 'COINGECKO_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3002',
    isBatched: true,
  },
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3003',
    isBatched: true,
  },
  coinpaprika: {
    providerUrlEnvVar: 'COINPAPRIKA_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3004',
    isBatched: true,
    shouldSendBatchedRequest: true,
  },
  cryptocompare: {
    providerUrlEnvVar: 'CRYPTOCOMPARE_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3005',
    isBatched: true,
  },
  kaiko: {
    providerUrlEnvVar: 'KAIKO_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3006',
  },
  nomics: {
    providerUrlEnvVar: 'NOMICS_DATA_PROVIDER_URL',
    providerUrl: 'http://localhost:3007',
    isBatched: true,
  },
  tiingo: {
    providerUrl: 'http://localhost:3008',
    providerUrlEnvVar: 'TIINGO_DATA_PROVIDER_URL',
  },
}

export function mockDataProviderResponses() {
  for (const { providerUrl, shouldSendBatchedRequest } of Object.values(dataProviderConfig)) {
    if (shouldSendBatchedRequest) {
      mockBatchedRequest(providerUrl)
    } else {
      mockSingleRequests(providerUrl)
    }
  }
}

const mockBatchedRequest = (providerUrl: string) => {
  nock(providerUrl)
    .post('/', { id: 1, data: { base: ['DAI', 'WBTC'], quote: 'USD', endpoint: 'crypto' } })
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
                  base: 'WBTC',
                  quote: 'USD',
                },
                rateLimitMaxAge: 57603,
              },
              39493.577427914,
            ],
            [
              {
                id: '1',
                data: {
                  endpoint: 'crypto',
                  resultPath: 'price',
                  base: 'DAI',
                  quote: 'USD',
                },
                rateLimitMaxAge: 57603,
              },
              1.0019360130726,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
  nock(providerUrl)
    .post('/', { id: 1, data: { base: ['DAI', 'WBTC'], quote: 'EUR', endpoint: 'crypto' } })
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
                  base: 'WBTC',
                  quote: 'EUR',
                },
                rateLimitMaxAge: 115207,
              },
              35308.08752844105,
            ],
            [
              {
                id: '1',
                data: {
                  endpoint: 'crypto',
                  resultPath: 'price',
                  base: 'DAI',
                  quote: 'EUR',
                },
                rateLimitMaxAge: 115207,
              },
              0.895751834891022,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
  nock(providerUrl)
    .post('/', { id: 1, data: { base: ['DAI', 'WBTC'], quote: 'USD', endpoint: 'marketcap' } })
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
                  endpoint: 'marketcap',
                  resultPath: 'market_cap',
                  base: 'WBTC',
                  quote: 'USD',
                },
                rateLimitMaxAge: 230414,
              },
              10393208823,
            ],
            [
              {
                id: '1',
                data: {
                  endpoint: 'marketcap',
                  resultPath: 'market_cap',
                  base: 'DAI',
                  quote: 'USD',
                },
                rateLimitMaxAge: 230414,
              },
              6491926172,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
  nock(providerUrl)
    .post('/', { id: 1, data: { base: ['DAI', 'WBTC'], quote: 'EUR', endpoint: 'marketcap' } })
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
                  endpoint: 'marketcap',
                  resultPath: 'market_cap',
                  base: 'WBTC',
                  quote: 'EUR',
                },
                rateLimitMaxAge: 288018,
              },
              9291746930.083876,
            ],
            [
              {
                id: '1',
                data: {
                  endpoint: 'marketcap',
                  resultPath: 'market_cap',
                  base: 'DAI',
                  quote: 'EUR',
                },
                rateLimitMaxAge: 288018,
              },
              5803918318.808532,
            ],
          ],
        },
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
}

const mockSingleRequests = (providerUrl: string) => {
  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'EUR', endpoint: 'marketcap' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'USD', endpoint: 'marketcap' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'EUR', endpoint: 'price' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'EUR', endpoint: 'marketcap' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'USD', endpoint: 'marketcap' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'USD', endpoint: 'price' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'EUR', endpoint: 'price' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'USD', endpoint: 'price' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'EUR', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'WBTC', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )

  nock(providerUrl)
    .post('/', { id: 1, data: { base: 'DAI', quote: 'EUR', endpoint: 'crypto' } })
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
        data: {
          result: 130.27,
        },
        result: 130.27,
        statusCode: 200,
      },
      [
        'X-Powered-By',
        'Express',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '714',
        'ETag',
        'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
        'Date',
        'Wed, 23 Jun 2021 22:38:43 GMT',
        'Connection',
        'close',
      ],
    )
}
