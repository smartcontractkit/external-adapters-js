import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    type: 'string',
    description:
      'The RPC URL to connect to the EVM chain the address manager contract is deployed to.',
    required: true,
  },
  CHAIN_ID: {
    type: 'number',
    description: 'The chain id to connect to',
    default: 1,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
