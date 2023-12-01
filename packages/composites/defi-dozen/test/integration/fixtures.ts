import nock from 'nock'

const symbols = [
  'UNI',
  'LINK',
  'AAVE',
  'GRT',
  'MKR',
  'COMP',
  'SUSHI',
  'SNX',
  'YFI',
  'BAT',
  'PERP',
  'BNT',
]

export const dataProviderConfig = {
  coinmarketcap: {
    providerUrlEnvVar: 'COINMARKETCAP_PROVIDER_URL',
    providerUrl: 'http://localhost:8082',
  },
}

export const mockDataProviderResponses = (): void => {
  for (const symbol of symbols) {
    nock(dataProviderConfig.coinmarketcap.providerUrl)
      .post('/', { data: { base: symbol, quote: 'USD', endpoint: 'crypto' } })
      .reply(
        200,
        {
          jobRunID: '1',
          providerStatusCode: 200,
          result: 20.509267101358265,
          statusCode: 200,
          data: {
            result: 20.509267101358265,
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
}
