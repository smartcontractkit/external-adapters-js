import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const rpcUrlConfigDefinition = {
  BITCOIN_MAINNET_RPC_URL: {
    description:
      'Electrs-compatible streams Bitcoin indexer endpoint for Bitcoin mainnet UTXO queries',
    type: 'string',
    default: '',
  },
  BITCOIN_TESTNET_RPC_URL: {
    description:
      'Electrs-compatible streams Bitcoin indexer endpoint for Bitcoin testnet UTXO queries',
    type: 'string',
    default: '',
  },
} as const

export const configDefinition = {
  ...rpcUrlConfigDefinition,
  ZEUS_ZBTC_API_URL: {
    description: 'API url for zeus zBTC',
    type: 'string',
    default: 'https://hermes.zeusnetwork.xyz/api/v2/chainlink/proof-of-reserves',
  },
  BATCH_SIZE: {
    description:
      'Number of addresses to query concurrently against the streams Bitcoin indexer per batch',
    type: 'number',
    default: 10,
  },
} as const

export const config = new AdapterConfig(
  {
    ...configDefinition,
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      MAX_PAYLOAD_SIZE_LIMIT: 5000000,
    },
  },
)
