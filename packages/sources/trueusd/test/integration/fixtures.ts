import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.real-time-attest.trustexplorer.io', {
    encodedQueryParams: true,
  })
    .get('/chainlink/TrueUSD')
    .reply(
      200,
      (_, request) => ({
        accountName: 'TrueUSD',
        totalTrust: 140,
        totalToken: 137.87276643,
        updatedAt: '2022-04-08T14:39:13.724Z',
        updatedTms: 1649428753724,
        token: [
          {
            tokenName: 'TUSDB (BNB)',
            totalTokenbyChain: 76.39276643,
            totalTrustbyChain: 77,
            bankBalances: [
              {
                'Prime Trust': 1,
                Silvergate: 2,
                'Signature Bank': 3,
                'First Digital Trust': 4,
                'Customers Bank': 5,
                Other: 6,
              },
            ],
          },
          {
            tokenName: 'TUSD (TRON)',
            totalTokenbyChain: 20.22,
            totalTrustbyChain: 21,
            bankBalances: [
              {
                'Prime Trust': 1,
                Silvergate: 2,
                'Signature Bank': 3,
                'First Digital Trust': 4,
                'Customers Bank': 5,
                Other: 6,
              },
            ],
          },
          {
            tokenName: 'TUSD (ETH)',
            totalTokenbyChain: 20.54,
            totalTrustbyChain: 21,
            bankBalances: [
              {
                'Prime Trust': 1,
                Silvergate: 2,
                'Signature Bank': 3,
                'First Digital Trust': 4,
                'Customers Bank': 5,
                Other: 6,
              },
            ],
          },
          {
            tokenName: 'TUSD (AVA)',
            totalTokenbyChain: 20.72,
            totalTrustbyChain: 21,
            bankBalances: [
              {
                'Prime Trust': 1,
                Silvergate: 2,
                'Signature Bank': 3,
                'First Digital Trust': 4,
                'Customers Bank': 5,
                Other: 6,
              },
            ],
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
