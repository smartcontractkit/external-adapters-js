import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The base URL of the Spiro API',
    type: 'string',
    default: 'https://rwa-wireframes.vercel.app',
    sensitive: false,
  },
  API_KEY: {
    description: 'API key for the Spiro API, sent as the x-api-key header',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
