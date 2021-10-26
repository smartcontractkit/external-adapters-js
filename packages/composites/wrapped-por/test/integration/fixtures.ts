import nock from 'nock'

process.env.ETH_BALANCE_ADAPTER_URL = process.env.ETH_BALANCE_ADAPTER_URL || 'http://localhost:8081'

export const mockETHBalanceResponseSuccess = (): nock => {
  nock('http://chainlink.wrappedeng.com', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/deposits')
    .reply(200, {
      ETH: [
        '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
        '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
        '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
      ],
    })

  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/')
    .reply(
      200,
      (_, request) => ({
        jobRunID: '1',
        result: [
          {
            address: '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
            balance: '3070371546755696546000',
          },
          {
            address: '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
            balance: '686895919103523356932',
          },
          {
            address: '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
            balance: '101683409180301254860',
          },
        ],
        statusCode: 200,
        data: {
          result: [
            {
              address: '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
              balance: '3070371546755696546000',
            },
            {
              address: '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
              balance: '686895919103523356932',
            },
            {
              address: '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
              balance: '101683409180301254860',
            },
          ],
        },
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
}
