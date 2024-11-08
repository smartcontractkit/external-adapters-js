import nock from 'nock'

export const mockBedRockResponseSuccess = (): nock.Scope =>
  nock('http://bedrock', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        btc: ['btc_1', 'btc_2'],
        evm: {
          '1': 'ABC',
          '10': 'DEF',
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
    .persist()

export const mockSolvResponseSuccess = (): nock.Scope =>
  nock('http://solv', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        accountName: 'SolvBTC',
        result: [
          {
            id: 0,
            address: 'btc_s_1',
            symbol: 'BTC',
            addressType: 'type_1',
            walletName: 'name_1',
          },
          {
            id: 1,
            address: 'btc_s_2',
            symbol: 'BTC',
            addressType: 'type_2',
            walletName: 'name_2',
          },
        ],
        count: 2,
        lastUpdatedAt: '2021-01-01T11:11:11.112Z',
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
