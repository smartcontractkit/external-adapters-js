import nock from 'nock'

export const mockZeusResponseSuccess = (): nock.Scope =>
  nock('https://indexer.zeuslayer.io', {
    encodedQueryParams: true,
  })
    .get('/api/v2/chainlink/proof-of-reserves')
    .reply(
      200,
      () => ({
        accountName: 'zBTC',
        count: 4,
        lastUpdatedAt: '2025-04-14T09:49:28.08802Z',
        result: [
          {
            address: 'bc1p795t8whcfpl6uyxj38enzt43cg8scphrgvn2e79y3xgflv6s6nrsrmudk6',
            addressType: 'taproot',
            balance: '13.74225149',
            id: 4,
            symbol: 'BTC',
            walletName: 'anagram',
          },
          {
            address: 'bc1pd46txhc0a3t8juc2r4njyuk4rv3099dcn039ny0hzgt24tgx3qlszg5e6f',
            addressType: 'taproot',
            balance: '15.44962550',
            id: 3,
            symbol: 'BTC',
            walletName: 'animoca-ventures',
          },
          {
            address: 'bc1p96utmwdngv3xwdn90d7wg4tyqke70fs6js8ajgqkk89zn08z8d5q8xzchd',
            addressType: 'taproot',
            balance: '14.47874067',
            id: 2,
            symbol: 'BTC',
            walletName: 'mechanism-capital',
          },
          {
            address: 'bc1p698gf9gm8j34gvars97j6spsgrlxlhvyfajt2tsz2vnw9fcat9cqjcjn4v',
            addressType: 'taproot',
            balance: '39.62438252',
            id: 1,
            symbol: 'BTC',
            walletName: 'zeus-foundation',
          },
        ],
        totalReserveinBtc: '83.29500018',
        totalToken: '83.29131987',
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
type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
}

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

export const mockSolvTypeResponseSuccess = (solvType: string): nock.Scope => {
  const solvTypeLower = solvType.toLowerCase()
  return nock(`http://solv-${solvTypeLower}`, {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        accountName: solvTypeLower,
        result: [
          {
            id: 0,
            address: `${solvTypeLower}_s_1`,
            symbol: 'BTC',
            addressType: 'type_1',
            walletName: 'name_1',
          },
          {
            id: 1,
            address: `${solvTypeLower}_s_2`,
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
}

export const mockSolvJupResponseSuccess = (): nock.Scope =>
  nock(`http://solv-jup`, {
    encodedQueryParams: true,
  })
    .get('/')
    .reply(
      200,
      () => ({
        accountName: 'SolvBTC.JUP',
        result: [
          {
            id: 0,
            mirrorXLinkId: `jup_s_1`,
            label: 'label_1',
          },
          {
            id: 1,
            mirrorXLinkId: `jup_s_2`,
            label: 'label_2',
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

export const mockBaseContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-base:8080')
    .persist()
    .post('/')
    .reply(200, (_uri, request: JsonRpcPayload) => {
      if (request.method === 'eth_chainId') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x38',
        }
      } else if (
        request.method === 'eth_call' &&
        request.params[0].to === '0x440139321a15d14ce0729e004e91d66baf1a08b0' &&
        request.params[0].data === '0x4f20b888' // getPoRAddressListLength()
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x0000000000000000000000000000000000000000000000000000000000000006',
        }
      } else if (
        request.method === 'eth_call' &&
        request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
        request.params[0].data === '0xc5f24068' // getWithdrawalQueueLength()
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x0000000000000000000000000000000000000000000000000000000000000006',
        }
      } else if (
        request.method === 'eth_call' &&
        request.params[0].to === '0x440139321a15d14ce0729e004e91d66baf1a08b0' &&
        request.params[0].data ===
          '0xf3d4902a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006' // getPoRAddressList()
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000007a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000120000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000005eaff7af80488033bc845709806d5fae5291eb880000000000000000000000000000000000000000000000000000000000000010457468657265756d204d61696e6e6574000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004555344430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000120000000000000000000000000dd50c053c096cb04a3e3362e2b622529ec5f2e8a0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000ce9a6626eb99eaea829d7fa613d5d0a2eae45f400000000000000000000000005eaff7af80488033bc845709806d5fae5291eb880000000000000000000000000000000000000000000000000000000000000010457468657265756d204d61696e6e65740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055442494c4c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001200000000000000000000000007712c34205737192402172409a8f7ccef8aa2aec000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000005eaff7af80488033bc845709806d5fae5291eb880000000000000000000000000000000000000000000000000000000000000010457468657265756d204d61696e6e6574000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005425549444c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000a4b10000000000000000000000000000000000000000000000000000000000000120000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000005eaff7af80488033bc845709806d5fae5291eb88000000000000000000000000000000000000000000000000000000000000000c417262697472756d204f6e6500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004555344430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000a4b10000000000000000000000000000000000000000000000000000000000000120000000000000000000000000f84d28a8d28292842dd73d1c5f99476a80b6666a0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000c0952c8ba068c887b675b4182f3a65420d045f460000000000000000000000005eaff7af80488033bc845709806d5fae5291eb88000000000000000000000000000000000000000000000000000000000000000c417262697472756d204f6e65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055442494c4c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000021050000000000000000000000000000000000000000000000000000000000000120000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000005eaff7af80488033bc845709806d5fae5291eb880000000000000000000000000000000000000000000000000000000000000004426173650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045553444300000000000000000000000000000000000000000000000000000000',
        }
      } else {
        // Default response for unsupported calls
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: 'Method not found' },
        }
      }
    })

export const mockBaseContractCallSolanaResponseSuccess = (): nock.Scope =>
  nock('http://localhost-base:8080')
    .persist()
    .post('/')
    .reply(200, (_uri, request: JsonRpcPayload) => {
      if (request.method === 'eth_chainId') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x38',
        }
      } else if (
        request.method === 'eth_call' &&
        request.params[0].to === '0xbeee5862649ef24c1f1d5e799505f67f1e7bab9a' &&
        request.params[0].data === '0x4f20b888' // getPoRAddressListLength()
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: '0x0000000000000000000000000000000000000000000000000000000000000001',
        }
      } else if (
        request.method === 'eth_call' &&
        request.params[0].to === '0xbeee5862649ef24c1f1d5e799505f67f1e7bab9a' &&
        request.params[0].data ===
          '0xf3d4902a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001' // getPoRAddressList()
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result:
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002c473776335039795074426a3165334a4e3742366471347a626b7272573365326f766477416b53544b755546470000000000000000000000000000000000000000',
        }
      } else {
        // Default response for unsupported calls
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32601, message: 'Method not found' },
        }
      }
    })
