import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.currencylayer.com', {
    encodedQueryParams: true,
  })
    .get('/convert')
    .query({ access_key: 'fake-api-key', from: 'BTC', to: 'USD', amount: 1 })
    .reply(
      200,
      (_, request) => ({
        success: true,
        terms: 'https://currencylayer.com/terms',
        privacy: 'https://currencylayer.com/privacy',
        query: { from: 'BTC', to: 'USD', amount: 1 },
        info: { timestamp: 1635800883, quote: 60535.74 },
        result: 60535.74,
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
