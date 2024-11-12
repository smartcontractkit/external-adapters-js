import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description:
      'The WebSocket API URL. Either "wss://chainlinkcloud1.twosigma.com:8765" or "wss://chainlinkcloud1.twosigma.com:8766"',
    type: 'string',
    required: true,
    default: 'wss://chainlinkcloud1.twosigma.com:8765',
  },
  WS_API_KEY: {
    description: 'The API key used to authenticate requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
