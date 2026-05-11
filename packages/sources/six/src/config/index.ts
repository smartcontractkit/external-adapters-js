import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://api.six-group.com',
    sensitive: false,
  },
  PRIVATE_KEY: {
    description:
      'Base64 Private Key. Expected to be formatted as a single line eg: "-----BEGIN PRIVATE KEY-----\n...contents...\n-----END PRIVATE KEY-----"',
    type: 'string',
    required: true,
    sensitive: true,
  },
  PUBLIC_CERT: {
    description:
      'Base64 Public Certificate. Expected to be formatted as a single line eg: "-----BEGIN CERTIFICATE-----\n...contents...\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n...contents...\n-----END CERTIFICATE-----"',
    type: 'string',
    required: true,
    sensitive: false,
  },
})
