import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  CLIENT_ID: {
    description: 'Broker API client id for the OAuth client-credentials token exchange.',
    type: 'string',
    required: true,
    sensitive: true,
  },
  CLIENT_SECRET: {
    description: 'Broker API client secret for the OAuth client-credentials token exchange.',
    type: 'string',
    required: true,
    sensitive: true,
  },
  AUTH_ENDPOINT: {
    description:
      'Full OAuth token endpoint URL. Moves with the environment: sandbox host now, production host (authx.alpaca.markets) later.',
    type: 'string',
    default: 'https://authx.sandbox.alpaca.markets/v1/oauth2/token',
    required: false,
    sensitive: false,
  },
  WS_API_ENDPOINT: {
    description:
      'Full WebSocket URL. The production host (stream.data.alpaca.markets) replaces the sandbox host once the boat-entitled environment is provisioned; the path (/v1beta1/overnight) stays the same.',
    type: 'string',
    default: 'wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight',
    required: false,
    sensitive: false,
  },
})
