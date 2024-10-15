import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description: 'The RPC URL to connect to the EVM chain',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    required: true,
    default: 1,
  },
  ETHEREUM_CL_INDEXER_URL: {
    description: 'Url to ethereum-cl-indexer balance endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
