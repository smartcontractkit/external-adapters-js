import nock from 'nock'

export const mockPostResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .post('/cryptocurrency/price', {
      symbol: 'ETH',
      convert: 'USD',
    })
    .reply(200, () => ({ ETH: { price: 10000 } }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
