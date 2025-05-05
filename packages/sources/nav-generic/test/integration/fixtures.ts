import nock from 'nock'

export const mockHappyPathResponseSuccess = (integrationName: string): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get(`/${integrationName}/nav`)
    .matchHeader('x-api-key', 'fake-api-key')
    .query({})
    .reply(
      200,
      () => ({ integration: 'test-integration', value: '100.00', timestamp_ms: 1746214393080 }),
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

export const mockValue0ResponseSuccess = (integrationName: string): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get(`/${integrationName}/nav`)
    .matchHeader('x-api-key', 'fake-api-key')
    .query({})
    .reply(200, () => ({ integration: 'test-0-val', value: '0', timestamp_ms: 1746214393080 }), [
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

export const mockResponseFailure = (integrationName: string): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get(`/${integrationName}/nav`)
    .matchHeader('x-api-key', 'fake-api-key')
    .query({})
    .reply(200, () => ({ integration: 'missing-value-integration', timestamp_ms: 1746214393080 }), [
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

export const mockErrorResponseFailure = (integrationName: string): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get(`/${integrationName}/nav`)
    .matchHeader('x-api-key', 'fake-api-key')
    .query({})
    .reply(403, () => ({}), [
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
