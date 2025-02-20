import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api-endpoint-placeholder.com', {
    encodedQueryParams: true,
  })
    .post('/')
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

export const mockResponseError = (): nock.Scope =>
  nock('https://api-endpoint-placeholder.com', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(
      400,
      {
        error: 'Invalid CHAIN_ID provided',
        message: 'The CHAIN_ID must be a valid chain identifier',
      },
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
