import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        daysRemaining: 42,
        hash: '0xabc123def456',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockResponseEmptyData = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => null, ['Content-Type', 'application/json', 'Connection', 'close'])
    .persist()

export const mockResponse500 = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(500, () => ({ error: 'Internal Server Error' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
    ])
    .persist()

export const mockResponse401 = (): nock.Scope =>
  nock('https://api.t-rize.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(401, () => ({ error: 'Unauthorized' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
    ])
    .persist()
