import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETH_CONSENSUS_RPC_URL: {
    description: 'RPC URL of an Ethereum consensus client (beacon node)',
    type: 'string',
    required: true,
  },
  ETH_EXECUTION_RPC_URL: {
    description:
      'RPC URL of an Ethereum execution client (archive node). Required for requests that need a limbo validator search',
    type: 'string',
  },
  BATCH_SIZE: {
    description:
      'Number of validators to send in each request to the consensus client. Set to 0 if consensus client allows unlimited validators in query. Setting this lower than the default and greater than 0 may result in lower performance from the adapter.',
    type: 'number',
    default: 15,
  },
  GROUP_SIZE: {
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. Setting this lower than the default may result in lower performance from the adapter. Unused if BATCH_SIZE is set to 0.',
    type: 'number',
    default: 15,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
  },
})
