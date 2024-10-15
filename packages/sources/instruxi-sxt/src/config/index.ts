import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider (SxT',
    type: 'string',
    required: true,
  },
  API_KEY: {
    description: 'An API key for Data Provider (SxT)',
    type: 'string',
    sensitive: true,
    required: true,
  },
})
