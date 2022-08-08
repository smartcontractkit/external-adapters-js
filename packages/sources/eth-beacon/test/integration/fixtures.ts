import nock from 'nock'

export const mockPriceSuccess = (): nock.Scope =>
  // TODO
  nock('http://localhost:18081', {
    encodedQueryParams: true,
  })
    .get('')
    .query({})
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
