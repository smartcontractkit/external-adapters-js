import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://api.polygon.io',
  },
  API_KEY: {
    description: 'An API key that can be obtained from [here](https://polygon.io/dashboard/signup)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
