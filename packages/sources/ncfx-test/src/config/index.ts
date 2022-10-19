export const CRYPTO_DEFAULT_BASE_WS_URL = 'wss://feed.newchangefx.com/cryptodata'
export const FOREX_DEFAULT_BASE_WS_URL =
  'wss://fiat-ws.eu-west-2.apingxelb.v1.newchangefx.com/sub/fiat/ws/ref'

export const customSettings = {
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
    required: true,
  },
  FOREX_WS_PASSWORD: {
    description: 'Password for the Forex websocket endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
