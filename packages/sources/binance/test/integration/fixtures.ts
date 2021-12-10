import nock from 'nock'

export const mockRateResponseSuccess = (): nock =>
  nock('https://api.binance.com', {
    encodedQueryParams: true,
  })
    .get('/api/v3/ticker/price')
    .query({ symbol: 'ETHBTC' })
    .reply(200, (_, request) => ({ symbol: 'ETHBTC', price: '0.07077300' }))

export const mockRateResponseFailure = (): nock =>
  nock('https://api.binance.com', {
    encodedQueryParams: true,
  })
    .get('/api/v3/ticker/price')
    .query({ symbol: 'NONEXISTING' })
    .reply(400, (_, request) => ({ code: -1121, msg: 'Invalid symbol.' }))
