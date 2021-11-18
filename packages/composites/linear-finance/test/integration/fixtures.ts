import nock from 'nock'

export const adapterConfig = {
  coinmarketcap: {
    adapterUrlEnvVar: 'ADAPTER_URL_COINMARKETCAP',
    adapterUrl: 'http://localhost:8082',
  },
}

export const mockAdapterResponseSuccess = (): nock =>
  nock(adapterConfig.coinmarketcap.adapterUrl)
    .persist()
    .post('/', { id: /^\d+$/, data: { base: /^\w+$/, quote: 'USD', endpoint: 'crypto' } })
    .reply(
      200,
      (_, request) => ({
        jobRunID: request['id'],
        data: {
          result: 100.0,
        },
        result: 100.0,
        statusCode: 200,
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
