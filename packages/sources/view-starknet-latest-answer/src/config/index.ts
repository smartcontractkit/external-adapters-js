import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  STARKNET_RPC_URL: {
    description: 'The Starknet RPC URL to use for calls',
    type: 'string',
    default: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
