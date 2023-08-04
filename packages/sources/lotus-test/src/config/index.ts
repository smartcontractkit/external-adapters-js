import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description:
      'Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  RPC_URL: {
    description: 'RPC_URL',
    type: 'string',
    default: 'http://localhost:8545',
  },
})
