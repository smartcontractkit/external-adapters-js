import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        totalReserve: 1234567.89,
        lastUpdated: '2024-10-01T01:23:45Z',
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
