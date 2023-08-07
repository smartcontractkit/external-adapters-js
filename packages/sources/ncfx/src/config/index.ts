import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_USERNAME: {
    description: 'Username for the NCFX API',
    type: 'string',
    required: true,
  },
  API_PASSWORD: {
    description: 'Password for the NCFX API',
    type: 'string',
    required: true,
    sensitive: true,
  },
  FOREX_WS_USERNAME: {
    description: 'Username for Forex websocket endpoint',
    type: 'string',
  },
  FOREX_WS_PASSWORD: {
    description: 'Password for the Forex websocket endpoint',
    type: 'string',
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the crypto endpoint',
    default: 'wss://cryptofeed.ws.newchangefx.com',
  },
  FOREX_WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the forex endpoint',
    default: 'wss://fiat-ws.eu-west-2.apingxelb.v1.newchangefx.com/sub/fiat/ws/ref',
  },
})
