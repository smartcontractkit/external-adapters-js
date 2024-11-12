import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'API key for REST endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ACCOUNT_ID: {
    description: 'API Account ID',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'Endpoint for REST prices',
    type: 'string',
    default: 'https://exchange-rates-api.oanda.com/v2',
  },
  INSTRUMENTS_API_ENDPOINT: {
    description: 'Endpoint for REST instruments list',
    type: 'string',
    default: 'https://api-fxtrade.oanda.com/v3',
  },
  SSE_API_KEY: {
    description: 'API key for SSE endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  SSE_API_ENDPOINT: {
    description: 'Endpoint for SSE streaming prices',
    type: 'string',
    default: 'https://stream-fxtrade.oanda.com/v3',
  },
})
