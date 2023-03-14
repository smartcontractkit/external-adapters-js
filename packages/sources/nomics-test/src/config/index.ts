import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key that can be obtained from https://p.nomics.com/pricing#free-plan',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for nomics',
    type: 'string',
    default: 'https://api.nomics.com/v1',
    required: false,
  },
})
