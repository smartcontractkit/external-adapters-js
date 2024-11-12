import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const defaultEndpoint = 'price'
export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://api.tradingeconomics.com/markets',
  },
  WS_API_ENDPOINT: {
    description: 'The WS URL to retrieve data from',
    type: 'string',
    default: 'wss://stream.tradingeconomics.com/',
  },
  API_CLIENT_KEY: {
    description: 'The TradingEconomics API client key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_CLIENT_SECRET: {
    description: 'The TradingEconomics API client secret',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
})
