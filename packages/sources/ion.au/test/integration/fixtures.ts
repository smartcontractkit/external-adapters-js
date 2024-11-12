import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://ion-digital-proof-of-reserve.instruxi.dev/', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({})
    .reply(200, () => ({ total_reserve: 180 }), [
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
