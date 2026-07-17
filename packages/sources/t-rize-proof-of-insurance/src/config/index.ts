import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The T-Rize mainnet current-root endpoint URL.',
    type: 'string',
    required: false,
    default: '',
  },
  TESTNET_API_ENDPOINT: {
    description: 'The T-Rize testnet current-root endpoint URL.',
    type: 'string',
    required: false,
    default: '',
  },
  TRIZE_API_KEY: {
    description: 'API key for T-Rize asset-verifier API (passed via x-api-key header)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
