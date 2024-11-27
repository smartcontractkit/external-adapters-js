import nock from 'nock'

export const mockBedRockResponseSuccess = (): nock.Scope =>
  nock('http://bedrock', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        btc: [
          { type: 'addr', bridge_source: 'btc', addr: 'btc_1' },
          { type: 'addr', bridge_source: 'btc', addr: 'btc_2' },
        ],
        evm: {
          eth: {
            chain_id: 1,
            vault: 'vault_1',
            tokens: [
              ['BTC', 'token_1', '18', '10'],
              ['BTC', '0x0000000000000000000000000000000000000000', '18', '10'],
            ],
          },
          bsc: {
            chain_id: 56,
            vault: 'vault_2',
            tokens: [['BTC', 'token_2', '18', '10']],
          },
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
