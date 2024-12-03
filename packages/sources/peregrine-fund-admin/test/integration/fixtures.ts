import nock from 'nock'

export const mockNAVResponseSuccess = (): nock.Scope =>
  nock('https://fake-api', {
    encodedQueryParams: true,
  })
    .get('/nav')
    .reply(
      200,
      {
        seniorNAV: '0',
        juniorNav: '0',
        equityNav: '4377000000000000000000',
        totalLiability: '0',
        totalAccounts: '100000000000000000000000',
        totalCollateral: '4277000000000000000000000',
        updateTimestamp: '1731670136000000000000000000',
        assetId: '100',
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

export const mockReserveResponseSuccess = (): nock.Scope =>
  nock('https://fake-api', {
    encodedQueryParams: true,
  })
    .get('/reserve')
    .reply(
      200,
      {
        assetId: 100,
        totalValue: '100000000000000000000000',
        currencyBase: 'USD',
        accountIds: [102],
        updateDateTime: '2024-11-29T15:31:29.674790480',
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
