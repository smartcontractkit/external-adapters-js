import nock from 'nock'

export const mockRateResponseSuccess = (): nock =>
  nock('https://api.coinbase.com')
    .get('/v2/prices/BTC-USD/spot')
    .query({ symbol: 'BTC', convert: 'USD' })
    .reply(200, (_, request) => ({ data: { base: 'BTC', currency: 'USD', amount: '57854.29' } }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
