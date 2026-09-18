import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const configDefinition = {
  BITCOIN_MAINNET_POR_INDEXER_URL: {
    description: 'Indexer URL for Bitcoin mainnet',
    type: 'string',
    default: '',
  },
  BITCOIN_TESTNET_POR_INDEXER_URL: {
    description: 'Indexer URL for Bitcoin testnet',
    type: 'string',
    default: '',
  },
  BITCOIN_MAINNET_RPC_URL: {
    description: 'Streams Bitcoin indexer URL for mainnet UTXO queries (opt-in path)',
    type: 'string',
    default: '',
  },
  BITCOIN_MAINNET_USE_STREAMS_INDEXER: {
    description:
      'When true, use BITCOIN_MAINNET_RPC_URL for mainnet Bitcoin instead of BITCOIN_MAINNET_POR_INDEXER_URL',
    type: 'boolean',
    default: false,
  },
  DOGECOIN_MAINNET_POR_INDEXER_URL: {
    description: 'Indexer URL for Dogecoin mainnet',
    type: 'string',
    default: '',
  },
  DOGECOIN_TESTNET_POR_INDEXER_URL: {
    description: 'Indexer URL for Dogecoin testnet',
    type: 'string',
    default: '',
  },
  ZEUS_ZBTC_API_URL: {
    description: 'API url for zeus zBTC',
    type: 'string',
    default: 'https://hermes.zeusnetwork.xyz/api/v2/chainlink/proof-of-reserves',
  },
  BATCH_SIZE: {
    description: 'Maximum number of addresses to send in a single request to the balance indexer',
    type: 'number',
    default: 5000,
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

export const balanceEnvVarForAddress = (
  network: string,
  chainId: string,
  useStreamsMainnet: boolean,
): string => {
  if (network === 'bitcoin' && chainId === 'mainnet' && useStreamsMainnet) {
    return 'BITCOIN_MAINNET_RPC_URL'
  }

  return `${network}_${chainId}`.toUpperCase() + '_POR_INDEXER_URL'
}
