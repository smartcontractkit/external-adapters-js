import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    type: 'string',
    description: 'The websocket URL used to retrieve balances from the Polkadot Relay Chain',
    required: true,
  },
  BATCH_SIZE: {
    type: 'number',
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next batch',
    default: 25,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
