import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'T-Rize API endpoint',
    type: 'string',
    default: 'https://api.t-rize.com',
  },
  TRIZE_API_TOKEN: {
    description: 'T-Rize API bearer token',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
