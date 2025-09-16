import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'The Blocksize Capital API key to use',
    type: 'string',
    required: true,
    sensitive: true,
  },
  TOKEN: {
    description: 'Token for Blocksize-Capital authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Blocksize-Capital state',
    type: 'string',
    default: 'wss://blocksize.dev/marketdata/v1/ws',
  },
})
