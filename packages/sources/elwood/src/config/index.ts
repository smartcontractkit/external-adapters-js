import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

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
  SUBSCRIBE_DELAY_MS: {
    type: 'number',
    description:
      'The minimum time (ms) to wait before sending another subscription message to the /stream endpoint',
    default: 500,
    validate: validator.integer({ min: 0, max: 10_000 }),
  },
})
