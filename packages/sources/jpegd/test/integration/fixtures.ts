import nock from 'nock'

export const mockPunksValueResponseSuccess = (): nock =>
  nock('http://localhost:8080', { encodedQueryParams: true })
    .post('/', { id: '1', data: { block: 'latest' } })
    .reply(
      200,
      {
        jobRunID: '1',
        result: 71.71525868055556,
        providerStatusCode: 200,
        statusCode: 200,
        data: { result: 71.71525868055556 },
      },
      [
        'X-Powered-By',
        'Express',
        'X-RateLimit-Limit',
        '250',
        'X-RateLimit-Remaining',
        '249',
        'Date',
        'Wed, 02 Mar 2022 08:10:51 GMT',
        'X-RateLimit-Reset',
        '1646208657',
        'Content-Type',
        'application/json; charset=utf-8',
        'Content-Length',
        '121',
        'ETag',
        'W/"79-dQlIsuFIjgtJRe7/r9gqSuuZl+E"',
        'Connection',
        'close',
      ],
    )
