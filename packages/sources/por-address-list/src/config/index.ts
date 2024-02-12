import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description:
      'The RPC URL to connect to the EVM chain the address manager contract is deployed to.',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
  },
  BATCH_GROUP_SIZE: {
    description: 'The number of concurrent batched contract calls to make at a time',
    type: 'number',
    default: 10,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
