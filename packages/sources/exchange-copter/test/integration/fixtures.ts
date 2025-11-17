import nock from 'nock'

export const mockTotalReserveResponseSuccess = (): nock.Scope =>
  nock('https://api.exchangecopter.com', {
    encodedQueryParams: true,
  })
    .get('/arsx/reserve')
    .reply(200, {
      timestamp: '2025-10-22T08:41:59.058Z',
      accounts: [
        {
          accountName: 'Arsx Base Testnet',
          totalReserve: 88072,
          totalToken: 85426,
        },
        {
          accountName: 'Worldchain Base Testnet',
          totalReserve: 0,
          totalToken: 0,
        },
      ],
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockTotalReserveWorldchainResponseSuccess = (): nock.Scope =>
  nock('https://api.exchangecopter.com', {
    encodedQueryParams: true,
  })
    .get('/arsx/reserve')
    .reply(200, {
      timestamp: '2025-10-22T08:41:59.058Z',
      accounts: [
        {
          accountName: 'Arsx Base Testnet',
          totalReserve: 88072,
          totalToken: 85426,
        },
        {
          accountName: 'Worldchain Base Testnet',
          totalReserve: 12500,
          totalToken: 12000,
        },
      ],
      ripcord: false,
      ripcordDetails: [],
    })
    .persist()

export const mockTotalReserveResponseRipcordFailure = (): nock.Scope =>
  nock('https://api.exchangecopter.com', {
    encodedQueryParams: true,
  })
    .get('/arsx/reserve')
    .reply(200, {
      timestamp: '2025-10-22T08:41:59.058Z',
      accounts: [
        {
          accountName: 'Arsx Base Testnet',
          totalReserve: 88072,
          totalToken: 85426,
        },
        {
          accountName: 'Worldchain Base Testnet',
          totalReserve: 0,
          totalToken: 0,
        },
      ],
      ripcord: true,
      ripcordDetails: ['Balances'],
    })
    .persist()
