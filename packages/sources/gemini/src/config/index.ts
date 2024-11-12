import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API endpoint of gemini',
    type: 'string',
    default: 'https://api.gemini.com',
  },
})
