import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  PROD_API_ENDPOINT: {
    description: 'Prod API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd.com/por.json',
  },
  STAGING_API_ENDPOINT: {
    description: 'Staging API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd-staging.com/por.json',
  },
  TEST_API_ENDPOINT: {
    description: 'Test API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd-test.com/por.json',
  },
  PROD_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\\n...contents...\\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: true,
  },
  STAGING_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\\n...contents...\\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: false,
  },
  TEST_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\\n...contents...\\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: false,
  },
})
