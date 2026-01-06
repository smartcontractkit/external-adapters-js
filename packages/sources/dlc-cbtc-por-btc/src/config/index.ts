import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ATTESTER_API_URL: {
    description:
      'DLC.Link Attester API URL for fetching xpub and deposit account data (e.g., https://mainnet.dlc.link/attestor-1)',
    type: 'string',
    required: true,
  },
  CHAIN_NAME: {
    description: 'Canton chain name to filter addresses (e.g., "mainnet", "devnet")',
    type: 'string',
    required: true,
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
    default: 30_000,
  },
})
