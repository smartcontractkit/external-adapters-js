import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://fake-ea-url', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        param: '1',
      },
    })
    .reply(200, () => ({ result: '1.001' }), [
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
