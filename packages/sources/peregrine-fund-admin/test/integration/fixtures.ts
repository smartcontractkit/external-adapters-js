import nock from 'nock'

export const mockNAVResponseSuccess = (): nock.Scope =>
  nock('https://fund-admin-data-adapter-v1-960005989691.europe-west2.run.app', {
    encodedQueryParams: true,
  })
    .get('/api/v1/nav/')
    .query({
      assetId: 100,
    }) // Endpoint to mock
    .reply(
      200,
      {
        Id: null,
        assetId: '100',
        seniorNAV: '0',
        juniorNav: '0',
        equityNav: '4377000000000000000000',
        totalLiability: '0',
        totalAccounts: '100000000000000000000000',
        totalCollateral: '4277000000000000000000000',
        collateral: [52, 53, 54, 55, 56, 57, 58, 59, 60],
        accounts: [102],
        updateTimestamp: '1731670136000000000000000000',
        id: null,
      },
      {
        // Mocked headers
        'Content-Type': 'application/json',
        'X-Custom-Header': 'CustomHeaderValue',
        'Cache-Control': 'no-cache',
      },
    )
    .persist()

export const mockReserveResponseSuccess = (): nock.Scope =>
  nock('https://fund-admin-data-adapter-v1-960005989691.europe-west2.run.app', {
    encodedQueryParams: true,
  })
    .get('/api/v1/reservers/')
    .query({
      assetId: 100,
    }) // Endpoint to mock
    .reply(
      200,
      {
        assetId: 100,
        totalValue: '100000000000000000000000',
        currencyBase: 'USD',
        accountIds: [102],
        updateDateTime: '2024-11-29T15:31:29.674790480',
      },
      {
        // Mocked headers
        'Content-Type': 'application/json',
        'X-Custom-Header': 'CustomHeaderValue',
        'Cache-Control': 'no-cache',
      },
    )
    .persist()
