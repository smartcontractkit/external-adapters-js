import nock from 'nock'

export const mockPriceSuccess = (): nock.Scope =>
  nock('http://localhost:18081', {
    encodedQueryParams: true,
  })
    .get('/price')
    .query({
      base: 'ETH',
      quote: 'USD',
    })
    .reply(200, () => ({ price: 10 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
