export const customSettings = {
  RPC_URL: {
    type: 'string',
    description: 'The websocket URL used to retrieve balances from the Polkadot Relay Chain',
    required: true,
  },
} as const
