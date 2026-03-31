import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description:
      'The T-Rize API base URL. Defaults to production (proof.t-rize.network). Set to https://proof.t-rize.ca for testnet.',
    type: 'string',
    default: 'https://proof.t-rize.network',
  },
  TRIZE_API_KEY: {
    description: 'API key for T-Rize asset-verifier API (passed via x-api-key header)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
