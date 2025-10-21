import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .matchHeader('X-API-Key', 'myapikey')
    .query({})
    .reply(200, () => ({ PoR: 123000 }), [
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
