import nock from 'nock'

export const dataProviderConfig = {
  coingecko: {
    providerUrlEnvVar: 'COINGECKO_ADAPTER_URL',
    providerUrl: 'http://localhost:8081',
  },
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_ADAPTER_URL',
    providerUrl: 'http://localhost:8082',
  },
  none: {
    providerUrlEnvVar: 'NONE_ADAPTER_URL',
    providerUrl: 'http://localhost:8089',
  },
}

export const circuitBreakerUrl = 'http://localhost:8080'

export function mockDataProviderResponses() {
  nock(circuitBreakerUrl)
    .post('/', {
      id: 1,
      data: {
        firstSource: 'coingecko',
        secondSource: 'coinmarketcap',
        from: 'ETH',
        to: 'USD',
        days: 1,
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        data: {
          result: 3084.78,
        },
        result: 3084.78,
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

  nock(circuitBreakerUrl)
    .post('/', {
      id: 1,
      data: {
        firstSource: 'none',
        secondSource: 'coinmarketcap',
        from: 'ETH',
        to: 'USD',
        days: 1,
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        data: {
          result: 3084.78,
        },
        result: 3084.78,
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

  nock(dataProviderConfig.coingecko.providerUrl)
    .post('/', {
      id: '1',
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(
      200,
      {
        jobRunID: '1',
        result: 3068.06,
        statusCode: 200,
        data: {
          result: 3068.06,
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
        'W/"4c-80HqZxTKkxT2QbzJJxLmlKoGX1c"',
        'Date',
        'Mon, 20 Sep 2021 14:30:57 GMT',
        'Connection',
        'close',
      ],
    )
}
