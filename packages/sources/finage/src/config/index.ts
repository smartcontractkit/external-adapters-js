import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API endpoint for Finage',
    default: 'https://api.finage.co.uk',
    type: 'string',
  },
  API_KEY: {
    type: 'string',
    required: true,
    sensitive: true,
    description: "An API key that can be obtained from the data provider's dashboard",
  },
  WS_SOCKET_KEY: {
    type: 'string',
    required: true,
    sensitive: true,
    description: "A WEBSOCKET key that can be obtained from the data provider's dashboard",
  },
  STOCK_WS_API_ENDPOINT: {
    type: 'string',
    default: 'wss://e4s39ar3mr.finage.ws:7002',
    description: 'The Websocket endpoint to connect to for stock data',
  },
  FOREX_WS_API_ENDPOINT: {
    type: 'string',
    default: 'wss://w29hxx2ndd.finage.ws:8001',
    description: 'The Websocket endpoint to connect to for forex data',
  },
  CRYPTO_WS_API_ENDPOINT: {
    type: 'string',
    default: 'wss://72x8wsyx7t.finage.ws:6008',
    description: 'The Websocket endpoint to connect to for crypto data',
  },
  ETF_WS_API_ENDPOINT: {
    type: 'string',
    default: 'wss://8umh1cipe9.finage.ws:9001',
    description: 'The Websocket endpoint to connect to for etf data',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
})
