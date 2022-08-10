import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.real-time-attest.trustexplorer.io', {
    encodedQueryParams: true,
  })
    .get('/chainlink/TrueUSD')
    .reply(
      200,
      () => ({
        accountName: 'TrueUSD',
        totalTrust: 1217813909.066,
        totalToken: 1213602213.6176918,
        updatedAt: '2022-08-10T14:22:39.011Z',
        token: [
          {
            tokenName: 'TUSD (AVAX)',
            bankBalances: {
              'Prime Trust': 0,
              'First Digital Trust': 1794,
              Silvergate: 0,
              'Signature Bank': 0,
              Signet: 0,
              Other: 1,
            },
            totalTokenByChain: 3791570.06,
            totalTrustByChain: 1795,
          },
          {
            tokenName: 'TUSD (ETH)',
            bankBalances: {
              'Prime Trust': 134055616.61,
              BitGo: 16.12,
              'First Digital Trust': 594966145.326,
              Silvergate: 113846225.15,
              'Signature Bank': 0,
              Signet: 274940619.86,
              'Customers Bank': 100000000,
            },
            totalTokenByChain: 879902244.54,
            totalTrustByChain: 1217808623.066,
          },
          {
            tokenName: 'TUSD (TRON)',
            bankBalances: {
              'Prime Trust': 0,
              'First Digital Trust': 1600,
              Silvergate: 0,
              'Signature Bank': 0,
              Signet: 0,
            },
            totalTokenByChain: 329515277.3,
            totalTrustByChain: 1600,
          },
          {
            tokenName: 'TUSD (BNB)',
            bankBalances: {
              'Prime Trust': 0,
              'First Digital Trust': 1891,
              'Signature Bank': 0,
              Signet: 0,
            },
            totalTokenByChain: 393121.7176917,
            totalTrustByChain: 1891,
          },
        ],
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
