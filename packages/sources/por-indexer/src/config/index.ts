import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
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
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
