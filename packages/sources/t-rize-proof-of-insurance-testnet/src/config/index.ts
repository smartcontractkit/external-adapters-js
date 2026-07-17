import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description:
      'The T-Rize current-root endpoint URL. Defaults to testnet. Set to https://proof.t-rize.network/v1/asset-verifier/merkle-tree/current-root for production.',
    type: 'string',
    default: 'https://proof.t-rize.ca/v1/asset-verifier/merkle-tree/current-root',
  },
  TRIZE_API_KEY: {
    description: 'API key for T-Rize asset-verifier API (passed via x-api-key header)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
