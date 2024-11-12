import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://btc.cryptoid.info', {
    encodedQueryParams: true,
  })
    .get('/btc/api.dws')
    .query({ q: 'getdifficulty' })
    .reply(200, () => 22674148233453.1, [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
