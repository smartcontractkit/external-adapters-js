import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Gemini market price provider',
    type: 'string',
    default: 'wss://api.gemini.com/v2/marketdata',
  },
})
