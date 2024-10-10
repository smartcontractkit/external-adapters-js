import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description: 'WS endpoint for expand.network price aggregator',
    type: 'string',
    default: 'wss://aggregate.expand.network',
  },
  API_KEY: {
    description: 'An API key for expand.network price aggregator',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
