import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider - Copper',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'An API secret for Data Provider - Copper',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider - Copper',
    type: 'string',
    default: 'https://api.copper.co',
  },
  BACKGROUND_EXECUTE_MS: {
    description: 'Background execute time in milliseconds',
    type: 'number',
    default: 1000,
  },
})
