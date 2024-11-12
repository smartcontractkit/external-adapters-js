import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.taapi.io', {
    encodedQueryParams: true,
  })
    .get('/avgprice')
    .query({ exchange: 'binance', symbol: 'BTC/USDT', interval: '1h', secret: 'fake-api-key' })
    .reply(200, () => ({ value: 66470.04250000001 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .get('/cci')
    .query({ exchange: 'binance', symbol: 'BTC/USDT', interval: '1h', secret: 'fake-api-key' })
    .reply(200, () => ({ value: -109.20727257685407 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
