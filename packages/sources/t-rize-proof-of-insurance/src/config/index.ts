import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description:
      'The T-Rize API base URL. Defaults to testnet (proof.validator.t-rize.ca). Set to https://proof.t-rize.network for mainnet.',
    type: 'string',
    default: 'https://proof.validator.t-rize.ca',
  },
  TRIZE_API_KEY: {
    description: 'API key for T-Rize asset-verifier API (passed via x-api-key header)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  TRUNCATE_VALUES: {
    description:
      'Truncate root and contractId to the leftmost 24 bytes (192 bits) to fit int192. Set to false if the provider pre-truncates values.',
    type: 'boolean',
    default: true,
  },
})
