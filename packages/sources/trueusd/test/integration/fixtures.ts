import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://core-api.real-time-attest.trustexplorer.io', {
    encodedQueryParams: true,
  })
    .get('/trusttoken/TrueUSD')
    .reply(
      200,
      (_, request) => ({
        responseData: {
          accountName: 'TrueUSD',
          totalTrust: 1256102560.69,
          totalToken: 1250717352.7853243,
          updatedAt: '2021-11-08T13:49:45.112Z',
          token: [
            { tokenName: 'TUSDB (BNB)', principle: 617032.83532437 },
            { tokenName: 'TUSD (TRON)', principle: 269206919.78 },
            { tokenName: 'TUSD (ETH)', principle: 980893400.1700001 },
            { tokenName: 'TUSD (AVA)', principle: 0 },
          ],
        },
        message: [{ msg: 'get contractSupply successfully' }],
        success: true,
        responseCode: 200,
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
