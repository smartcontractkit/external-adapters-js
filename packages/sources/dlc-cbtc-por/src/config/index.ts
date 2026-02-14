import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    // Shared config
    ATTESTER_API_URLS: {
      description: 'Comma-separated list of DLC.Link Attester API URLs',
      type: 'string',
      required: true,
      sensitive: false,
    },
    // Canton/DA Supply config
    CANTON_API_URL: {
      description: 'Digital Asset API endpoint URL for CBTC token metadata',
      type: 'string',
      sensitive: false,
    },
    // BTC Reserves config
    CHAIN_NAME: {
      description: 'Chain name to filter addresses from Attester API',
      type: 'enum',
      options: ['canton-mainnet', 'canton-testnet', 'canton-devnet'],
      default: 'canton-mainnet',
      sensitive: false,
    },
    BITCOIN_RPC_ENDPOINT: {
      description: 'Electrs-compatible Bitcoin blockchain API endpoint for UTXO queries',
      type: 'string',
      required: true,
      sensitive: false,
    },
    // General config
    BACKGROUND_EXECUTE_MS: {
      description: 'Interval in milliseconds between background executions',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 10_000,
    },
  },
)
