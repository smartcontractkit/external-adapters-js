export const customSettings = {
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
} as const
