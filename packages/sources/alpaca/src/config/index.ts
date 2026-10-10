import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  CLIENT_ID: {
    description: 'The client ID to authenticate with Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  CLIENT_SECRET: {
    description: 'The client secret to authenticate with Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  AUTH_ENDPOINT: {
    description: 'The endpoint to get the access token from Data Provider',
    type: 'string',
    default: 'https://authx.sandbox.alpaca.markets/v1/oauth2/token',
    sensitive: false,
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Data Provider',
    type: 'string',
    default: 'wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight',
    sensitive: false,
  },
})
