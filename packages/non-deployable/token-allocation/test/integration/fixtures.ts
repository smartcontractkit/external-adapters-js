import nock from 'nock'

export type TokenAllocationTest = {
  [key: string]: {
    providerUrlEnvVar: string
    providerUrl: string
    additional: Record<string, string> | undefined
  }
}

export const dataProviderConfig: TokenAllocationTest = {
  amberdata: {
    providerUrlEnvVar: 'AMBERDATA_ADAPTER_URL',
    providerUrl: 'http://localhost:3000',
    additional: {},
  },
  coinapi: {
    providerUrlEnvVar: 'COINAPI_ADAPTER_URL',
    providerUrl: 'http://localhost:3001',
    additional: {},
  },
  coingecko: {
    providerUrlEnvVar: 'COINGECKO_ADAPTER_URL',
    providerUrl: 'http://localhost:3002',
    additional: {},
  },
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_ADAPTER_URL',
    providerUrl: 'http://localhost:3003',
    additional: {},
  },
  coinpaprika: {
    providerUrlEnvVar: 'COINPAPRIKA_ADAPTER_URL',
    providerUrl: 'http://localhost:3004',
    additional: {},
  },
  cryptocompare: {
    providerUrlEnvVar: 'CRYPTOCOMPARE_ADAPTER_URL',
    providerUrl: 'http://localhost:3005',
    additional: {},
  },
  kaiko: {
    providerUrlEnvVar: 'KAIKO_ADAPTER_URL',
    providerUrl: 'http://localhost:3006',
    additional: {
      sort: 'asc',
    },
  },
  tiingo: {
    providerUrl: 'http://localhost:3008',
    providerUrlEnvVar: 'TIINGO_ADAPTER_URL',
    additional: {},
  },
  'blocksize-capital': {
    providerUrl: 'http://localhost:3010',
    providerUrlEnvVar: 'BLOCKSIZE_CAPITAL_ADAPTER_URL',
    additional: {},
  },
  blocksize_capital: {
    providerUrl: 'http://localhost:3010',
    providerUrlEnvVar: 'BLOCKSIZE_CAPITAL_ADAPTER_URL',
    additional: {},
  },
  coinranking: {
    providerUrlEnvVar: 'COINRANKING_ADAPTER_URL',
    providerUrl: 'http://localhost:3009',
    additional: {},
  },
}

export function mockDataProviderResponses(withAdditional = false): void {
  for (const { providerUrl, additional } of Object.values(dataProviderConfig)) {
    const additionalInput = withAdditional ? additional : undefined
    mockSingleRequests(providerUrl, additionalInput)
  }
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
          someData: 130.27,
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
