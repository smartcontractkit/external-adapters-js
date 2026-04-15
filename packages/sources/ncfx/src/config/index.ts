import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_USERNAME: {
    description: 'Username for the NCFX Crypto API',
    type: 'string',
    sensitive: false,
  },
  API_PASSWORD: {
    description: 'Password for the NCFX Crypto API',
    type: 'string',
    sensitive: true,
  },
  FOREX_WS_API_KEY: {
    description: 'API key for Forex websocket endpoint',
    type: 'string',
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the crypto endpoint',
    default: 'wss://cryptofeed.ws.newchangefx.com',
    sensitive: false,
  },
  FOREX_WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the forex endpoint',
    default: 'wss://fiat.ws.newchangefx.com/sub/fiat/ws/ref',
    sensitive: false,
  },
  MARKET_STATUS_WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the market status endpoint',
    default: 'wss://fiat.ws.newchangefx.com/general/reference/v1/markethours',
    sensitive: false,
  },
  MARKET_STATUS_WS_API_KEY: {
    type: 'string',
    description: 'The WS API key to use for the market status endpoint',
    sensitive: true,
  },
  FOREX_CONTINUOUS_WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use for the forex-continuous (24/7) endpoint',
    default: 'wss://cryptofeed.ws.newchangefx.com/fiat_v1',
    sensitive: false,
  },
})
