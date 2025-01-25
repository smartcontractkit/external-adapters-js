import nock from 'nock'

export const mockTestResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        data: '{"totalReserve":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
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

export const mockStagingResponseSuccess = (): nock.Scope =>
  nock('http://staging-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        data: '{"totalReserve":"98765432.10","cashReserve":"8765432.10","investedReserve":"20000000.00","lastUpdated":"2024-12-10T01:23:46Z"}',
        dataSignature: 'stagingsig',
        lastUpdated: '2024-10-01T01:23:46Z',
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
