import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        data: '{"reserveAmount":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
        dataSignature: 'testsig',
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
