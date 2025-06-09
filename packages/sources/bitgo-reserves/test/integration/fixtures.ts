import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({
      data: '{"totalReserve":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
      dataSignature: 'testsig',
      lastUpdated: '2024-10-01T01:23:45Z',
      ripcord: false,
    }))

export const mockResponseRipcord = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({
      data: '{"totalReserve":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
      dataSignature: 'testsig',
      lastUpdated: '2024-10-01T01:23:45Z',
      ripcord: true,
    }))

export const mockResponseSuccessStringFalse = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({
      data: '{"totalReserve":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
      dataSignature: 'testsig',
      lastUpdated: '2024-10-01T01:23:45Z',
      ripcord: 'False',
    }))

export const mockResponseStringRipcord = (): nock.Scope =>
  nock('http://test-endpoint.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({
      data: '{"totalReserve":"12345678.90","cashReserve":"2345678.90","investedReserve":"10000000.00","lastUpdated":"2024-12-10T01:23:45Z"}',
      dataSignature: 'testsig',
      lastUpdated: '2024-10-01T01:23:45Z',
      ripcord: 'True',
    }))

export const mockResponseSuccessC1 = (): nock.Scope =>
  nock('http://test-endpoint-c1.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(200, () => ({
      data: '{"totalReserve":"12345678.91","cashReserve":"2345678.91","investedReserve":"10000000.01","lastUpdated":"2024-12-10T01:23:45Z"}',
      dataSignature: 'testsig',
      lastUpdated: '2024-10-01T01:23:45Z',
      ripcord: false,
    }))
