import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  SOLANA_RPC_URL: {
    description: 'Solana Rpc Url',
    type: 'string',
    default: 'https://TODO',
  },
  SOLANA_COMMITMENT: {
    description: 'Solana transaction commitment level',
    type: 'string',
    default: 'finalized',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
