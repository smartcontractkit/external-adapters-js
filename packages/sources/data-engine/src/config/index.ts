import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The default REST API base url',
    default: 'https://api.dataengine.chain.link',
    type: 'string',
    sensitive: false,
  },
  WS_API_ENDPOINT: {
    description: 'The default WebSocket API base url',
    type: 'string',
    default: 'wss://ws.dataengine.chain.link',
    sensitive: false,
  },
  API_USERNAME: {
    description: 'Data Engine API key (Authorization)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_PASSWORD: {
    description: 'Data Engine user secret for HMAC',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
