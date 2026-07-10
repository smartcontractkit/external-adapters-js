import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const porIndexerUrlConfigDefinition = {
  BITCOIN_MAINNET_POR_INDEXER_URL: {
    description: 'bitcoin-por-indexer HTTP service URL for Bitcoin mainnet (default path)',
    type: 'string',
    default: '',
  },
  BITCOIN_TESTNET_POR_INDEXER_URL: {
    description: 'bitcoin-por-indexer HTTP service URL for Bitcoin testnet (default path)',
    type: 'string',
    default: '',
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
} as const

export const streamsIndexerConfigDefinition = {
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
  BITCOIN_MAINNET_USE_STREAMS_INDEXER: {
    description:
      'When true, query Bitcoin mainnet balances via BITCOIN_MAINNET_RPC_URL instead of BITCOIN_MAINNET_POR_INDEXER_URL',
    type: 'boolean',
    default: false,
  },
  BITCOIN_TESTNET_USE_STREAMS_INDEXER: {
    description:
      'When true, query Bitcoin testnet balances via BITCOIN_TESTNET_RPC_URL instead of BITCOIN_TESTNET_POR_INDEXER_URL',
    type: 'boolean',
    default: false,
  },
} as const

export const configDefinition = {
  ...porIndexerUrlConfigDefinition,
  ...streamsIndexerConfigDefinition,
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

export type PorIndexerSettings = typeof config.settings

export const networkIdFromAddress = (network: string, chainId: string): string =>
  `${network}_${chainId}`.toUpperCase()

export const useStreamsBitcoinIndexer = (
  network: string,
  chainId: string,
  settings: PorIndexerSettings,
): boolean => {
  if (network !== 'bitcoin') {
    return false
  }

  const flag = `${networkIdFromAddress(
    network,
    chainId,
  )}_USE_STREAMS_INDEXER` as keyof PorIndexerSettings
  return Boolean(settings[flag])
}

export const balanceIndexerEnvVar = (
  network: string,
  chainId: string,
  settings: PorIndexerSettings,
): string => {
  const networkId = networkIdFromAddress(network, chainId)
  if (useStreamsBitcoinIndexer(network, chainId, settings)) {
    return `${networkId}_RPC_URL`
  }

  return `${networkId}_POR_INDEXER_URL`
}
