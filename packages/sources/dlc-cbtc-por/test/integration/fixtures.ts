import nock from 'nock'

// API URLs
export const MOCK_DA_API_URL = 'https://test.digitalasset.api'
export const MOCK_ATTESTER_API_URL_1 = 'https://test.attester1.api'
export const MOCK_ATTESTER_API_URL_2 = 'https://test.attester2.api'
export const MOCK_ATTESTER_API_URLS = `${MOCK_ATTESTER_API_URL_1},${MOCK_ATTESTER_API_URL_2}`
export const MOCK_BITCOIN_RPC_URL = 'https://test.bitcoin.rpc'

// Real data from attester API to ensure address verification passes in integration tests
export const MOCK_XPUB =
  'xpub6GRcASRzGcNLhsaTsX28aV1JmNZSdUFKHsXgSjwX4ykk8X3j58gznGf73mBe1k35A69K7JNZfwZhmQHjZGd8f5ine2ztkbW3yiayRHFRFKL'
export const MOCK_DEPOSIT_ID =
  '000da3e972f71100337b6039740625861997098d4f4785c7cf0f88286a0208fe60ca111220c31237da239a2317724046f46cfab8d50076a2a0314874c773db3c43ddf910c2'
export const MOCK_VAULT_ADDRESS = 'bc1p8zuluqy8pza2pt6sj7lnl5esjk9t2e4h2k6jna7dtmyhhxd8uv0qp3tw9x'

// Mock responses
export const MOCK_BLOCK_HEIGHT = 880000
export const MOCK_UTXO_VALUE = 100000000 // 1 BTC in sats

export const mockDaApiResponse = (): nock.Scope =>
  nock(MOCK_DA_API_URL)
    .get('/instruments')
    .reply(200, {
      instruments: [
        {
          id: 'CBTC',
          name: 'CBTC',
          symbol: 'CBTC',
          totalSupply: '21000000.1234567890',
          totalSupplyAsOf: null,
          decimals: 10,
          supportedApis: {},
        },
      ],
      nextPageToken: null,
    })
    .persist()

export const mockAttesterSupplyResponse = (url: string, supply = '7.899823260000001'): void => {
  nock(url).persist().get('/app/get-total-cbtc-supply').reply(200, {
    status: 'ready',
    total_supply_cbtc: supply,
    last_updated: '2025-01-01T00:00:00.000Z',
  })
}

export const mockAttesterAddressResponse = (url: string): void => {
  nock(url)
    .persist()
    .get('/app/get-address-calculation-data')
    .reply(200, {
      status: 'ready',
      bitcoin_network: 'bitcoin',
      chains: [
        {
          chain: 'canton-mainnet',
          xpub: MOCK_XPUB,
          addresses: [
            {
              id: MOCK_DEPOSIT_ID,
              address_for_verification: MOCK_VAULT_ADDRESS,
            },
          ],
        },
      ],
      last_updated: '2025-01-01T00:00:00.000Z',
    })
}

export const mockBitcoinRpcResponses = (): void => {
  // Block height
  nock(MOCK_BITCOIN_RPC_URL)
    .persist()
    .get('/blocks/tip/height')
    .reply(200, String(MOCK_BLOCK_HEIGHT))

  // UTXOs for vault address - confirmed with sufficient confirmations
  nock(MOCK_BITCOIN_RPC_URL)
    .persist()
    .get(`/address/${MOCK_VAULT_ADDRESS}/utxo`)
    .reply(200, [
      {
        txid: 'abc123def456789012345678901234567890123456789012345678901234abcd',
        vout: 0,
        value: MOCK_UTXO_VALUE,
        status: {
          confirmed: true,
          block_height: MOCK_BLOCK_HEIGHT - 10, // 11 confirmations
        },
      },
    ])

  // Empty mempool for vault address
  nock(MOCK_BITCOIN_RPC_URL)
    .persist()
    .get(`/address/${MOCK_VAULT_ADDRESS}/txs/mempool`)
    .reply(200, [])
}

export const mockAttesterApiResponse = (): void => {
  mockAttesterSupplyResponse(MOCK_ATTESTER_API_URL_1)
  mockAttesterSupplyResponse(MOCK_ATTESTER_API_URL_2)
}

export const mockReservesApis = (): void => {
  mockAttesterAddressResponse(MOCK_ATTESTER_API_URL_1)
  mockAttesterAddressResponse(MOCK_ATTESTER_API_URL_2)
  mockBitcoinRpcResponses()
}

export const mockAllApis = (): void => {
  mockDaApiResponse()
  mockAttesterApiResponse()
  mockReservesApis()
}
