import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api-endpoint-placeholder.com', {
    encodedQueryParams: true,
  })
    .post('/v1/sql')
    .reply(
      200,
      [{ TOTAL_RESERVE: 300000000 }],
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
