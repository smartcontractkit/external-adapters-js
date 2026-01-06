/**
 * Mock fixtures for btc-por integration tests
 *
 * Provides mock responses for:
 * - Attester API (/app/get-address-calculation-data)
 * - Bitcoin RPC (Electrs API for UTXOs)
 */

import nock from 'nock'

export const MOCK_ATTESTER_API_URL = 'https://test.attester.api'
export const MOCK_BITCOIN_RPC_URL = 'https://test.electrs.api'
export const MOCK_BITCOIN_NETWORK = 'testnet'

// Mock vault address (must match what calculateTaprootAddress produces for the mock xpub + deposit ID)
export const MOCK_VAULT_ADDRESS = 'tb1pmockaddress1234567890abcdef'

// Mock xpub and deposit ID (these would produce MOCK_VAULT_ADDRESS via the calculation)
export const MOCK_XPUB =
  'tpubD6NzVbkrYhZ4YNXVQbLhMK6WMPrWwvfGC1vYTmUpFxPM8yxRKqdkTLBGbHR5chKZK5toE8UtUQmTPPG3BqVN49q3iNNMbCvvQQbXGyDdEfJ'
export const MOCK_DEPOSIT_ID = 'test-deposit-001'

export const MOCK_BLOCK_HEIGHT = 800000

/**
 * Mock the Attester API response for address calculation data
 */
export const mockAttesterApi = (): nock.Scope =>
  nock(MOCK_ATTESTER_API_URL)
    .get('/app/get-address-calculation-data')
    .reply(
      200,
      {
        chains: [
          {
            chain: MOCK_BITCOIN_NETWORK,
            xpub: MOCK_XPUB,
            addresses: [
              {
                id: MOCK_DEPOSIT_ID,
                // In a real test, this would be verified against the calculated address
                // For integration tests, we mock the verification to pass
                address_for_verification: MOCK_VAULT_ADDRESS,
              },
            ],
          },
        ],
        bitcoin_network: 'testnet',
      },
      ['Content-Type', 'application/json'],
    )
    .persist()

/**
 * Mock Bitcoin RPC block height endpoint
 */
export const mockBlockHeight = (height: number = MOCK_BLOCK_HEIGHT): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL).get('/blocks/tip/height').reply(200, String(height)).persist()

/**
 * Mock Bitcoin RPC UTXOs endpoint for a specific address
 */
export const mockAddressUtxos = (
  address: string,
  utxos: Array<{
    txid: string
    vout: number
    value: number
    status: { confirmed: boolean; block_height?: number }
  }>,
): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL).get(`/address/${address}/utxo`).reply(200, utxos).persist()

/**
 * Mock Bitcoin RPC mempool transactions endpoint for a specific address
 */
export const mockAddressMempool = (
  address: string,
  txs: Array<{
    txid: string
    vin: Array<{
      txid: string
      vout: number
      prevout: { scriptpubkey_address: string; value: number }
    }>
    vout: Array<{ scriptpubkey_address: string; value: number }>
  }> = [],
): nock.Scope =>
  nock(MOCK_BITCOIN_RPC_URL).get(`/address/${address}/txs/mempool`).reply(200, txs).persist()

/**
 * Mock all APIs with default successful responses
 * Returns 5 BTC in reserves (500000000 sats)
 */
export const mockAllApisSuccess = (): void => {
  mockAttesterApi()
  mockBlockHeight(MOCK_BLOCK_HEIGHT)
  mockAddressUtxos(MOCK_VAULT_ADDRESS, [
    {
      txid: 'abc123',
      vout: 0,
      value: 500000000, // 5 BTC
      status: { confirmed: true, block_height: MOCK_BLOCK_HEIGHT - 10 },
    },
  ])
  mockAddressMempool(MOCK_VAULT_ADDRESS, [])
}
