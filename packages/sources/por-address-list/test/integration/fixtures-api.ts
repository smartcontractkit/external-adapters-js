import nock from 'nock'

export const mockCoinbaseResponseSuccess = (): nock.Scope =>
  nock('http://coinbase', {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        schema: 'v1',
        lastUpdatedAt: '2025-02-21T17:59:48Z',
        reservesTotal: {
          amount: '26765.13145192',
          currency: {
            name: 'BTC',
          },
          network: {
            name: 'bitcoin',
          },
        },
        reserveAddresses: [
          {
            address: 'bc1qkqu7akp4lf3vmkde5l4ydp596wp8fm93m9yptd',
            balance: {
              amount: '690.00001207',
              currency: {
                name: 'BTC',
              },
              network: {
                name: 'bitcoin',
              },
            },
          },
          {
            address: '1xT8bWnZzS339nQLnrdqBW6yz8Nt5KjLC',
            balance: {
              amount: '480.98450058',
              currency: {
                name: 'BTC',
              },
              network: {
                name: 'bitcoin',
              },
            },
          },
          {
            address: '1FprAosJemf7TDvLGaTHbUWms3Z1uLUwJS',
            balance: {
              amount: '480.98433527',
              currency: {
                name: 'BTC',
              },
              network: {
                name: 'bitcoin',
              },
            },
          },
          {
            address: '1CgpdCJAkEQrzgqRh4C2EkyKsGCZxDFPEa',
            balance: {
              amount: '480.98433527',
              currency: {
                name: 'BTC',
              },
              network: {
                name: 'bitcoin',
              },
            },
          },
        ],
        wrappedAssetsByNetwork: [
          {
            amount: '16410.75085686',
            currency: {
              name: 'CBBTC',
              address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
            },
            network: {
              name: 'ethereum',
              chainId: '1',
            },
          },
          {
            amount: '7614.45412467',
            currency: {
              name: 'CBBTC',
              address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            },
            network: {
              name: 'base',
              chainId: '8453',
            },
          },
        ],
        wrappedAssetsTotal: {
          amount: '26754.167082',
          currency: {
            name: 'CBBTC',
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
