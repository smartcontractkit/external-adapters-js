import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for elwood',
    type: 'string',
    default: 'wss://api.chk.elwood.systems/v1/stream',
  },
  API_ENDPOINT: {
    description: 'The API url for elwood',
    type: 'string',
    default: 'https://api.chk.elwood.systems/v1/stream',
  },
})
