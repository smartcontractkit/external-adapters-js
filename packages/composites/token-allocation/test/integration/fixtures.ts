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
  for (const { providerUrl } of Object.values(dataProviderConfig)) {
    nock(providerUrl)
      .post('/', { id: 1, data: { base: 'WBTC', quote: 'EUR', endpoint: 'marketcap' } })
      .reply(
        200,
        {
          jobRunID: '1',
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
}
