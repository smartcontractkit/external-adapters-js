import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description: 'The RPC URL for the Solana cluster',
    type: 'string',
    required: true,
    sensitive: true,
  },
  COMMITMENT: {
    description: 'The commitment level for the Solana cluster',
    type: 'string',
    sensitive: true,
    default: 'confirmed',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
  },
})
