import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  DATA_ENGINE_BASE_URL: {
    description: 'Data Engine REST base',
    default: 'https://api.dataengine.chain.link',
    type: 'string',
    required: true,
  },
  DATA_ENGINE_WS_URL: {
    description: 'Data Engine WS base',
    type: 'string',
    default: 'wss://ws.dataengine.chain.link',
    required: false,
  },
  DATA_ENGINE_USER_ID: {
    description: 'Data Engine API key (Authorization)',
    type: 'string',
    required: true,
  },
  DATA_ENGINE_USER_SECRET: {
    description: 'Data Engine user secret for HMAC',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
