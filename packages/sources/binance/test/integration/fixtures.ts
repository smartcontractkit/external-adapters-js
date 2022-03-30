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

export const mockSubscribeResponse = {
  request: {
    method: 'SUBSCRIBE',
    params: ['ethbtc@miniTicker'],
    id: 1,
  },
  response: [
    {
      result: null,
      id: 1,
    },
    {
      e: '24hrMiniTicker',
      E: 1644423671193,
      s: 'ETHBTC',
      c: '0.07077300',
      o: '0.07061500',
      h: '0.07267800',
      l: '0.07032800',
      v: '54395.43030000',
      q: '3887.57522175',
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: {
    method: 'UNSUBSCRIBE',
    params: ['ethbtc@miniTicker'],
    id: 1,
  },
  response: {
    result: null,
    id: 1,
  },
}
