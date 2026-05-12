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
      'The private key formatted as a single line eg: "-----BEGIN PRIVATE KEY-----\n...contents...\n-----END PRIVATE KEY-----"',
    type: 'string',
    required: true,
    sensitive: true,
    validate: {
      meta: {
        details: 'Value must be a valid private key',
      },
      fn: (value) => {
        if (
          !(
            value &&
            value.startsWith('-----BEGIN PRIVATE KEY-----\n') &&
            value.endsWith('\n-----END PRIVATE KEY-----')
          )
        ) {
          return 'Value must be a valid private key that starts with "-----BEGIN PRIVATE KEY-----\\n" and end with "\\n-----END PRIVATE KEY-----"'
        }
        return
      },
    },
  },
  PUBLIC_CERT: {
    description:
      'The public certificate formatted as a single line eg: "-----BEGIN CERTIFICATE-----\n...contents...\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n...contents...\n-----END CERTIFICATE-----"',
    type: 'string',
    required: true,
    sensitive: false,
    validate: {
      meta: {
        details: 'Value must be a valid public certificate',
      },
      fn: (value) => {
        if (
          !(
            value &&
            value.startsWith('-----BEGIN CERTIFICATE-----\n') &&
            value.endsWith('\n-----END CERTIFICATE-----')
          )
        ) {
          return 'Value must be a valid public certificate that starts with "-----BEGIN CERTIFICATE-----\\n" and end with "\\n-----END CERTIFICATE-----"'
        }
        return
      },
    },
  },
})
