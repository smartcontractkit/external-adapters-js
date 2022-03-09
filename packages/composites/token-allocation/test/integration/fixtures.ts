import nock from 'nock'

export const dataProviderConfig = {
  amberdata: {
    providerUrlEnvVar: 'AMBERDATA_ADAPTER_URL',
    providerUrl: 'http://localhost:3000',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  coinapi: {
    providerUrlEnvVar: 'COINAPI_ADAPTER_URL',
    providerUrl: 'http://localhost:3001',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  coingecko: {
    providerUrlEnvVar: 'COINGECKO_ADAPTER_URL',
    providerUrl: 'http://localhost:3002',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_ADAPTER_URL',
    providerUrl: 'http://localhost:3003',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  coinpaprika: {
    providerUrlEnvVar: 'COINPAPRIKA_ADAPTER_URL',
    providerUrl: 'http://localhost:3004',
    shouldSendBatchedRequest: true,
    additional: {},
  },
  cryptocompare: {
    providerUrlEnvVar: 'CRYPTOCOMPARE_ADAPTER_URL',
    providerUrl: 'http://localhost:3005',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  kaiko: {
    providerUrlEnvVar: 'KAIKO_ADAPTER_URL',
    providerUrl: 'http://localhost:3006',
    shouldSendBatchedRequest: false,
    additional: {
      sort: 'asc',
    },
  },
  nomics: {
    providerUrlEnvVar: 'NOMICS_ADAPTER_URL',
    providerUrl: 'http://localhost:3007',
    shouldSendBatchedRequest: false,
    additional: {},
  },
  tiingo: {
    providerUrl: 'http://localhost:3008',
    providerUrlEnvVar: 'TIINGO_ADAPTER_URL',
    shouldSendBatchedRequest: false,
    additional: {},
  },
}

export function mockDataProviderResponses(withAdditional = false): void {
  for (const { providerUrl, shouldSendBatchedRequest, additional } of Object.values(
    dataProviderConfig,
  )) {
    const additionalInput = withAdditional ? additional : undefined
    if (shouldSendBatchedRequest) {
      mockBatchedRequest(providerUrl, additionalInput)
    } else {
      mockSingleRequests(providerUrl, additionalInput)
    }
  }
}

const mockBatchedRequest = (providerUrl: string, additional = {}) => {
  nock(providerUrl)
    .post('/', {
      id: '1',
      data: { base: ['DAI', 'WBTC'], quote: 'USD', endpoint: 'crypto', ...additional },
    })
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
    .post('/', {
      id: '1',
      data: { base: ['DAI', 'WBTC'], quote: 'EUR', endpoint: 'crypto', ...additional },
    })
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
    .post('/', {
      id: '1',
      data: { base: ['DAI', 'WBTC'], quote: 'USD', endpoint: 'marketcap', ...additional },
    })
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
    .post('/', {
      id: '1',
      data: { base: ['DAI', 'WBTC'], quote: 'EUR', endpoint: 'marketcap', ...additional },
    })
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

const mockSingleRequests = (providerUrl: string, additional = {}) => {
  nock(providerUrl)
    .post('/', {
      id: '1',
      data: { base: 'WBTC', quote: 'EUR', endpoint: 'marketcap', ...additional },
    })
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
    .post('/', {
      id: '1',
      data: { base: 'WBTC', quote: 'USD', endpoint: 'marketcap', ...additional },
    })
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
    .post('/', { id: '1', data: { base: 'WBTC', quote: 'EUR', endpoint: 'price', ...additional } })
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
    .post('/', {
      id: '1',
      data: { base: 'DAI', quote: 'EUR', endpoint: 'marketcap', ...additional },
    })
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
    .post('/', {
      id: '1',
      data: { base: 'DAI', quote: 'USD', endpoint: 'marketcap', ...additional },
    })
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
    .post('/', { id: '1', data: { base: 'WBTC', quote: 'USD', endpoint: 'price', ...additional } })
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
    .post('/', { id: '1', data: { base: 'DAI', quote: 'EUR', endpoint: 'price', ...additional } })
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
    .post('/', { id: '1', data: { base: 'DAI', quote: 'USD', endpoint: 'price', ...additional } })
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
    .post('/', { id: '1', data: { base: 'WBTC', quote: 'EUR', endpoint: 'crypto', ...additional } })
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
    .post('/', { id: '1', data: { base: 'WBTC', quote: 'USD', endpoint: 'crypto', ...additional } })
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
    .post('/', { id: '1', data: { base: 'DAI', quote: 'USD', endpoint: 'crypto', ...additional } })
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
    .post('/', { id: '1', data: { base: 'DAI', quote: 'EUR', endpoint: 'crypto', ...additional } })
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
