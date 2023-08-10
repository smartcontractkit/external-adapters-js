import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description:
      'Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  FILECOIN_RPC_URL: {
    description: 'RPC URL of Filecoin node',
    type: 'string',
    default: 'http://localhost:8545',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
