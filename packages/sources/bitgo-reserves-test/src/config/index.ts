import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  STAGING_API_ENDPOINT: {
    description: 'Staging API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd-staging.com/por.json',
    sensitive: false,
  },
  STAGING_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\n...contents...\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: true,
    sensitive: false,
  },
  TEST_API_ENDPOINT: {
    description: 'Test API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd-test.com/por.json',
    sensitive: false,
  },
  TEST_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\n...contents...\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: true,
    sensitive: false,
  },
})
