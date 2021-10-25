import nock from 'nock'

export const mockETHBalanceResponseSuccess = (): nock => {
  nock('http://localhost:8080', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/')
    .reply(
      200,
      {
        jobRunID: '1',
        result: '3938711109096905',
        maxAge: 30000,
        statusCode: 200,
        data: {
          result: '3938711109096905',
        },
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

  nock('http://chainlink.wrappedeng.com:80', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/')
    .reply(
      200,
      {
        jobRunID: '1',
        result: [
          {
            address: '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
          },
          {
            address: '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
          },
          {
            address: '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
          },
        ],
        statusCode: 200,
        data: {
          result: [
            {
              address: '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4',
            },
            {
              address: '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2',
            },
            {
              address: '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677',
            },
          ],
        },
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

  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      id: '1',
      data: {
        addresses: [
          { address: '0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4' },
          { address: '0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2' },
          { address: '0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677' },
        ],
      },
    })
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
