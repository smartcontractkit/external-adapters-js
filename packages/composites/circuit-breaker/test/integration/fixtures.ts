import nock from 'nock'

export const dataProviderConfig: {
  [index: string]: { providerUrlEnvVar: string; providerUrl: string }
} = {
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
  coinpaprika: {
    providerUrlEnvVar: 'COINPAPRIKA_ADAPTER_URL',
    providerUrl: 'http://localhost:8083',
  },
  wootrade: {
    providerUrlEnvVar: 'WOOTRADE_ADAPTER_URL',
    providerUrl: 'http://localhost:8084',
  },
}

export const mockDataProviderResponses = (): nock.Scope =>
  nock(dataProviderConfig.coinmarketcap.providerUrl)
    .post('/')
    .reply(
      200,
      {
        jobRunID: '1',
        providerStatusCode: 200,
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
      providerStatusCode: 200,
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
    'ETag',
    'W/"4c-80HqZxTKkxT2QbzJJxLmlKoGX1c"',
    'Date',
    'Mon, 20 Sep 2021 14:30:57 GMT',
    'Connection',
    'close',
  ])
