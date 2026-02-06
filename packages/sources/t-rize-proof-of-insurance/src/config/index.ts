import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'Base URL for T-Rize Proof-of-Insurance API',
    type: 'string',
    default: 'https://api.t-rize.com',
  },
  TRIZE_API_TOKEN: {
    description: 'Bearer token for T-Rize API authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
