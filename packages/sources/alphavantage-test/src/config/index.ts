import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://www.alphavantage.co/query',
  },
  API_KEY: {
    description:
      'An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
