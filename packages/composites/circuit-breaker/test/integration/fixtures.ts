import nock from 'nock'

export const dataProviderConfig = {
  coingecko: {
    providerUrlEnvVar: 'ADAPTER_URL_COINGECKO',
    providerUrl: 'http://localhost:8081',
  },
  coinmarketcap: {
    providerUrlEnvVar: 'ADAPTER_URL_COINMARKETCAP',
    providerUrl: 'http://localhost:8082',
  },
  none: {
    providerUrlEnvVar: 'ADAPTER_URL_NONE',
    providerUrl: 'http://localhost:8089',
  },
  coinpaprika: {
    providerUrlEnvVar: 'ADAPTER_URL_COINPAPRIKA',
    providerUrl: 'http://localhost:8083',
  },
  wootrade: {
    providerUrlEnvVar: 'ADAPTER_URL_WOOTRADE',
    providerUrl: 'http://localhost:8084',
  },
}

export function mockDataProviderResponses() {
  nock(dataProviderConfig.coinmarketcap.providerUrl)
    .post('/')
    .reply(
      200,
      {
        jobRunID: '1',
        result: 3139.726053759448,
        statusCode: 200,
        data: {
          result: 3139.726053759448,
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

  nock(dataProviderConfig.coingecko.providerUrl)
    .post('/')
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

  nock(dataProviderConfig.coinpaprika.providerUrl)
    .post('/')
    .reply(500, {}, [
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
    ])

  nock(dataProviderConfig.wootrade.providerUrl)
    .post('/')
    .reply(500, {}, [
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
    ])
}
