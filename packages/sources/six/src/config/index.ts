import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description: 'SIX WebSocket API endpoint',
    type: 'string',
    default: 'wss://api.six-group.com/web/v2/websocket',
    sensitive: false,
  },
  API_ENDPOINT: {
    description: 'SIX REST API base URL',
    type: 'string',
    default: 'https://api.six-group.com',
    sensitive: false,
  },
  PRIVATE_KEY: {
    description:
      'The private key that starts with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----"',
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
      'The public certificate that starts with "-----BEGIN CERTIFICATE-----" and end with "-----END CERTIFICATE-----"',
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
