import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Aleno',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://state-price.aleno.ai',
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Aleno',
    type: 'string',
    default: 'https://ws-state-price.aleno.ai',
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
