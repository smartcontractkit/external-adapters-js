import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ATTESTER_API_URLS: {
    description:
      'Comma-separated list of DLC.Link Attester API URLs for fetching xpub and deposit account data',
    type: 'string',
    required: true,
  },
  CHAIN_NAME: {
    description: 'Chain name to filter addresses from Attester API',
    type: 'enum',
    options: ['canton-mainnet', 'canton-testnet', 'canton-devnet'],
    default: 'canton-mainnet',
  },
  BITCOIN_RPC_ENDPOINT: {
    description: 'Electrs-compatible Bitcoin blockchain API endpoint for UTXO queries',
    type: 'string',
    required: true,
  },
  MIN_CONFIRMATIONS: {
    description: 'Minimum number of confirmations required for a UTXO to be counted',
    type: 'number',
    default: 6,
  },
  BACKGROUND_EXECUTE_MS: {
    description: 'Interval in milliseconds between background executions',
    type: 'number',
    default: 10_000,
  },
})
