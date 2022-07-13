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
        totalTrust: 1385192938.49,
        totalToken: 1373465520.7227664,
        updatedAt: '2022-04-05T16:45:04.973Z',
        token: [
          { principle: 5316985.88276643, tokenName: 'TUSDB (BNB)' },
          { principle: 254336540.22, tokenName: 'TUSD (TRON)' },
          { principle: 1109418823.8999999, tokenName: 'TUSD (ETH)' },
          { principle: 4393170.72, tokenName: 'TUSD (AVA)' },
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
