import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .matchHeader('X-API-Key', 'myapikey')
    .query({})
    .reply(200, () => ({ PoR: 123000 }), [
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

export const mockMultiHttpResponseSuccess = (): nock.Scope =>
  nock('https://multi-api.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .matchHeader('Authorization', 'Bearer test-token')
    .query({})
    .reply(
      200,
      () => ({
        client: 'opendeltanx8',
        net_asset_value: 1.004373266745,
        asset_under_management: 30127047.47,
        outstanding_shares: 29995867.54,
        min_rate: 0.99,
        max_rate: 1.01,
        updatedAt: '2026-01-19T06:56:22.194Z',
        ripcord: false,
        ripcordDetails: [],
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

export const mockMultiHttpRipcordActivated = (): nock.Scope =>
  nock('https://ripcord-api.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({})
    .reply(
      200,
      () => ({
        net_asset_value: 1.0,
        ripcord: true,
        ripcordDetails: ['Error: stale data'],
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

export const mockMultiHttpMissingPath = (): nock.Scope =>
  nock('https://missing-path-api.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({})
    .reply(
      200,
      () => ({
        net_asset_value: 1.0,
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
