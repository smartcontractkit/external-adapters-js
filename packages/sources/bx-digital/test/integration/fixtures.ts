import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://fake-api', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => [
        { securityId: '1', lastModifiedTime: 1733155814, closingPrice: '111.11' },
        { securityId: '2', lastModifiedTime: 1733153530, closingPrice: '222.22' },
        { securityId: '3', lastModifiedTime: 1733156220, closingPrice: '333.33' },
      ],
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
