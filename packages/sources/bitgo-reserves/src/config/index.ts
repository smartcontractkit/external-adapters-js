import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.usdstandard-test.com/por.json',
  },
  API_ENDPOINT2: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    required: true,
  },
  VERIFICATION_PUBKEY: {
    description: 'Public key used for verifying data signature',
    type: 'string',
    required: true,
  },
})
