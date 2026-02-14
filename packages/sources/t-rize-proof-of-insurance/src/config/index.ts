import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The T-Rize API endpoint',
    type: 'string',
    default: 'https://proof.t-rize.io',
  },
  TRIZE_API_TOKEN: {
    description: 'API token for T-Rize Proof-of-Insurance API',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
