import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.real-time-reserves.ledgerlens.io/v1/', {
    encodedQueryParams: true,
  })
    .get('/chainlink/proof-of-reserves/TrueUSD')
    .reply(
      200,
      () => ({
        accountName: 'TrueUSD',
        totalTrust: 3117410009.89,
        totalToken: 3097573780.109635,
        updatedAt: '2023-06-15T16:59:47.538Z',
        token: [
          {
            tokenName: 'TUSD (AVAX)',
            totalTokenByChain: 3005274.95,
            totalTrustByChain: 24268.83,
          },
          {
            tokenName: 'TUSD (ETH)',
            totalTokenByChain: 728134669.6,
            totalTrustByChain: 2917383739.66,
          },
          {
            tokenName: 'TUSD (TRON)',
            totalTokenByChain: 2336157454.81,
            totalTrustByChain: 200002001.4,
          },
          {
            tokenName: 'TUSD (BNB)',
            totalTokenByChain: 145015.86963478,
            totalTrustByChain: 0,
          },
          {
            tokenName: 'TUSD (BSC)',
            totalTokenByChain: 30131364.88,
            totalTrustByChain: 0,
          },
        ],
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

export const mockResponseFailure = (): nock.Scope =>
  nock('https://api.real-time-reserves.ledgerlens.io/v1/', {
    encodedQueryParams: true,
  })
    .get('/chainlink/proof-of-reserves/TrueUSD')
    .query(() => true)
    .reply(
      200,
      () => ({
        accountName: 'TrueUSD',
        totalTrust: 3117410009.89,
        totalToken: 3097573780.109635,
        updatedAt: '2023-06-15T16:59:47.538Z',
        token: [
          {
            tokenName: 'TUSD (AVAX)',
            totalTokenByChain: 3005274.95,
            totalTrustByChain: 24268.83,
          },
          {
            tokenName: 'TUSD (ETH)',
            totalTokenByChain: 728134669.6,
            totalTrustByChain: 2917383739.66,
          },
          {
            tokenName: 'TUSD (TRON)',
            totalTokenByChain: 2336157454.81,
            totalTrustByChain: 200002001.4,
          },
          {
            tokenName: 'TUSD (BNB)',
            totalTokenByChain: 145015.86963478,
            totalTrustByChain: 0,
          },
          {
            tokenName: 'TUSD (BSC)',
            totalTokenByChain: 30131364.88,
            totalTrustByChain: 0,
          },
        ],
        ripcord: true,
        ripcordDetails: ['Integrations', 'Balances'],
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
